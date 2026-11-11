import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { initializeDatabase, kitchenActions, loadKitchen, type KitchenDatabase } from '../src/data/repository.ts';
import { recipeCollection } from '../src/domain/recipe-collection.ts';
import { initializeDemoKitchen } from '../src/data/demo-kitchen.ts';
import { missingIngredients } from '../src/domain/inventory.ts';
import { recipesForMeal } from '../src/domain/meals.ts';

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

test('preserves version-one recipes while migrating all later tables', async () => {
  const { db, close } = open(':memory:');
  try {
    await db.execAsync(`
      CREATE TABLE recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL,
        ingredients TEXT NOT NULL, steps TEXT NOT NULL, source_url TEXT,
        pending INTEGER NOT NULL, favorite INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO recipes (title, category, ingredients, steps, pending) VALUES ('旧菜谱', '汤', '[]', '[]', 1);
      PRAGMA user_version = 1;
    `);
    await initializeDatabase(db);
    const data = await loadKitchen(db);
    assert.equal(data.recipes[0].title, '旧菜谱');
    assert.deepEqual(data.shoppingAdjustments, []);
    await initializeDatabase(db);
    assert.equal((await loadKitchen(db)).recipes.length, 1);
  } finally {
    close();
  }
});

test('saves and restores automatic shopping adjustments and removes them with the meal', async () => {
  const { db, close } = open(':memory:');
  try {
    await initializeDatabase(db);
    const actions = kitchenActions(db);
    const recipeId = await actions.saveRecipe({
      title: '汤', category: '汤', ingredients: [], steps: [], sourceUrl: null, pending: false,
    });
    const mealId = await actions.saveMeal({ name: '晚饭', day: '2026-11-10', recipeIds: [recipeId] });
    const edit = {
      mealId, ingredientKey: 'tomato', originalAmountKey: '250',
      replacement: { name: '番茄', quantity: 2, unit: '个' },
    };
    await actions.setShoppingAdjustment(edit);
    assert.deepEqual((await loadKitchen(db)).shoppingAdjustments, [edit]);
    await actions.setShoppingAdjustment({ ...edit, replacement: null });
    assert.equal((await loadKitchen(db)).shoppingAdjustments[0].replacement, null);
    await actions.resetShoppingAdjustments(mealId);
    assert.deepEqual((await loadKitchen(db)).shoppingAdjustments, []);
    await actions.setShoppingAdjustment(edit);
    await actions.deleteMeal(mealId);
    assert.deepEqual((await loadKitchen(db)).shoppingAdjustments, []);
  } finally {
    close();
  }
});

test('preserves the complete kitchen state after closing and reopening the database', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'nutrikitchen-test-'));
  const path = join(folder, 'kitchen.sqlite');
  let connection = open(path);
  try {
    await initializeDatabase(connection.db);
    const actions = kitchenActions(connection.db);
    const ingredient = { name: '番茄', quantity: 300, unit: '克' };
    const recipeId = await actions.saveRecipe({
      title: '番茄汤', category: '汤', ingredients: [ingredient], steps: ['煮。'], sourceUrl: null, pending: false,
    });
    const mealId = await actions.saveMeal({ name: '晚饭', day: '2026-11-10', recipeIds: [recipeId] });
    await actions.addStock({ ...ingredient, quantity: 100 });
    await actions.saveShoppingItem({ name: '厨房纸', quantity: 1, unit: '包' });
    const itemId = (await loadKitchen(connection.db)).shopping[0].id;
    await actions.setShoppingItemChecked(itemId, true);
    await actions.setShoppingCheck({ mealId, ingredientKey: 'tomato', amountKey: '200' }, true);
    await actions.setShoppingAdjustment({
      mealId, ingredientKey: 'tomato', originalAmountKey: '200',
      replacement: { name: '番茄', quantity: 2, unit: '个' },
    });
    await actions.saveNutritionEntry({
      day: '2026-11-10', name: '酸奶', grams: 150, per100: { kcal: 100, protein: 4, carbs: 8, fat: 3 },
    });
    const snapshot = await loadKitchen(connection.db);
    connection.close();
    connection = open(path);
    await initializeDatabase(connection.db);
    assert.deepEqual(await loadKitchen(connection.db), snapshot);
  } finally {
    connection.close();
    rmSync(folder, { recursive: true, force: true });
  }
});

test('imports each collection recipe once and preserves edits when it is imported again', async () => {
  const { db, close } = open(':memory:');
  try {
    await initializeDatabase(db);
    const actions = kitchenActions(db);
    const { key, recipe } = recipeCollection[0];
    const originalId = await actions.saveRecipe(recipe);
    const [first, second] = await Promise.all([
      actions.importRecipe(recipe, key),
      actions.importRecipe(recipe, key),
    ]);
    assert.equal(first, second);
    assert.notEqual(first, originalId);

    await actions.saveRecipe({ ...recipe, title: '我的番茄炒蛋' }, first);
    await actions.setFavorite(first, true);
    assert.equal(await actions.importRecipe(recipe, key), first);
    const { recipes } = await loadKitchen(db);
    assert.equal(recipes.length, 2);
    assert.deepEqual(recipes.find(({ id }) => id === first), {
      ...recipe, id: first, title: '我的番茄炒蛋', favorite: true, collectionKey: key,
    });

    await actions.deleteRecipe(first);
    assert.notEqual(await actions.importRecipe(recipe, key), first);
    assert.equal((await loadKitchen(db)).recipes.length, 2);
  } finally {
    close();
  }
});

test('opens a populated example kitchen independently from personal records', async () => {
  const example = open(':memory:');
  const personal = open(':memory:');
  try {
    await initializeDatabase(personal.db);
    await kitchenActions(personal.db).addStock({ name: '菠菜', quantity: 120, unit: '克' });
    const day = '2026-11-10';
    await initializeDemoKitchen(example.db, day);
    const demo = await loadKitchen(example.db);
    assert.ok(demo.recipes.some(({ title, favorite }) => title === '阳春面' && favorite));
    assert.equal(demo.meals.length, 3);
    assert.ok(demo.shopping.some(({ checked }) => checked));
    assert.ok(demo.shopping.some(({ checked }) => !checked));
    const planned = demo.meals[0];
    const dishes = recipesForMeal(planned, demo.recipes);
    const shortages = missingIngredients(dishes.flatMap(({ ingredients }) => ingredients), demo.stock);
    assert.equal(shortages.find(({ name }) => name === '黄牛肉')?.quantity, 150);
    assert.ok(demo.shoppingChecks.some(({ mealId }) => mealId === planned.id));
    assert.equal(new Set(demo.nutrition.map((entry) => entry.day)).size, 3);
    assert.ok(demo.nutrition.some((entry) => entry.day === day && entry.name === '番茄炒蛋'));
    await kitchenActions(example.db).addStock({ name: '酸奶', quantity: 1, unit: '盒' });
    assert.deepEqual((await loadKitchen(personal.db)).stock.map(({ name }) => name), ['菠菜']);
    assert.deepEqual((await loadKitchen(personal.db)).nutrition, []);
  } finally {
    example.close();
    personal.close();
  }
});
