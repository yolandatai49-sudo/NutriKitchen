import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localizeCollection, presentRecipe, recipeCollection } from '../src/domain/recipe-collection.ts';

test('includes thirty unique, complete recipes and a full English edition', () => {
  assert.equal(recipeCollection.length, 30);
  assert.equal(new Set(recipeCollection.map(({ key }) => key)).size, 30);
  assert.equal(recipeCollection.filter(({ region }) => region === 'american').length, 11);
  for (const entry of recipeCollection) {
    const { recipe: english } = localizeCollection(entry, true);
    assert.ok(english.title && !/\p{Script=Han}/u.test(english.title), entry.key);
    assert.equal(english.steps.length, entry.recipe.steps.length);
    assert.ok(english.steps.every((step) => step && !/\p{Script=Han}/u.test(step)), entry.key);
    assert.ok(english.ingredients.every(({ name, quantity, unit }) => quantity && !/\p{Script=Han}/u.test(name + unit)), entry.key);
  }
});

test('localizes a saved built-in recipe without overwriting user edits', () => {
  const entry = recipeCollection[0];
  const edited = { ...entry.recipe, title: '奶奶的版本', steps: ['我自己的做法'] };
  const translated = presentRecipe(edited, entry, true);
  assert.equal(translated.title, edited.title);
  assert.deepEqual(translated.steps, edited.steps);
  assert.equal(translated.ingredients[0].name, 'Tomatoes');
  assert.equal(edited.ingredients[0].name, '番茄');
});
