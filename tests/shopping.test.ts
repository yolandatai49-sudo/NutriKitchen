import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adjustedShortages, isShortageChecked, shortageAmountKey } from '../src/domain/shopping.ts';

test('checks only the same meal and shortage amount', () => {
  const item = { key: 'tomato', name: '番茄', quantity: 250, unit: '克', needsReview: false };
  const checks = [{ mealId: 1, ingredientKey: item.key, amountKey: shortageAmountKey(item) }];
  assert.equal(isShortageChecked(checks, 1, item), true);
  assert.equal(isShortageChecked(checks, 2, item), false);
  assert.equal(isShortageChecked(checks, 1, { ...item, quantity: 500 }), false);
  assert.equal(isShortageChecked(checks, 1, { ...item, needsReview: true }), false);
});

test('applies edits and removals only while the calculated shortage still matches', () => {
  const source = { key: 'tomato', name: '番茄', quantity: 250, unit: '克', needsReview: false };
  const originalAmountKey = shortageAmountKey(source);
  const adjustment = {
    mealId: 1, ingredientKey: source.key, originalAmountKey,
    replacement: { name: '番茄', quantity: 2, unit: '个' },
  };
  assert.equal(adjustedShortages([source], [adjustment], 1)[0].unit, '个');
  assert.equal(adjustedShortages([source], [{ ...adjustment, replacement: null }], 1).length, 0);
  assert.equal(adjustedShortages([{ ...source, quantity: 300 }], [adjustment], 1)[0].quantity, 300);
  assert.equal(adjustedShortages([source], [adjustment], 2)[0].quantity, 250);
});
