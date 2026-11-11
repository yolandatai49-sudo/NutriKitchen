import type { MissingIngredient } from './inventory.ts';
import type { Ingredient } from './recipes.ts';

export type ShoppingItem = Ingredient & { id: number; checked: boolean };
export type ShoppingCheck = { mealId: number; ingredientKey: string; amountKey: string };
export type ShoppingAdjustment = {
  mealId: number;
  ingredientKey: string;
  originalAmountKey: string;
  replacement: Ingredient | null;
};
export type ShoppingShortage = MissingIngredient & { originalAmountKey: string; adjusted: boolean };

export function shortageAmountKey(item: MissingIngredient): string {
  return JSON.stringify([item.name, item.quantity, item.unit, item.needsReview]);
}

export function adjustedShortages(
  items: readonly MissingIngredient[],
  adjustments: readonly ShoppingAdjustment[],
  mealId: number,
): ShoppingShortage[] {
  const byIngredient = new Map(
    adjustments.filter((item) => item.mealId === mealId).map((item) => [item.ingredientKey, item]),
  );
  return items.flatMap<ShoppingShortage>((item) => {
    const originalAmountKey = shortageAmountKey(item);
    const adjustment = byIngredient.get(item.key);
    if (adjustment?.originalAmountKey !== originalAmountKey) {
      return [{ ...item, originalAmountKey, adjusted: false }];
    }
    if (adjustment.replacement === null) return [];
    return [{ ...item, ...adjustment.replacement, originalAmountKey, needsReview: false, adjusted: true }];
  });
}

export function isShortageChecked(
  checks: readonly ShoppingCheck[],
  mealId: number,
  item: MissingIngredient,
): boolean {
  return checks.some((check) => (
    check.mealId === mealId && check.ingredientKey === item.key && check.amountKey === shortageAmountKey(item)
  ));
}
