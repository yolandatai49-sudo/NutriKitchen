import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMeal } from '../src/domain/meals.ts';

test('checks the meal date and keeps the first selection order', () => {
  assert.deepEqual(buildMeal(' 晚饭 ', '2028-02-29', [2, 1, 2]), {
    name: '晚饭', day: '2028-02-29', recipeIds: [2, 1],
  });
  assert.throws(() => buildMeal('晚饭', '2026-02-29', [1]), /日期/);
  assert.throws(() => buildMeal('晚饭', '2026-11-10', []), /选择/);
});
