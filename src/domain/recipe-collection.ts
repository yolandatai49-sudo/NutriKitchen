import { moreRecipes } from './more-recipes.ts';
import { englishFood, englishUnit, originalRecipeEnglish } from './recipe-translations.ts';
import type { Ingredient, RecipeInput } from './recipes.ts';

export type CollectionRecipe = {
  key: string;
  minutes: number;
  servings: number;
  region?: 'chinese' | 'american';
  english?: { title: string; steps: string[] };
  reference?: { label: string; url: string };
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
  {
    key: 'red-braised-pork', minutes: 85, servings: 2,
    reference: { label: '参考村驴的红烧肉原视频', url: 'https://www.bilibili.com/list/417298480?bvid=BV1na2TBqEdH&oid=115506015113226' },
    recipe: {
      title: '红烧肉', category: '荤菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('带皮五花肉', 400), amount('土豆', 200), amount('姜', 10), amount('冰糖', 12),
        amount('生抽', 20, '毫升'), amount('老抽', 5, '毫升'), amount('料酒', 15, '毫升'),
      ],
      steps: [
        '五花肉切成约 3 厘米见方的块，用厨房纸吸干表面。姜切片，土豆去皮切滚刀块。',
        '肉块下干锅，用中小火煎到几面微黄、锅底积出油。倒出大部分猪油，锅里留薄薄一层。',
        '下姜片和冰糖翻炒，糖化后加料酒、生抽和老抽。倒入约 500 毫升热水，水面接近没过肉块。',
        '煮开后盖盖小火炖 45 分钟，再下土豆炖约 15 分钟。筷子能轻松穿过肉皮和土豆时，开盖收汁到能薄薄挂在肉上。',
      ],
    },
  },
  {
    key: 'yangchun-noodles', minutes: 15, servings: 2,
    recipe: {
      title: '阳春面', category: '主食', sourceUrl: null, pending: false,
      ingredients: [
        amount('细面条', 180), amount('小葱', 12), amount('猪油', 10),
        amount('生抽', 15, '毫升'), amount('盐', 1),
      ],
      steps: [
        '小葱切细。两只面碗各放一半葱花、猪油、生抽和盐。',
        '烧一壶开水，每碗冲入约 250 毫升开水，搅到猪油化开。尝一下咸淡，汤底留一点余地。',
        '另烧一锅水，按包装说明煮细面，煮到夹断一根看不到硬白芯。捞出稍沥水，分进两碗，拌开趁热吃。',
      ],
    },
  },
  {
    key: 'braised-pork-rice', minutes: 65, servings: 2,
    reference: { label: '参考村驴的卤肉饭原视频', url: 'https://www.bilibili.com/list/417298480?bvid=BV1aW421R7rk&oid=1856047414' },
    recipe: {
      title: '卤肉饭', category: '主食', sourceUrl: null, pending: false,
      ingredients: [
        amount('带皮五花肉', 300), amount('洋葱', 65), amount('大葱', 15), amount('蒜', 10),
        amount('鸡蛋', 2, '个'), amount('大米', 150), amount('冰糖', 8), amount('红腐乳', 8),
        amount('生抽', 25, '毫升'), amount('老抽', 6, '毫升'), amount('八角', 1, '个'),
      ],
      steps: [
        '大米淘净后煮饭。鸡蛋煮成全熟，冷却剥壳。五花肉切约 1 厘米粗的短条，洋葱切丁，葱蒜切碎。',
        '五花肉入干锅，中火炒到出油。下洋葱炒到边缘金黄，再下葱蒜炒香。',
        '倒入生抽、老抽和约 350 毫升热水，拌入压碎的腐乳、冰糖和八角，放入鸡蛋。煮开后转小火，加盖炖约 40 分钟，中途翻一次蛋。',
        '肉皮软糯后开盖收汁，卤汁仍能用勺子舀起来时关火。取出八角，卤肉、半切卤蛋和卤汁铺在米饭上。',
      ],
    },
  },
  {
    key: 'kung-pao-chicken', minutes: 25, servings: 2,
    recipe: {
      title: '宫保鸡丁', category: '荤菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('去骨鸡腿肉', 280), amount('熟花生', 35), amount('大葱', 45), amount('姜', 6), amount('蒜', 8),
        amount('干辣椒', 5), amount('花椒', 1), amount('淀粉', 8), amount('白糖', 12),
        amount('生抽', 20, '毫升'), amount('香醋', 15, '毫升'), amount('食用油', 15, '毫升'),
      ],
      steps: [
        '鸡腿肉切 2 厘米丁，加 5 毫升生抽、5 克淀粉和一小勺水抓匀，腌 10 分钟。大葱切段，姜蒜切末，干辣椒剪段。',
        '把余下的生抽和淀粉与香醋、糖、30 毫升水搅匀。酱汁先调好，等下可以一口气炒完。',
        '热锅下油，中火炒香花椒和干辣椒，趁辣椒还没发黑加入鸡丁，摊开翻炒。',
        '下葱姜蒜，炒至鸡丁最厚处达到 74°C。重新搅匀碗汁再倒下去，翻到酱汁裹住鸡丁，最后倒入花生拌匀出锅。',
      ],
    },
  },
  {
    key: 'pepper-pork-strips', minutes: 20, servings: 2,
    reference: { label: '参考村驴的辣椒炒肉原视频', url: 'https://www.bilibili.com/list/417298480?bvid=BV1KZ421L7Pn&oid=1156673175' },
    recipe: {
      title: '辣椒炒肉丝', category: '家常菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('猪里脊', 220), amount('薄皮青椒', 200), amount('蒜', 10), amount('淀粉', 5),
        amount('生抽', 15, '毫升'), amount('蚝油', 8, '毫升'), amount('食用油', 15, '毫升'), amount('盐', 1),
      ],
      steps: [
        '里脊顺纹切丝，用 5 毫升生抽、淀粉和 5 毫升油抓匀，腌 10 分钟。青椒去蒂切丝，蒜切片。',
        '干锅中火把青椒丝炒到起少量焦斑，撒盐翻几下，先盛出。',
        '同一口锅下剩余的油，炒香蒜片后把肉丝摊开炒散。肉丝熟透后倒回青椒，加余下生抽和蚝油快速翻匀。',
        '锅底没有水汁、青椒仍带一点脆时立刻出锅。',
      ],
    },
  },
  {
    key: 'hunan-beef', minutes: 25, servings: 2,
    reference: { label: '参考下厨房读者整理的村驴做法', url: 'https://m.xiachufang.com/recipe/107556815/' },
    recipe: {
      title: '小炒黄牛肉', category: '荤菜', sourceUrl: null, pending: false,
      ingredients: [
        amount('黄牛肉', 250), amount('姜', 12), amount('小葱', 10), amount('蒜', 12),
        amount('薄皮青椒', 60), amount('泡椒', 20), amount('小米辣', 5), amount('香菜', 20),
        amount('淀粉', 6), amount('白糖', 3), amount('食用油', 18, '毫升'),
        amount('生抽', 15, '毫升'), amount('蚝油', 8, '毫升'),
      ],
      steps: [
        '黄牛肉去粗筋，逆纹切薄片。拍松小葱和一半姜，在 30 毫升水里揉出葱姜味，滤出汁。',
        '牛肉加 5 毫升生抽，分两次抓入葱姜水，等水吸进去再拌淀粉和约三分之一的油。其余姜蒜切片，椒切圈，香菜切段。',
        '热锅下部分剩油，将牛肉分批大火炒散，表面变色时先盛出。补余下的油，依次炒香姜蒜、泡椒和鲜椒。',
        '牛肉倒回去，加余下生抽、蚝油和糖，大火炒熟并让调味裹匀。关火前下香菜拌两下，趁热盛出。',
      ],
    },
  },
  {
    key: 'chaoshan-beef-soup', minutes: 30, servings: 2,
    recipe: {
      title: '潮汕牛肉汤', category: '汤', sourceUrl: null, pending: false,
      ingredients: [
        amount('牛肉薄片', 200), amount('白萝卜', 250), amount('无盐牛骨清汤', 650, '毫升'),
        amount('姜', 8), amount('芹菜', 15), amount('炸蒜酥', 5), amount('盐', 2),
      ],
      steps: [
        '白萝卜去皮切薄块，姜切片，芹菜切小段。牛肉薄片抖散备用。',
        '锅里倒牛骨清汤和姜片，煮开后加白萝卜，小火煮约 15 分钟，直到筷子能扎透萝卜。',
        '把汤重新烧开，牛肉分两次下锅，用筷子拨开，煮熟后先盛到碗里。汤按口味加盐，撒入芹菜。',
        '把萝卜和清汤舀进碗里，最后撒炸蒜酥。',
      ],
    },
  },
  ...moreRecipes,
];

