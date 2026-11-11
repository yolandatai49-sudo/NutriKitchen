import { localDay, moveDay, parseDay } from './dates.ts';
import { readDecimal } from './recipes.ts';

export const nutritionFields = [
  { key: 'kcal', label: '热量', unit: '千卡' },
  { key: 'protein', label: '蛋白质', unit: '克' },
  { key: 'carbs', label: '碳水', unit: '克' },
  { key: 'fat', label: '脂肪', unit: '克' },
] as const;

type Nutrient = typeof nutritionFields[number]['key'];
export type Nutrients = Record<Nutrient, number>;
export type NutritionInput = { day: string; name: string; grams: number; per100: Nutrients };
export type NutritionEntry = NutritionInput & { id: number };

export function buildNutritionEntry(draft: {
  day: string;
  name: string;
  grams: string;
  per100: Record<Nutrient, string>;
  energyUnit: 'kcal' | 'kJ';
}): NutritionInput {
  const name = draft.name.trim();
  if (!name) throw new Error('请填写食物名称。');
  const grams = readDecimal(draft.grams);
  if (grams === null || grams <= 0 || grams > 100_000) throw new Error('食物重量须大于 0 克且不超过 100,000 克。');

  const per100 = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const { key, label } of nutritionFields) {
    const value = readDecimal(draft.per100[key]);
    const limit = key === 'kcal' ? (draft.energyUnit === 'kJ' ? 4184 : 1000) : 100;
    if (value === null || value > limit) {
      throw new Error(`请填写每 100 克的${label}，数值须在 0 到 ${limit} 之间。`);
    }
    per100[key] = key === 'kcal' && draft.energyUnit === 'kJ' ? value / 4.184 : value;
  }
  return { day: localDay(parseDay(draft.day)), name, grams, per100 };
}

export function nutritionForWeight(entry: NutritionInput): Nutrients {
  const ratio = entry.grams / 100;
  return {
    kcal: entry.per100.kcal * ratio,
    protein: entry.per100.protein * ratio,
    carbs: entry.per100.carbs * ratio,
    fat: entry.per100.fat * ratio,
  };
}

export function sumNutrition(entries: readonly NutritionInput[]): Nutrients {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const entry of entries) {
    const nutrients = nutritionForWeight(entry);
    for (const { key } of nutritionFields) total[key] += nutrients[key];
  }
  return total;
}

export function nutritionWeek(entries: readonly NutritionEntry[], day: string) {
  const weekday = (parseDay(day).getDay() + 6) % 7;
  const firstDay = moveDay(day, -weekday);
  const lastDay = moveDay(firstDay, 6);
  const withinWeek = entries.filter((entry) => entry.day >= firstDay && entry.day <= lastDay);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = moveDay(firstDay, index);
    const daily = withinWeek.filter((entry) => entry.day === date);
    return { date, count: daily.length, total: sumNutrition(daily) };
  });
  return { firstDay, lastDay, days, total: sumNutrition(withinWeek) };
}

function escapeFoodName(name: string): string {
  const safe = /^[\t\r\n]|^\s*[=+@-]/.test(name) ? `'${name}` : name;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function nutritionCsv(entries: readonly NutritionEntry[]): string {
  const header = '日期,食物,重量(克),热量(千卡),蛋白质(克),碳水(克),脂肪(克),每100克热量(千卡),每100克蛋白质(克),每100克碳水(克),每100克脂肪(克)';
  const rows = [...entries].sort((a, b) => a.day.localeCompare(b.day) || a.id - b.id).map((entry) => {
    const totals = nutritionForWeight(entry);
    const numbers = [
      entry.grams, ...nutritionFields.map(({ key }) => totals[key]),
      ...nutritionFields.map(({ key }) => entry.per100[key]),
    ].map((value) => Number(value.toFixed(6)));
    return [entry.day, escapeFoodName(entry.name), ...numbers].join(',');
  });
  return '\uFEFF' + [header, ...rows].join('\r\n') + '\r\n';
}

export function formatNutrient(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value);
}
