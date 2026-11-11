import { localDay, moveDay } from '../domain/dates.ts';
import { missingIngredients } from '../domain/inventory.ts';
import { recipesForMeal } from '../domain/meals.ts';
import type { NutritionInput, Nutrients } from '../domain/nutrition.ts';
import { findCollectionRecipe } from '../domain/recipe-collection.ts';
import type { Ingredient } from '../domain/recipes.ts';
import { adjustedShortages, shortageAmountKey } from '../domain/shopping.ts';
import { initializeDatabase, kitchenActions, loadKitchen, type KitchenDatabase } from './repository.ts';

const favorites = ['tomato-eggs', 'yangchun-noodles', 'braised-pork-rice', 'hunan-beef'];
const stock: Ingredient[] = [
  { name: '番茄', quantity: 430, unit: '克' },
  { name: '鸡蛋', quantity: 6, unit: '个' },
  { name: '嫩豆腐', quantity: 300, unit: '克' },
  { name: '黄牛肉', quantity: 100, unit: '克' },
  { name: '薄皮青椒', quantity: 150, unit: '克' },
  { name: '小葱', quantity: 40, unit: '克' },
  { name: '姜', quantity: 25, unit: '克' },
  { name: '蒜', quantity: 25, unit: '克' },
  { name: '大米', quantity: 750, unit: '克' },
  { name: '细面条', quantity: 210, unit: '克' },
  { name: '猪油', quantity: 30, unit: '克' },
  { name: '食用油', quantity: 160, unit: '毫升' },
  { name: '生抽', quantity: 100, unit: '毫升' },
  { name: '蚝油', quantity: 45, unit: '毫升' },
  { name: '香油', quantity: 30, unit: '毫升' },
  { name: '淀粉', quantity: 50, unit: '克' },
  { name: '盐', quantity: 50, unit: '克' },
  { name: '白糖', quantity: 80, unit: '克' },
];

function food(day: string, name: string, grams: number, kcal: number, protein: number, carbs: number, fat: number): NutritionInput {
  const per100: Nutrients = { kcal, protein, carbs, fat };
  return { day, name, grams, per100 };
}

// Only used with a fresh, separate in-memory database.
export async function initializeDemoKitchen(db: KitchenDatabase, today = localDay()) {
  await initializeDatabase(db);
  const actions = kitchenActions(db);
  const yesterday = moveDay(today, -1);
  const twoDaysAgo = moveDay(today, -2);
  const tomorrow = moveDay(today, 1);
  const menus = [
    { name: '昨晚的卤肉饭', day: yesterday, keys: ['braised-pork-rice', 'steamed-tofu'] },
    { name: '今天的午饭', day: today, keys: ['yangchun-noodles', 'tomato-eggs'] },
    { name: '明晚的家常菜', day: tomorrow, keys: ['hunan-beef', 'steamed-tofu', 'tomato-eggs'] },
  ];
  const ids = new Map<string, number>();
  for (const key of new Set([...favorites, ...menus.flatMap(({ keys }) => keys), 'chaoshan-beef-soup', 'red-braised-pork'])) {
    const entry = findCollectionRecipe(key);
    if (!entry) throw new Error(`Unknown demo recipe: ${key}`);
    const id = await actions.importRecipe(entry.recipe, key);
    ids.set(key, id);
    if (favorites.includes(key)) await actions.setFavorite(id, true);
  }
  for (const { name, day, keys } of menus) {
    const recipeIds = keys.map((key) => {
      const id = ids.get(key);
      if (id === undefined) throw new Error(`Unknown demo menu recipe: ${key}`);
      return id;
    });
    await actions.saveMeal({ name, day, recipeIds });
  }
  for (const item of stock) await actions.addStock(item);
  await actions.saveShoppingItem({ name: '原味酸奶', quantity: 2, unit: '盒' });
  await actions.saveShoppingItem({ name: '香蕉', quantity: 4, unit: '根' });
  await actions.saveShoppingItem({ name: '牛奶', quantity: 1, unit: '瓶' });
  const data = await loadKitchen(db);
  const checkedItem = data.shopping.find(({ name }) => name === '牛奶');
  if (checkedItem) await actions.setShoppingItemChecked(checkedItem.id, true);
  const nextMeal = data.meals.find(({ day }) => day === tomorrow);
  if (nextMeal) {
    const required = recipesForMeal(nextMeal, data.recipes).flatMap(({ ingredients }) => ingredients);
    const shortlist = adjustedShortages(missingIngredients(required, data.stock), [], nextMeal.id);
    const pepper = shortlist.find(({ name }) => name === '泡椒');
    if (pepper) await actions.setShoppingCheck({
      mealId: nextMeal.id, ingredientKey: pepper.key, amountKey: shortageAmountKey(pepper),
    }, true);
  }

  // Fictional food diary, with sample nutrition values per 100 g.
  for (const item of [
    food(twoDaysAgo, '无糖豆浆', 260, 33, 3, 1.5, 1.6),
    food(twoDaysAgo, '全麦吐司', 65, 247, 12, 41, 4.2),
    food(twoDaysAgo, '鸡肉饭', 330, 156, 10, 20, 4),
    food(twoDaysAgo, '苹果', 155, 52, 0.3, 14, 0.2),
    food(yesterday, '原味酸奶', 170, 70, 4, 6, 3.3),
    food(yesterday, '燕麦片', 45, 376, 13, 62, 8),
    food(yesterday, '卤肉饭', 345, 214, 8, 23, 10),
    food(yesterday, '葱香蒸豆腐', 145, 76, 7, 2.5, 4.5),
    food(today, '牛奶', 240, 61, 3.2, 4.8, 3.3),
    food(today, '香蕉', 110, 89, 1.1, 22.8, 0.3),
    food(today, '阳春面（含汤）', 380, 105, 2.8, 18, 2.4),
    food(today, '番茄炒蛋', 180, 102, 6, 3.5, 7.1),
  ]) await actions.saveNutritionEntry(item);
}
