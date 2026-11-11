import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNutritionEntry, nutritionCsv, nutritionForWeight, nutritionWeek, sumNutrition, type NutritionEntry } from '../src/domain/nutrition.ts';

const draft = {
  day: '2026-11-10',
  name: '酸奶',
  grams: '150',
  per100: { kcal: '418.4', protein: '4', carbs: '8', fat: '3' },
  energyUnit: 'kJ' as const,
};

test('converts kJ and scales each nutrient by actual grams', () => {
  const input = buildNutritionEntry(draft);
  assert.ok(Math.abs(input.per100.kcal - 100) < 1e-10);
  const result = nutritionForWeight(input);
  assert.ok(Math.abs(result.kcal - 150) < 1e-10);
  assert.deepEqual([result.protein, result.carbs, result.fat], [6, 12, 4.5]);
  assert.throws(() => buildNutritionEntry({ ...draft, grams: '0' }), /重量/);
  assert.throws(() => buildNutritionEntry({ ...draft, per100: { ...draft.per100, fat: '' } }), /脂肪/);
});

test('sums only the Monday to Sunday containing the selected date across a year boundary', () => {
  const sample = buildNutritionEntry({ ...draft, energyUnit: 'kcal', per100: { ...draft.per100, kcal: '100' } });
  const days = ['2025-12-28', '2025-12-29', '2026-01-01', '2026-01-04', '2026-01-05'];
  const entries = days.map((day, index) => ({ ...sample, day, id: index + 1 }));
  const week = nutritionWeek(entries, '2026-01-01');
  assert.equal(week.firstDay, '2025-12-29');
  assert.equal(week.lastDay, '2026-01-04');
  assert.deepEqual(week.days.map((item) => item.count), [1, 0, 0, 1, 0, 0, 1]);
  assert.deepEqual(week.total, { kcal: 450, protein: 18, carbs: 36, fat: 13.5 });
  assert.equal(sumNutrition([entries[2]]).kcal, 150);
});

test('exports UTF-8 CSV with escaped quotes and neutralized spreadsheet formulas', () => {
  const entry: NutritionEntry = { ...buildNutritionEntry(draft), name: '=示例,"酸奶"', id: 1 };
  const output = nutritionCsv([entry]);
  assert.ok(output.startsWith('\uFEFF日期,食物'));
  assert.ok(output.includes(`2026-11-10,"'=示例,""酸奶""",150,150,6,12,4.5,100,4,8,3\r\n`));
});