export function findCollectionRecipe(key: string | undefined) {
  return recipeCollection.find((entry) => entry.key === key);
}

export const categoryEnglish: Record<string, string> = {
  '家常菜': 'Home Cooking', '素菜': 'Vegetables', '荤菜': 'Main Dish', '主食': 'Rice, Noodles & More',
  '汤': 'Soup', '早餐': 'Breakfast', '未分类': 'Uncategorized',
};

export function localizeCollection(entry: CollectionRecipe, english: boolean): CollectionRecipe {
  if (!english) return entry;
  const translation = entry.english ?? originalRecipeEnglish[entry.key];
  if (!translation) return entry;
  return {
    ...entry,
    recipe: {
      ...entry.recipe,
      ...translation,
      category: categoryEnglish[entry.recipe.category] ?? entry.recipe.category,
      ingredients: entry.recipe.ingredients.map((item) => ({ ...item, name: englishFood(item.name), unit: englishUnit(item.unit) })),
    },
  };
}

export function presentRecipe<T extends RecipeInput>(recipe: T, collection: CollectionRecipe | undefined, english: boolean): T {
  if (!collection || !english) return recipe;
  const translated = localizeCollection(collection, true).recipe;
  const original = collection.recipe;
  return {
    ...recipe,
    title: recipe.title === original.title ? translated.title : recipe.title,
    category: categoryEnglish[recipe.category] ?? recipe.category,
    ingredients: recipe.ingredients.map((item) => ({ ...item, name: englishFood(item.name), unit: englishUnit(item.unit) })),
    steps: recipe.steps.length === original.steps.length && recipe.steps.every((step, index) => step === original.steps[index])
      ? translated.steps : recipe.steps,
  };
}

export function presentSavedRecipe<T extends RecipeInput & { collectionKey?: string }>(recipe: T, english: boolean): T {
  return presentRecipe(recipe, findCollectionRecipe(recipe.collectionKey), english);
}
