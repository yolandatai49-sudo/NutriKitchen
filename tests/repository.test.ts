import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { initializeDatabase, kitchenActions, loadKitchen, type KitchenDatabase } from '../src/data/repository.ts';

function open(path: string) {
  const native = new DatabaseSync(path);
  const db: KitchenDatabase = {
    async execAsync(sql) { native.exec(sql); },
    async runAsync(sql, ...params) {
      const { lastInsertRowid } = native.prepare(sql).run(...params);
      return { lastInsertRowId: Number(lastInsertRowid) };
    },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return native.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return (native.prepare(sql).get(...params) as T | undefined) ?? null;
    },
  };
  return { db, close: () => native.close() };
}

test('saves, edits, favorites and deletes recipes in a reopened SQLite file', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'nutrikitchen-test-'));
  const path = join(folder, 'test.sqlite');
  let connection = open(path);
  try {
    await initializeDatabase(connection.db);
    const recipe = {
      title: "奶奶的'汤",
      category: '汤',
      ingredients: [{ name: '番茄', quantity: 200, unit: '克' }],
      steps: ['煮熟。'],
      sourceUrl: null,
      pending: false,
    };
    const actions = kitchenActions(connection.db);
    const id = await actions.saveRecipe(recipe);
    await actions.setFavorite(id, true);
    await actions.saveRecipe({ ...recipe, title: '番茄汤' }, id);
    connection.close();
    connection = open(path);
    await initializeDatabase(connection.db);
    assert.deepEqual((await loadKitchen(connection.db)).recipes, [{ ...recipe, id, title: '番茄汤', favorite: true }]);
    await kitchenActions(connection.db).deleteRecipe(id);
    assert.deepEqual((await loadKitchen(connection.db)).recipes, []);
  } finally {
    connection.close();
    rmSync(folder, { recursive: true, force: true });
  }
});

test('stores menu selection order and rolls back changes if a selected recipe is missing', async () => {
  const { db, close } = open(':memory:');
  try {
    await initializeDatabase(db);
    const actions = kitchenActions(db);
    const recipe = {
      title: '番茄汤', category: '汤', ingredients: [], steps: [], sourceUrl: null, pending: false,
    };
    const soup = await actions.saveRecipe(recipe);
    const rice = await actions.saveRecipe({ ...recipe, title: '米饭' });
    const meal = { name: '周末晚餐', day: '2026-11-15', recipeIds: [rice, soup] };
    const id = await actions.saveMeal(meal);
    await assert.rejects(actions.saveMeal({ ...meal, name: '改名', recipeIds: [soup, 999] }, id), /FOREIGN KEY/);
    assert.deepEqual((await loadKitchen(db)).meals, [{ ...meal, id }]);
    await actions.deleteRecipe(rice);
    assert.deepEqual((await loadKitchen(db)).meals[0].recipeIds, [soup]);
    await actions.deleteMeal(id);
    assert.deepEqual((await loadKitchen(db)).meals, []);
  } finally {
    close();
  }
});
