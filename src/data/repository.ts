import type { Ingredient, Recipe, RecipeInput } from '../domain/recipes.ts';

type SqlValue = string | number | null;

export interface KitchenDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}

const schema = `
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
`;

export async function initializeDatabase(db: KitchenDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (version?.user_version === 1) return;
  if (version?.user_version !== 0) throw new Error('这个数据库需要更新版本的 App。');

  await db.execAsync('BEGIN IMMEDIATE');
  try {
    await db.execAsync(schema);
    await db.execAsync('PRAGMA user_version = 1; COMMIT;');
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
  return { recipes };
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
  };
}

export type KitchenData = Awaited<ReturnType<typeof loadKitchen>>;
export type KitchenActions = ReturnType<typeof kitchenActions>;
