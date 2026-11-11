import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Page, Row, confirmDelete, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { recipesForMeal } from '../../domain/meals';

export default function MenuScreen() {
  const router = useRouter();
  const { data: { meals, recipes }, write } = useKitchen();
  const { busy, run } = useTask();

  return (
    <Page title="私人菜单" subtitle="把想吃的菜搭成一餐。" headerAction={
      <Action label="新建一餐" icon="add" onPress={() => router.push('/meals/form')} />
    }>
      {!meals.length && <Empty icon="restaurant-outline" title="还没有菜单" description="从菜谱中挑几道菜，保存为午饭、晚饭或聚餐。" />}
      {meals.map((meal) => {
        const dishes = recipesForMeal(meal, recipes);
        return (
          <Card key={meal.id}>
            <Row>
              <View style={[ui.grow, ui.stack]}>
                <Text style={ui.itemTitle}>{meal.name}</Text>
                <Body>{meal.day}</Body>
              </View>
              <Badge>{dishes.length} 道菜</Badge>
            </Row>
            {dishes.length ? (
              <Row wrap>
                {dishes.map((dish) => <Badge key={dish.id} warm={dish.pending}>{dish.title}</Badge>)}
              </Row>
            ) : <Body>这顿饭还没有可用菜谱，可以编辑后重新选菜。</Body>}
            <Row wrap>
              <Action label="编辑菜单" variant="quiet" icon="create-outline" disabled={busy}
                onPress={() => router.push({ pathname: '/meals/form', params: { id: String(meal.id) } })} />
              <Action label="删除" variant="danger" disabled={busy} onPress={() => confirmDelete(
                '删除这顿饭？', `将删除「${meal.name}」菜单。`,
                () => void run(() => write((actions) => actions.deleteMeal(meal.id))),
              )} />
            </Row>
          </Card>
        );
      })}
    </Page>
  );
}
