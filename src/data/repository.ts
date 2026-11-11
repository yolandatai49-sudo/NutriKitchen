import type { Ingredient, Recipe, RecipeInput } from '../domain/recipes.ts';
import type { MealInput, MealPlan } from '../domain/meals.ts';
import type { StockItem } from '../domain/inventory.ts';

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
`];

export async function initializeDatabase(db: KitchenDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
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
};

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
  return { recipes, meals, stock };
}

export function kitchenActions(db: KitchenDatabase) {
  return {
    async saveRecipe(input: RecipeInput, id?: number) {
      const params = [
        input.title, input.category, JSON.stringify(input.ingredients),
        JSON.stringify(input.steps), input.sourceUrl, Number(input.pending),
      ];
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
    async setFavorite(id: number, favorite: boolean) {
      await db.runAsync('UPDATE recipes SET favorite = ? WHERE id = ?', Number(favorite), id);
    },
    async deleteRecipe(id: number) {
      await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
    },
    async saveMeal(input: MealInput, id?: number) {
      return transaction(db, async () => {
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
      });
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
  };
}

export type KitchenData = Awaited<ReturnType<typeof loadKitchen>>;
export type KitchenActions = ReturnType<typeof kitchenActions>;
