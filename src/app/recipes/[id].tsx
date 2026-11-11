import { useLanguage } from '../../data/language';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { RecipeReader } from '../../components/recipe-reader';
import { Action, Empty, Page, useConfirmDelete, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { findCollectionRecipe } from '../../domain/recipe-collection';

export default function RecipeDetailScreen() {
  const { t } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, write } = useKitchen();
  const { run, busy } = useTask();
  const recipe = data.recipes.find((item) => item.id === Number(id));

  if (!recipe) {
    return <Page title={t("菜谱详情")} detail>
      <Empty icon="book-outline" title={t("找不到这道菜")} description={t("返回菜谱列表查看其他菜谱。")} />
    </Page>;
  }

  const collection = findCollectionRecipe(recipe.collectionKey);
  const sourceUrl = recipe.sourceUrl;

  return <RecipeReader key={recipe.id} recipe={recipe} collection={collection}
    controls={<>
      <Action label={recipe.favorite ? t("取消收藏") : t("收藏")} icon={recipe.favorite ? 'heart' : 'heart-outline'} variant="quiet" disabled={busy}
        onPress={() => void run(() => write((actions) => actions.setFavorite(recipe.id, !recipe.favorite)))} />
      <Action label={t("编辑")} icon="create-outline" variant="quiet" disabled={busy}
        onPress={() => router.push({ pathname: '/recipes/form', params: { id } })} />
    </>}
    footer={<>
      {sourceUrl && <Action label={t("打开小红书原文")} icon="open-outline" variant="quiet" disabled={busy}
        onPress={() => void run(() => Linking.openURL(sourceUrl))} />}
      <Action label={t("删除菜谱")} icon="trash-outline" variant="danger" disabled={busy}
        onPress={() => confirmDelete(t("删除菜谱？"), t("将删除「{0}」，并从相关菜单移除这道菜。", recipe.title), () => void run(async () => {
          await write((actions) => actions.deleteRecipe(recipe.id));
          router.back();
        }))} />
    </>} />;
}
