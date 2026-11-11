import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isShortageChecked, shortageAmountKey } from '../src/domain/shopping.ts';

test('checks only the same meal and shortage amount', () => {
  const item = { key: 'tomato', name: '番茄', quantity: 250, unit: '克', needsReview: false };
  const checks = [{ mealId: 1, ingredientKey: item.key, amountKey: shortageAmountKey(item) }];
  assert.equal(isShortageChecked(checks, 1, item), true);
  assert.equal(isShortageChecked(checks, 2, item), false);
  assert.equal(isShortageChecked(checks, 1, { ...item, quantity: 500 }), false);
  assert.equal(isShortageChecked(checks, 1, { ...item, needsReview: true }), false);
});
