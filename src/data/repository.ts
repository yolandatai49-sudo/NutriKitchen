import { localDay, moveDay } from '../domain/dates.ts';
import { findCollectionRecipe } from '../domain/recipe-collection.ts';
import { starterNutrition, starterRecipeKeys, starterShopping, starterStock } from './starter-kitchen.ts';
import type { Ingredient, Recipe, RecipeInput } from '../domain/recipes.ts';
import type { MealInput, MealPlan } from '../domain/meals.ts';
import type { StockItem } from '../domain/inventory.ts';
import type { ShoppingAdjustment, ShoppingCheck, ShoppingItem } from '../domain/shopping.ts';
import type { NutritionEntry, NutritionInput } from '../domain/nutrition.ts';

type SqlValue = string | number | null;

export interface KitchenDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}

const migrations = [`
  CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    source_url TEXT,
    pending INTEGER NOT NULL CHECK (pending IN (0, 1)),
    favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1))
  );
`, `
  CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    day TEXT NOT NULL
  );
  CREATE TABLE meal_recipes (
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (meal_id, recipe_id)
  );
  CREATE INDEX meal_recipes_recipe ON meal_recipes(recipe_id);
`, `
  CREATE TABLE stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL CHECK (quantity > 0),
    unit TEXT NOT NULL
  );
`, `
  CREATE TABLE shopping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1))
  );
  CREATE TABLE shopping_checks (
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_key TEXT NOT NULL,
    amount_key TEXT NOT NULL,
    PRIMARY KEY (meal_id, ingredient_key)
  );
`, `
  CREATE TABLE nutrition_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    name TEXT NOT NULL,
    grams REAL NOT NULL CHECK (grams > 0),
    kcal REAL NOT NULL CHECK (kcal >= 0),
    protein REAL NOT NULL CHECK (protein >= 0),
    carbs REAL NOT NULL CHECK (carbs >= 0),
    fat REAL NOT NULL CHECK (fat >= 0)
  );
  CREATE INDEX nutrition_day ON nutrition_entries(day DESC, id DESC);
`, `
  CREATE TABLE shopping_adjustments (
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_key TEXT NOT NULL,
    original_amount_key TEXT NOT NULL,
    replacement TEXT,
    PRIMARY KEY (meal_id, ingredient_key)
  );
`, `
  ALTER TABLE recipes ADD COLUMN collection_key TEXT;
  CREATE UNIQUE INDEX recipes_collection_key ON recipes(collection_key);
`, `
  CREATE TABLE kitchen_setup (key TEXT PRIMARY KEY NOT NULL);
  ALTER TABLE nutrition_entries ADD COLUMN is_starter INTEGER NOT NULL DEFAULT 0 CHECK (is_starter IN (0, 1));
`];

export async function initializeDatabase(db: KitchenDatabase) {
  await db.execAsync('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await transaction(db, async () => {
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!version || version.user_version > migrations.length) throw new Error('这个数据库需要更新版本的 App。');
    for (let index = version.user_version; index < migrations.length; index++) {
      await db.execAsync(migrations[index]);
    }
    await db.execAsync(`PRAGMA user_version = ${migrations.length}`);
  });
}

async function transaction<T>(db: KitchenDatabase, operation: () => Promise<T>): Promise<T> {
  await db.execAsync('BEGIN IMMEDIATE');
  try {
    const result = await operation();
    await db.execAsync('COMMIT');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

type RecipeRow = {
  id: number;
  title: string;
  category: string;
  ingredients: string;
  steps: string;
  source_url: string | null;
  pending: number;
  favorite: number;
  collection_key: string | null;
};

function recipeValues(input: RecipeInput) {
  return [
    input.title, input.category, JSON.stringify(input.ingredients),
    JSON.stringify(input.steps), input.sourceUrl, Number(input.pending),
  ];
}

export async function loadKitchen(db: KitchenDatabase) {
  const rows = await db.getAllAsync<RecipeRow>('SELECT * FROM recipes ORDER BY id DESC');
  const recipes: Recipe[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    ingredients: JSON.parse(row.ingredients) as Ingredient[],
    steps: JSON.parse(row.steps) as string[],
    sourceUrl: row.source_url,
    pending: Boolean(row.pending),
    favorite: Boolean(row.favorite),
    ...(row.collection_key === null ? {} : { collectionKey: row.collection_key }),
  }));
  const mealRows = await db.getAllAsync<Omit<MealPlan, 'recipeIds'>>('SELECT * FROM meals ORDER BY id DESC');
  const selections = await db.getAllAsync<{ meal_id: number; recipe_id: number }>(
    'SELECT meal_id, recipe_id FROM meal_recipes ORDER BY meal_id, position',
  );
  const recipeIdsByMeal = new Map<number, number[]>();
  for (const { meal_id, recipe_id } of selections) {
    const ids = recipeIdsByMeal.get(meal_id) ?? [];
    ids.push(recipe_id);
    recipeIdsByMeal.set(meal_id, ids);
  }
  const meals: MealPlan[] = mealRows.map((meal) => ({ ...meal, recipeIds: recipeIdsByMeal.get(meal.id) ?? [] }));
  const stock = await db.getAllAsync<StockItem>('SELECT * FROM stock ORDER BY id DESC');
  const shoppingRows = await db.getAllAsync<Omit<ShoppingItem, 'checked'> & { checked: number }>(
    'SELECT * FROM shopping_items ORDER BY id DESC',
  );
  const shopping = shoppingRows.map((item) => ({ ...item, checked: Boolean(item.checked) }));
  const shoppingChecks = await db.getAllAsync<ShoppingCheck>(
    'SELECT meal_id AS mealId, ingredient_key AS ingredientKey, amount_key AS amountKey FROM shopping_checks',
  );
  const nutritionRows = await db.getAllAsync<Omit<NutritionEntry, 'per100' | 'starter'> & NutritionEntry['per100'] & { is_starter: number }>(
    'SELECT * FROM nutrition_entries ORDER BY day DESC, id DESC',
  );
  const nutrition = nutritionRows.map(({ kcal, protein, carbs, fat, is_starter, ...entry }) => ({
    ...entry, per100: { kcal, protein, carbs, fat }, ...(is_starter ? { starter: true as const } : {}),
  }));
  const adjustmentRows = await db.getAllAsync<Omit<ShoppingAdjustment, 'replacement'> & { replacement: string | null }>(
    `SELECT meal_id AS mealId, ingredient_key AS ingredientKey, original_amount_key AS originalAmountKey, replacement
     FROM shopping_adjustments`,
  );
  const shoppingAdjustments = adjustmentRows.map((row) => ({
    ...row, replacement: row.replacement === null ? null : JSON.parse(row.replacement) as Ingredient,
  }));
  return { recipes, meals, stock, shopping, shoppingChecks, nutrition, shoppingAdjustments };
}

