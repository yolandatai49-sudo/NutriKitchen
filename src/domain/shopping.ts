import type { MissingIngredient } from './inventory.ts';
import type { Ingredient } from './recipes.ts';

export type ShoppingItem = Ingredient & { id: number; checked: boolean };
export type ShoppingCheck = { mealId: number; ingredientKey: string; amountKey: string };

export function shortageAmountKey(item: MissingIngredient): string {
  return JSON.stringify([item.quantity, item.needsReview]);
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
