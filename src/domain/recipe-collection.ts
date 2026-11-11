import type { Ingredient, RecipeInput } from './recipes.ts';

export type CollectionRecipe = {
  key: string;
  minutes: number;
  servings: number;
  recipe: RecipeInput;
};

function amount(name: string, quantity: number, unit = '克'): Ingredient {
  return { name, quantity, unit };
}

export const recipeCollection: readonly CollectionRecipe[] = [
  {
    key: 'tomato-eggs', minutes: 15, servings: 2,
    recipe: {
      title: '番茄炒蛋', category: '家常菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('番茄', 300), amount('鸡蛋', 3, '个'), amount('小葱', 10),
        amount('食用油', 15, '毫升'), amount('盐', 2),
      ],
      steps: [
        '番茄切成小块，小葱切葱花。鸡蛋打散，拌入一小撮盐。',
        '中火热锅，倒入约一半的油。加入蛋液，用锅铲轻推至刚凝固，盛出。',
        '用剩下的油炒番茄，加余下的盐，炒到番茄变软并出汁。',
        '倒回鸡蛋，轻轻翻拌至鸡蛋完全熟透，撒葱花出锅。',
      ],
    },
  },
  {
    key: 'scallion-noodles', minutes: 20, servings: 2,
    recipe: {
      title: '葱油拌面', category: '主食', sourceUrl: null, pending: false,
      ingredients: [
        amount('细面条', 200), amount('小葱', 50), amount('食用油', 30, '毫升'),
        amount('生抽', 20, '毫升'), amount('老抽', 5, '毫升'), amount('白糖', 5),
      ],
      steps: [
        '小葱洗净擦干，切成约 5 厘米的段，葱白和葱绿分开。',
        '锅里倒油，小火先炸葱白，随后加入葱绿。葱段变金褐并有香味时关火。',
        '等油温稍降，沿锅边加入生抽、老抽和糖，小火搅拌至糖溶解，关火备用。',
        '按包装说明煮熟面条，沥水后分入两碗。趁热拌入葱油酱汁，铺上炸葱。',
      ],
    },
  },
  {
    key: 'steamed-tofu', minutes: 15, servings: 2,
    recipe: {
      title: '葱香蒸豆腐', category: '素菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('嫩豆腐', 300), amount('小葱', 15), amount('生抽', 15, '毫升'),
        amount('香油', 5, '毫升'),
      ],
      steps: [
        '嫩豆腐切成约 1 厘米厚的片，轻轻移入有边的浅盘。小葱切细。',
        '蒸锅水烧开后放入豆腐，盖盖蒸约 8 分钟，出锅时倒掉盘中多余的水。',
        '淋生抽和香油，撒上葱花，趁热上桌。',
      ],
    },
  },
  {
    key: 'mushroom-chicken', minutes: 35, servings: 2,
    recipe: {
      title: '香菇焖鸡', category: '荤菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('去骨鸡腿肉', 350), amount('鲜香菇', 150), amount('姜', 10),
        amount('生抽', 20, '毫升'), amount('老抽', 5, '毫升'),
        amount('食用油', 10, '毫升'),
      ],
      steps: [
        '鸡腿肉切成约 3 厘米的块，香菇对切，姜切片。',
        '锅里放油，中火炒香姜片。放入鸡块，翻炒至表面变色，再加香菇翻炒。',
        '加入生抽、老抽和约半碗水。煮开后盖盖转小火，焖约 15 分钟。',
        '用食物温度计测最厚的鸡块，中心达到 74°C 后开盖收汁，待酱汁浓稠即可出锅。',
      ],
    },
  },
];

export function findCollectionRecipe(key: string | undefined) {
  return recipeCollection.find((entry) => entry.key === key);
}