async function writeMeal(db: KitchenDatabase, input: MealInput, id?: number) {
  let mealId = id;
  if (mealId === undefined) {
    const result = await db.runAsync('INSERT INTO meals (name, day) VALUES (?, ?)', input.name, input.day);
    mealId = result.lastInsertRowId;
  } else {
    await db.runAsync('UPDATE meals SET name = ?, day = ? WHERE id = ?', input.name, input.day, mealId);
    await db.runAsync('DELETE FROM meal_recipes WHERE meal_id = ?', mealId);
  }
  for (const [position, recipeId] of input.recipeIds.entries()) {
    await db.runAsync('INSERT INTO meal_recipes VALUES (?, ?, ?)', mealId, recipeId, position);
  }
  return mealId;
}

async function writeNutrition(db: KitchenDatabase, input: NutritionInput, starter: boolean, id?: number) {
  const { kcal, protein, carbs, fat } = input.per100;
  const params = [input.day, input.name, input.grams, kcal, protein, carbs, fat, Number(starter)];
  if (id === undefined) {
    await db.runAsync(
      'INSERT INTO nutrition_entries (day, name, grams, kcal, protein, carbs, fat, is_starter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ...params,
    );
  } else {
    await db.runAsync(
      'UPDATE nutrition_entries SET day = ?, name = ?, grams = ?, kcal = ?, protein = ?, carbs = ?, fat = ?, is_starter = ? WHERE id = ?',
      ...params, id,
    );
  }
}

