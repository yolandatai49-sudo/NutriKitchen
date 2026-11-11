import { useLocalSearchParams, useRouter } from 'expo-router';
import { RecipeReader } from '../../../components/recipe-reader';
import { Action, Empty, Page, useTask } from '../../../components/ui';
import { useKitchen } from '../../../data/kitchen';
import { findCollectionRecipe } from '../../../domain/recipe-collection';

export default function CollectionRecipeScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const { data, write } = useKitchen();
  const { run, busy } = useTask();
  const collection = findCollectionRecipe(key);

  if (!collection) {
    return <Page title="菜谱详情" detail>
      <Empty icon="book-outline" title="找不到这道菜" description="返回菜谱页看看其他家常菜。" />
    </Page>;
  }

  const saved = data.recipes.find((recipe) => recipe.collectionKey === collection.key);

  function openSaved(id: number) {
    router.replace({ pathname: '/recipes/[id]', params: { id: String(id) } });
  }

  return <RecipeReader key={collection.key} recipe={collection.recipe} collection={collection}
    controls={saved ? (
      <Action label="已收录 · 打开我的菜谱" variant="quiet" icon="arrow-forward" onPress={() => openSaved(saved.id)} />
    ) : (
      <Action label={busy ? '正在收录…' : '收入我的菜谱'} icon="bookmark-outline" disabled={busy}
        onPress={() => void run(async () => {
          const id = await write((actions) => actions.importRecipe(collection.recipe, collection.key));
          openSaved(id);
        })} />
    )} />;
}
