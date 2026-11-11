import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRecipe, extractRecipeLink, filterRecipes } from '../src/domain/recipes.ts';

const draft = {
  title: '番茄炒蛋',
  category: '家常菜',
  source: '',
  ingredients: [{ name: '番茄', quantity: '２００', unit: '克' }],
  steps: '切好番茄。\n\n炒鸡蛋和番茄。',
};

test('preserves a Xiaohongshu share URL and saves a link-only recipe as pending', () => {
  const url = 'https://xhslink.com/a/demo?x=1&y=2';
  assert.equal(extractRecipeLink(`复制这条分享 ${url}，打开小红书`), url);
  assert.equal(extractRecipeLink('https://xhslink.com.evil.test/a/demo'), null);
  assert.equal(extractRecipeLink('https://xhslink.com@evil.test/a/demo'), null);
  assert.equal(extractRecipeLink('https://xhslink.com/a\\evil'), null);
  const pending = buildRecipe({ ...draft, title: '', ingredients: [], steps: '', source: url });
  assert.equal(pending.sourceUrl, url);
  assert.equal(pending.pending, true);
  assert.equal(buildRecipe({ ...draft, source: url }).pending, false);
});

test('validates quantities, step lines and required manual recipe fields', () => {
  const recipe = buildRecipe(draft);
  assert.deepEqual(recipe.ingredients, [{ name: '番茄', quantity: 200, unit: '克' }]);
  assert.deepEqual(recipe.steps, ['切好番茄。', '炒鸡蛋和番茄。']);
  assert.throws(() => buildRecipe({ ...draft, steps: '' }), /步骤/);
  assert.throws(() => buildRecipe({ ...draft, ingredients: [{ name: '盐', quantity: '-1', unit: '克' }] }), /用量/);
});

test('searches title, category and ingredient and applies the favorite filter', () => {
  const recipes = [{ ...buildRecipe(draft), id: 1, favorite: true }];
  assert.equal(filterRecipes(recipes, '  番茄  家常 ', '家常菜', true).length, 1);
  assert.equal(filterRecipes(recipes, '鸡肉', null, false).length, 0);
  assert.equal(filterRecipes(recipes, '番茄', '甜点', false).length, 0);
});