export function kitchenActions(db: KitchenDatabase) {
  return {
    async saveRecipe(input: RecipeInput, id?: number) {
      const params = recipeValues(input);
      if (id !== undefined) {
        await db.runAsync(
          'UPDATE recipes SET title = ?, category = ?, ingredients = ?, steps = ?, source_url = ?, pending = ? WHERE id = ?',
          ...params, id,
        );
        return id;
      }
      const result = await db.runAsync(
        'INSERT INTO recipes (title, category, ingredients, steps, source_url, pending) VALUES (?, ?, ?, ?, ?, ?)',
        ...params,
      );
      return result.lastInsertRowId;
    },
    async importRecipe(input: RecipeInput, collectionKey: string) {
      const row = await db.getFirstAsync<{ id: number }>(
        `INSERT INTO recipes (title, category, ingredients, steps, source_url, pending, collection_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(collection_key) DO UPDATE SET collection_key = excluded.collection_key
         RETURNING id`,
        ...recipeValues(input), collectionKey,
      );
      if (!row) throw new Error('无法收入菜谱，请重试。');
      return row.id;
    },
    async setFavorite(id: number, favorite: boolean) {
      await db.runAsync('UPDATE recipes SET favorite = ? WHERE id = ?', Number(favorite), id);
    },
    async deleteRecipe(id: number) {
      await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
    },
    async saveMeal(input: MealInput, id?: number) {
      return transaction(db, () => writeMeal(db, input, id));
    },
    async deleteMeal(id: number) {
      await db.runAsync('DELETE FROM meals WHERE id = ?', id);
    },
    async addStock(input: Ingredient) {
      await db.runAsync('INSERT INTO stock (name, quantity, unit) VALUES (?, ?, ?)', input.name, input.quantity, input.unit);
    },
    async deleteStock(id: number) {
      await db.runAsync('DELETE FROM stock WHERE id = ?', id);
    },
    async saveShoppingItem(input: Ingredient, id?: number) {
      if (id === undefined) {
        await db.runAsync(
          'INSERT INTO shopping_items (name, quantity, unit) VALUES (?, ?, ?)', input.name, input.quantity, input.unit,
        );
      } else {
        await db.runAsync(
          'UPDATE shopping_items SET name = ?, quantity = ?, unit = ? WHERE id = ?', input.name, input.quantity, input.unit, id,
        );
      }
    },
    async setShoppingItemChecked(id: number, checked: boolean) {
      await db.runAsync('UPDATE shopping_items SET checked = ? WHERE id = ?', Number(checked), id);
    },
    async deleteShoppingItem(id: number) {
      await db.runAsync('DELETE FROM shopping_items WHERE id = ?', id);
    },
    async setShoppingCheck(check: ShoppingCheck, checked: boolean) {
      if (checked) {
        await db.runAsync(
          `INSERT INTO shopping_checks (meal_id, ingredient_key, amount_key) VALUES (?, ?, ?)
           ON CONFLICT (meal_id, ingredient_key) DO UPDATE SET amount_key = excluded.amount_key`,
          check.mealId, check.ingredientKey, check.amountKey,
        );
      } else {
        await db.runAsync(
          'DELETE FROM shopping_checks WHERE meal_id = ? AND ingredient_key = ?', check.mealId, check.ingredientKey,
        );
      }
    },
    async saveNutritionEntry(input: NutritionInput, id?: number) {
      await transaction(db, async () => {
        await writeNutrition(db, input, false, id);
        await db.runAsync('DELETE FROM nutrition_entries WHERE is_starter = 1');
      });
    },
    async deleteNutritionEntry(id: number) {
      await db.runAsync('DELETE FROM nutrition_entries WHERE id = ?', id);
    },
    async setShoppingAdjustment(input: ShoppingAdjustment) {
      await db.runAsync(
        `INSERT INTO shopping_adjustments VALUES (?, ?, ?, ?)
         ON CONFLICT (meal_id, ingredient_key) DO UPDATE SET
         original_amount_key = excluded.original_amount_key, replacement = excluded.replacement`,
        input.mealId, input.ingredientKey, input.originalAmountKey,
        input.replacement === null ? null : JSON.stringify(input.replacement),
      );
    },
    async resetShoppingAdjustments(mealId: number) {
      await transaction(db, async () => {
        await db.runAsync('DELETE FROM shopping_adjustments WHERE meal_id = ?', mealId);
        await db.runAsync('DELETE FROM shopping_checks WHERE meal_id = ?', mealId);
      });
    },
  };
}

export type KitchenData = Awaited<ReturnType<typeof loadKitchen>>;
export type KitchenActions = ReturnType<typeof kitchenActions>;

export async function initializeKitchen(db: KitchenDatabase, today = localDay()) {
  await initializeDatabase(db);
  await transaction(db, async () => {
    const seeded = await db.getFirstAsync("SELECT key FROM kitchen_setup WHERE key = 'starter-content'");
    if (seeded) return;
    const actions = kitchenActions(db);
    const kitchen = await loadKitchen(db);
    const starterIds = new Map(kitchen.recipes.flatMap(({ collectionKey, id }) => collectionKey ? [[collectionKey, id] as const] : []));

    async function saveStarterRecipe(key: string) {
      const entry = findCollectionRecipe(key);
      if (!entry) throw new Error(`Unknown starter recipe: ${key}`);
      const id = await actions.importRecipe(entry.recipe, key);
      starterIds.set(key, id);
      return id;
    }

    if (!kitchen.recipes.length) {
      for (const key of starterRecipeKeys) {
        const id = await saveStarterRecipe(key);
        if (key !== 'steamed-tofu') await actions.setFavorite(id, true);
      }
    }
    if (!kitchen.meals.length) {
      const select = async (keys: string[]) => {
        const ids: number[] = [];
        for (const key of keys) ids.push(starterIds.get(key) ?? await saveStarterRecipe(key));
        return ids;
      };
      await writeMeal(db, { name: '工作日午饭', day: today, recipeIds: await select(['yangchun-noodles', 'tomato-eggs']) });
      await writeMeal(db, { name: '两人家常晚餐', day: moveDay(today, 1), recipeIds: await select(['hunan-beef', 'steamed-tofu']) });
    }
    if (!kitchen.stock.length) {
      for (const item of starterStock) await actions.addStock(item);
    }
    if (!kitchen.shopping.length) {
      for (const item of starterShopping) await db.runAsync(
        'INSERT INTO shopping_items (name, quantity, unit, checked) VALUES (?, ?, ?, ?)',
        item.name, item.quantity, item.unit, Number(!!item.checked),
      );
    }
    if (!kitchen.nutrition.length) {
      for (const entry of starterNutrition(today)) await writeNutrition(db, entry, true);
    }
    await db.runAsync("INSERT INTO kitchen_setup (key) VALUES ('starter-content')");
  });
}
