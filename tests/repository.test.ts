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
      return native.prepare(sql).all(...params).map((row) => ({ ...row }) as T);
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      const row = native.prepare(sql).get(...params);
      return row ? ({ ...row } as T) : null;
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

test('updates stock and manual shopping items and stores checked shortages per meal', async () => {
  const { db, close } = open(':memory:');
  try {
    await initializeDatabase(db);
    const actions = kitchenActions(db);
    const ingredient = { name: '番茄', quantity: 250, unit: '克' };
    await actions.addStock(ingredient);
    const stock = (await loadKitchen(db)).stock[0];
    assert.deepEqual(stock, { ...ingredient, id: 1 });
    await actions.deleteStock(stock.id);
    const recipeId = await actions.saveRecipe({
      title: '番茄汤', category: '汤', ingredients: [ingredient], steps: ['煮。'], sourceUrl: null, pending: false,
    });
    const mealId = await actions.saveMeal({ name: '午饭', day: '2026-11-10', recipeIds: [recipeId] });
    const check = { mealId, ingredientKey: 'tomato', amountKey: '250' };
    await actions.setShoppingCheck(check, true);
    await actions.setShoppingCheck({ ...check, amountKey: '200' }, true);
    await actions.saveShoppingItem(ingredient);
    const itemId = (await loadKitchen(db)).shopping[0].id;
    await actions.setShoppingItemChecked(itemId, true);
    await actions.saveShoppingItem({ ...ingredient, quantity: 500 }, itemId);

    const data = await loadKitchen(db);
    assert.deepEqual(data.stock, []);
    assert.deepEqual(data.shoppingChecks, [{ ...check, amountKey: '200' }]);
    assert.deepEqual(data.shopping, [{ ...ingredient, id: itemId, quantity: 500, checked: true }]);
    await actions.deleteShoppingItem(itemId);
    await actions.deleteMeal(mealId);
    const deleted = await loadKitchen(db);
    assert.deepEqual(deleted.shopping, []);
    assert.deepEqual(deleted.shoppingChecks, []);
  } finally {
    close();
  }
});

test('persists nutritional label values and can edit or delete an entry', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'nutrikitchen-test-'));
  const path = join(folder, 'nutrition.sqlite');
  let connection = open(path);
  try {
    await initializeDatabase(connection.db);
    const entry = {
      day: '2026-11-10', name: '酸奶', grams: 150, per100: { kcal: 96.5, protein: 4, carbs: 6.7, fat: 0 },
    };
    await kitchenActions(connection.db).saveNutritionEntry(entry);
    const id = (await loadKitchen(connection.db)).nutrition[0].id;
    connection.close();
    connection = open(path);
    await initializeDatabase(connection.db);
    assert.deepEqual((await loadKitchen(connection.db)).nutrition, [{ ...entry, id }]);
    await kitchenActions(connection.db).saveNutritionEntry({ ...entry, grams: 75 }, id);
    assert.equal((await loadKitchen(connection.db)).nutrition[0].grams, 75);
    await kitchenActions(connection.db).deleteNutritionEntry(id);
    assert.deepEqual((await loadKitchen(connection.db)).nutrition, []);
  } finally {
    connection.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
