import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RecipesScreen from '../../src/app/(tabs)/index';
import MenuScreen from '../../src/app/(tabs)/menu';
import FridgeScreen from '../../src/app/(tabs)/fridge';
import ShoppingScreen from '../../src/app/(tabs)/shopping';
import NutritionScreen from '../../src/app/(tabs)/nutrition';
import RecipeForm from '../../src/app/recipes/form';
import MealForm from '../../src/app/meals/form';
import NutritionForm from '../../src/app/nutrition/form';
import { useKitchen } from '../../src/data/kitchen';
import type { KitchenActions, KitchenData } from '../../src/data/repository';

jest.mock('expo-router', () => ({ useRouter: jest.fn(), useLocalSearchParams: jest.fn() }));
jest.mock('../../src/data/kitchen', () => ({ useKitchen: jest.fn() }));

let data: KitchenData;
const router = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), setParams: jest.fn() };
const actions = {
  saveRecipe: jest.fn<KitchenActions['saveRecipe']>(),
  saveMeal: jest.fn<KitchenActions['saveMeal']>(),
  addStock: jest.fn<KitchenActions['addStock']>(),
  saveShoppingItem: jest.fn<KitchenActions['saveShoppingItem']>(),
  setShoppingCheck: jest.fn<KitchenActions['setShoppingCheck']>(),
  saveNutritionEntry: jest.fn<KitchenActions['saveNutritionEntry']>(),
};

beforeEach(() => {
  jest.clearAllMocks();
  actions.saveRecipe.mockResolvedValue(1);
  actions.saveMeal.mockResolvedValue(1);
  actions.addStock.mockResolvedValue(undefined);
  actions.saveShoppingItem.mockResolvedValue(undefined);
  actions.setShoppingCheck.mockResolvedValue(undefined);
  actions.saveNutritionEntry.mockResolvedValue(undefined);
  data = { recipes: [], meals: [], stock: [], shopping: [], shoppingChecks: [], nutrition: [] };
  jest.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(useKitchen).mockReturnValue({
    data,
    write: (operation) => operation(actions as unknown as KitchenActions),
  });
});

test.each([
  [RecipesScreen, '还没有菜谱'],
  [MenuScreen, '还没有菜单'],
  [FridgeScreen, '冰箱还没有食材'],
  [ShoppingScreen, '没有手动项目'],
  [NutritionScreen, '当天还没有记录'],
] as const)('renders a native screen with empty local data', async (Screen, expected) => {
  const screen = await render(<Screen />);
  expect(screen.getByText(expected)).toBeTruthy();
});

test('submits a link-only recipe as a pending item from the form', async () => {
  const screen = await render(<RecipeForm />);
  await fireEvent.changeText(screen.getByLabelText('小红书原文（选填）'), 'https://xhslink.com/a/demo');
  await fireEvent.press(screen.getByRole('button', { name: '保存菜谱' }));
  expect(actions.saveRecipe).toHaveBeenCalledWith(expect.objectContaining({
    pending: true, sourceUrl: 'https://xhslink.com/a/demo',
  }), undefined);
  expect(router.replace).toHaveBeenCalled();
});

test('selects multiple dishes and saves one meal from the form', async () => {
  const recipe = { id: 1, title: '番茄汤', category: '汤', ingredients: [], steps: [], sourceUrl: null, pending: false, favorite: false };
  data.recipes.push(recipe, { ...recipe, id: 2, title: '米饭' });
  const screen = await render(<MealForm />);
  await fireEvent.changeText(screen.getByLabelText('这顿饭的名称'), '周末晚餐');
  for (const row of screen.getAllByRole('checkbox')) await fireEvent.press(row);
  await fireEvent.press(screen.getByRole('button', { name: '保存菜单' }));
  expect(actions.saveMeal).toHaveBeenCalledWith(expect.objectContaining({
    name: '周末晚餐', recipeIds: [1, 2],
  }), undefined);
});

test('adds a fridge item from the native form', async () => {
  const screen = await render(<FridgeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: '添加食材' }));
  await fireEvent.changeText(screen.getByLabelText('食材名称'), '番茄');
  await fireEvent.changeText(screen.getByLabelText('库存量（选填）'), '200');
  await fireEvent.changeText(screen.getByLabelText('单位'), '克');
  await fireEvent.press(screen.getByRole('button', { name: '存入冰箱' }));
  expect(actions.addStock).toHaveBeenCalledWith({ name: '番茄', quantity: 200, unit: '克' });
});

test('shows aggregated menu shortages after fridge subtraction and stores their checked state', async () => {
  const base = { title: '番茄汤', category: '汤', steps: [], sourceUrl: null, pending: false, favorite: false };
  data.recipes.push(
    { ...base, id: 1, ingredients: [{ name: '番茄', quantity: 300, unit: '克' }] },
    { ...base, id: 2, ingredients: [{ name: '番茄', quantity: 200, unit: '克' }] },
  );
  data.meals.push({ id: 1, name: '晚饭', day: '2026-11-10', recipeIds: [1, 2] });
  data.stock.push({ id: 1, name: '番茄', quantity: 100, unit: '克' });
  const screen = await render(<ShoppingScreen />);
  expect(screen.getByText('400 克')).toBeTruthy();
  await fireEvent.press(screen.getByRole('checkbox'));
  expect(actions.setShoppingCheck).toHaveBeenCalledWith(expect.objectContaining({ mealId: 1 }), true);
});

test('saves grams and nutritional label values through the form', async () => {
  const screen = await render(<NutritionForm />);
  await fireEvent.changeText(screen.getByLabelText('食物名称'), '酸奶');
  await fireEvent.changeText(screen.getByLabelText('实际食用重量（克）'), '150');
  await fireEvent.changeText(screen.getByLabelText('热量（千卡）'), '100');
  await fireEvent.press(screen.getByRole('button', { name: '热量用千焦' }));
  expect(screen.getByLabelText('热量（千焦）').props.value).toBe('418.4');
  await fireEvent.changeText(screen.getByLabelText('蛋白质（克）'), '4');
  await fireEvent.changeText(screen.getByLabelText('碳水（克）'), '8');
  await fireEvent.changeText(screen.getByLabelText('脂肪（克）'), '3');
  await fireEvent.press(screen.getByRole('button', { name: '保存营养记录' }));
  expect(actions.saveNutritionEntry).toHaveBeenCalledWith(expect.objectContaining({
    name: '酸奶', grams: 150, per100: { kcal: expect.closeTo(100, 10), protein: 4, carbs: 8, fat: 3 },
  }), undefined);
});
