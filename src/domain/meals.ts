import { localDay, parseDay } from './dates.ts';
import type { Recipe } from './recipes.ts';

export type MealInput = { name: string; day: string; recipeIds: number[] };
export type MealPlan = MealInput & { id: number };

export function buildMeal(name: string, day: string, recipeIds: number[]): MealInput {
  if (!name.trim()) throw new Error('请填写这顿饭的名称。');
  if (!recipeIds.length) throw new Error('请至少选择一道菜。');
  return { name: name.trim(), day: localDay(parseDay(day)), recipeIds: [...new Set(recipeIds)] };
}

export function recipesForMeal(meal: MealPlan | undefined, recipes: readonly Recipe[]): Recipe[] {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  return meal?.recipeIds.flatMap((id) => byId.get(id) ?? []) ?? [];
}
