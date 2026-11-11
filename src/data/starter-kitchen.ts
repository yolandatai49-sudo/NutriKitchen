import { moveDay } from '../domain/dates.ts';
import type { NutritionInput } from '../domain/nutrition.ts';
import type { Ingredient } from '../domain/recipes.ts';

export const starterRecipeKeys = ['yangchun-noodles', 'tomato-eggs', 'steamed-tofu', 'hunan-beef', 'garlic-salmon'];

export const starterStock: Ingredient[] = [
  { name: '番茄', quantity: 420, unit: '克' },
  { name: '鸡蛋', quantity: 6, unit: '个' },
  { name: '细面条', quantity: 250, unit: '克' },
  { name: '嫩豆腐', quantity: 300, unit: '克' },
  { name: '小葱', quantity: 45, unit: '克' },
  { name: '猪油', quantity: 25, unit: '克' },
  { name: '食用油', quantity: 120, unit: '毫升' },
  { name: '生抽', quantity: 90, unit: '毫升' },
  { name: '香油', quantity: 25, unit: '毫升' },
  { name: '盐', quantity: 40, unit: '克' },
  { name: '黄牛肉', quantity: 100, unit: '克' },
  { name: '薄皮青椒', quantity: 130, unit: '克' },
  { name: '蒜', quantity: 25, unit: '克' },
  { name: '姜', quantity: 25, unit: '克' },
  { name: '蚝油', quantity: 40, unit: '毫升' },
  { name: '淀粉', quantity: 40, unit: '克' },
  { name: '白糖', quantity: 80, unit: '克' },
];

export const starterShopping: (Ingredient & { checked?: boolean })[] = [
  { name: '牛奶', quantity: 1, unit: '瓶', checked: true },
  { name: '原味酸奶', quantity: 2, unit: '盒' },
  { name: '香蕉', quantity: 4, unit: '根' },
];

export function starterNutrition(today: string): NutritionInput[] {
  const yesterday = moveDay(today, -1);
  const earlier = moveDay(today, -2);
  const food = (day: string, name: string, grams: number, kcal: number, protein: number, carbs: number, fat: number): NutritionInput =>
    ({ day, name, grams, per100: { kcal, protein, carbs, fat } });
  return [
    food(earlier, '苹果', 150, 52, 0.3, 14, 0.2),
    food(earlier, '鸡肉饭', 320, 156, 10, 20, 4),
    food(yesterday, '原味酸奶', 170, 70, 4, 6, 3.3),
    food(yesterday, '葱香蒸豆腐', 145, 76, 7, 2.5, 4.5),
    food(today, '牛奶', 240, 61, 3.2, 4.8, 3.3),
    food(today, '阳春面（含汤）', 380, 105, 2.8, 18, 2.4),
    food(today, '番茄炒蛋', 180, 102, 6, 3.5, 7.1),
  ];
}
