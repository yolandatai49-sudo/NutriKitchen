export type Ingredient = { name: string; quantity: number | null; unit: string };

export type RecipeInput = {
  title: string;
  category: string;
  ingredients: Ingredient[];
  steps: string[];
  sourceUrl: string | null;
  pending: boolean;
};

export type Recipe = RecipeInput & { id: number; favorite: boolean };

export type IngredientDraft = { name: string; quantity: string; unit: string };

export function normalizeName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function readDecimal(raw: string): number | null {
  const value = raw.normalize('NFKC').trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function readIngredient(draft: IngredientDraft): Ingredient {
  const name = draft.name.trim();
  if (!name) throw new Error('请填写食材名称。');
  if (!draft.quantity.trim()) {
    if (draft.unit.trim()) throw new Error('填写单位时，请同时填写数量。');
    return { name, quantity: null, unit: '' };
  }

  const quantity = readDecimal(draft.quantity);
  const unit = draft.unit.trim();
  if (quantity === null || quantity <= 0 || quantity > 1_000_000 || !unit) {
    throw new Error('食材用量须大于 0 且不超过 100 万，并填写单位。');
  }
  return { name, quantity, unit };
}

export function extractRecipeLink(text: string): string | null {
  for (const candidate of text.match(/https?:\/\/[^\s\u0000-\u001f<>"，。；！？、）】]+/gi) ?? []) {
    const raw = candidate.replace(/[),.;!?]+$/, '');
    if (/^https?:\/\/(?:[a-z\d-]+\.)*(?:xiaohongshu\.com|xhslink\.com)\/[^/?#\\][^\\]*$/i.test(raw)) {
      return raw;
    }
  }
  return null;
}

export function buildRecipe(draft: {
  title: string;
  category: string;
  ingredients: IngredientDraft[];
  steps: string;
  source: string;
}): RecipeInput {
  const sourceUrl = extractRecipeLink(draft.source);
  if (draft.source.trim() && !sourceUrl) throw new Error('请粘贴有效的小红书原文链接或分享文字。');

  const ingredients = draft.ingredients
    .filter((row) => row.name.trim() || row.quantity.trim() || row.unit.trim())
    .map(readIngredient);
  const steps = draft.steps.split(/\r?\n/).map((step) => step.trim()).filter(Boolean);
  const title = draft.title.trim();
  const complete = Boolean(title && ingredients.length && steps.length);
  if (!complete && !sourceUrl) throw new Error('请填写菜名，至少添加一种食材和一个步骤。');

  return {
    title: title || '小红书菜谱',
    category: draft.category.trim() || '未分类',
    ingredients,
    steps,
    sourceUrl,
    pending: !complete,
  };
}

export function filterRecipes(
  recipes: readonly Recipe[],
  query: string,
  category: string | null,
  favoritesOnly: boolean,
): Recipe[] {
  const terms = normalizeName(query).split(' ').filter(Boolean);
  return recipes.filter((recipe) => {
    if (category !== null && recipe.category !== category) return false;
    if (favoritesOnly && !recipe.favorite) return false;
    const searchable = normalizeName(
      [recipe.title, recipe.category, ...recipe.ingredients.map(({ name }) => name)].join(' '),
    );
    return terms.every((term) => searchable.includes(term));
  });
}
