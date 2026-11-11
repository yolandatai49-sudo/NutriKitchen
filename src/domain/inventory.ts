import { normalizeName, type Ingredient, type Recipe } from './recipes.ts';

import { canonicalFoodName, englishUnit } from './recipe-translations.ts';

export type StockItem = Ingredient & { id: number };
export type MissingIngredient = Ingredient & { key: string; needsReview: boolean };

function canonicalAmount(item: Ingredient): Ingredient {
  if (item.quantity === null) return { ...item, unit: '' };
  const unit = normalizeName(item.unit);
  switch (unit) {
    case 'g':
    case '克':
      return { ...item, unit: '克' };
    case 'kg':
    case '千克':
    case '公斤':
      return { ...item, unit: '克', quantity: item.quantity * 1000 };
    case 'ml':
    case '毫升':
      return { ...item, unit: '毫升' };
    case 'l':
    case '升':
      return { ...item, unit: '毫升', quantity: item.quantity * 1000 };
    case 'each':
    case 'piece':
    case 'pieces':
    case '个':
      return { ...item, unit: '个' };
    default:
      return { ...item, unit };
  }
}

export function formatAmount(item: Ingredient, english = false): string {
  if (item.quantity === null) return english ? 'As needed' : '按需';
  const formatted = Number(item.quantity.toPrecision(12));
  return `${formatted} ${english ? englishUnit(item.unit) : item.unit}`.trim();
}

function ingredientNameKey(name: string) {
  return canonicalFoodName(normalizeName(name));
}

export function missingIngredients(
  required: readonly Ingredient[],
  stock: readonly Ingredient[],
): MissingIngredient[] {
  const needs = new Map<string, Ingredient>();
  const stocked = new Map<string, Ingredient[]>();

  for (const raw of required) {
    const item = canonicalAmount(raw);
    const key = JSON.stringify([ingredientNameKey(item.name), item.unit]);
    const previous = needs.get(key);
    if (!previous) needs.set(key, item);
    else if (item.quantity !== null) previous.quantity = (previous.quantity ?? 0) + item.quantity;
  }
  for (const raw of stock) {
    const item = canonicalAmount(raw);
    const key = ingredientNameKey(item.name);
    const entries = stocked.get(key) ?? [];
    entries.push(item);
    stocked.set(key, entries);
  }

  const missing: MissingIngredient[] = [];
  for (const [key, need] of needs) {
    const existing = stocked.get(ingredientNameKey(need.name)) ?? [];
    if (need.quantity === null) {
      if (!existing.length) missing.push({ ...need, key, needsReview: false });
      continue;
    }
    const known = existing.reduce(
      (total, item) => item.unit === need.unit ? total + (item.quantity ?? 0) : total, 0,
    );
    const remainder = need.quantity - known;
    if (remainder <= Number.EPSILON * 8 * need.quantity) continue;
    missing.push({
      ...need,
      quantity: Number(remainder.toPrecision(12)),
      key,
      needsReview: existing.some((item) => item.quantity === null || item.unit !== need.unit),
    });
  }
  const quantifiedNames = new Set(
    missing.filter((item) => item.quantity !== null).map((item) => ingredientNameKey(item.name)),
  );
  return missing.filter((item) => item.quantity !== null || !quantifiedNames.has(ingredientNameKey(item.name)));
}

export function matchRecipes(recipes: readonly Recipe[], stock: readonly Ingredient[]) {
  return recipes.filter((recipe) => recipe.ingredients.length).map((recipe) => {
    const total = new Set(recipe.ingredients.map((item) => ingredientNameKey(item.name))).size;
    const missing = missingIngredients(recipe.ingredients, stock);
    const available = total - new Set(missing.map((item) => ingredientNameKey(item.name))).size;
    return { recipe, total, available, missing };
  }).sort((a, b) => b.available / b.total - a.available / a.total || b.available - a.available);
}
