import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Text } from 'react-native';
import { Action, Badge, Body, Card, Empty, Heading, Page, Row, confirmDelete, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, write } = useKitchen();
  const { run, busy } = useTask();
  const recipe = data.recipes.find((item) => item.id === Number(id));

  if (!recipe) {
    return <Page title="菜谱详情" detail><Empty icon="book-outline" title="找不到这道菜" description="返回菜谱列表查看其他菜谱。" /></Page>;
  }

  return (
    <Page title={recipe.title} detail>
      <Row wrap>
        <Badge>{recipe.category}</Badge>
        {recipe.pending && <Badge warm>待整理</Badge>}
      </Row>
      <Row wrap>
        <Action label={recipe.favorite ? '取消收藏' : '收藏'} icon={recipe.favorite ? 'heart' : 'heart-outline'} variant="quiet" disabled={busy}
          onPress={() => void run(() => write((actions) => actions.setFavorite(recipe.id, !recipe.favorite)))} />
        <Action label="编辑" icon="create-outline" disabled={busy}
          onPress={() => router.push({ pathname: '/recipes/form', params: { id } })} />
      </Row>
      <Card>
        <Heading>食材</Heading>
        {recipe.ingredients.length ? recipe.ingredients.map((item, index) => (
          <Row key={index}>
            <Text style={[ui.grow, ui.itemTitle]}>{item.name}</Text>
            <Body>{item.quantity === null ? '按需' : `${item.quantity} ${item.unit}`}</Body>
          </Row>
        )) : <Body>尚未添加食材。</Body>}
      </Card>
      <Card>
        <Heading>烹饪步骤</Heading>
        {recipe.steps.length ? recipe.steps.map((step, index) => (
          <Body key={index}>{index + 1}. {step}</Body>
        )) : <Body>尚未添加步骤。</Body>}
      </Card>
      {recipe.sourceUrl && (
        <Action label="打开小红书原文" icon="open-outline" variant="quiet" disabled={busy}
          onPress={() => void run(() => Linking.openURL(recipe.sourceUrl!))} />
      )}
      <Action label="删除菜谱" icon="trash-outline" variant="danger" disabled={busy}
        onPress={() => confirmDelete('删除菜谱？', `将删除「${recipe.title}」。`, () => void run(async () => {
          await write((actions) => actions.deleteRecipe(recipe.id));
          router.back();
        }))} />
    </Page>
  );
}
