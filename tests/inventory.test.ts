import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchRecipes, missingIngredients } from '../src/domain/inventory.ts';

test('adds quantities across recipes, converts units, then subtracts combined stock once', () => {
  const needed = [
    { name: '番茄', quantity: 0.3, unit: '公斤' },
    { name: ' 番茄 ', quantity: 250, unit: 'g' },
    { name: '番茄', quantity: null, unit: '' },
    { name: '鸡蛋', quantity: null, unit: '' },
  ];
  const stock = [
    { name: '番茄', quantity: 0.2, unit: 'kg' },
    { name: '番茄', quantity: 50, unit: '克' },
    { name: '鸡蛋', quantity: null, unit: '' },
  ];
  const missing = missingIngredients(needed, stock);
  assert.deepEqual(missing.map(({ name, quantity, unit, needsReview }) => ({ name, quantity, unit, needsReview })), [
    { name: '番茄', quantity: 300, unit: '克', needsReview: false },
  ]);
});

test('flags unknown and incompatible quantities without converting across dimensions', () => {
  const stock = [{ name: '牛奶', quantity: 1, unit: '盒' }];
  const ingredients = [{ name: '牛奶', quantity: 200, unit: '毫升' }];
  const [match] = matchRecipes([
    { id: 1, title: '牛奶', category: '饮品', ingredients, steps: ['倒入。'], sourceUrl: null, pending: false, favorite: false },
  ], stock);
  assert.equal(match.available, 0);
  assert.equal(match.missing[0].needsReview, true);
  assert.equal(match.missing[0].quantity, 200);
  assert.equal(missingIngredients(ingredients, [{ name: '牛奶', quantity: 0.2, unit: 'L' }]).length, 0);
  assert.equal(missingIngredients(ingredients, [{ name: '牛奶', quantity: null, unit: '' }])[0].needsReview, true);
});

test('matches a built-in ingredient against stock entered in English', () => {
  const required = [
    { name: '番茄', quantity: 300, unit: '克' },
    { name: '鸡蛋', quantity: 3, unit: '个' },
  ];
  const stock = [
    { name: 'Tomatoes', quantity: 100, unit: 'g' },
    { name: 'eggs', quantity: 3, unit: 'each' },
  ];
  assert.deepEqual(missingIngredients(required, stock).map(({ name, quantity }) => [name, quantity]), [['番茄', 200]]);
});
