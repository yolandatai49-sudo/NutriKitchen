import { presentSavedRecipe } from '../../domain/recipe-collection';
import { useLanguage } from '../../data/language';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Page, Row, useConfirmDelete, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { recipesForMeal } from '../../domain/meals';

export default function MenuScreen() {
  const { t, language } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const router = useRouter();
  const { data: { meals, recipes }, write } = useKitchen();
  const { busy, run } = useTask();

  return (
    <Page title={t("私人菜单")} subtitle={t("把想吃的菜搭成一餐。")} headerAction={
      <Action label={t("新建一餐")} icon="add" onPress={() => router.push('/meals/form')} />
    }>
      {!meals.length && <Empty icon="restaurant-outline" title={t("还没有菜单")} description={t("从菜谱中挑几道菜，保存为午饭、晚饭或聚餐。")} />}
      {meals.map((meal) => {
        const dishes = recipesForMeal(meal, recipes).map((recipe) => presentSavedRecipe(recipe, language === 'en'));
        const mealName = t(meal.name);
        return (
          <Card key={meal.id}>
            <Row>
              <View style={[ui.grow, ui.stack]}>
                <Text style={ui.itemTitle}>{mealName}</Text>
                <Body>{meal.day}</Body>
              </View>
              <Badge>{dishes.length} {t("道菜")}</Badge>
            </Row>
            {dishes.length ? (
              <Row wrap>
                {dishes.map((dish) => <Badge key={dish.id} warm={dish.pending}>{dish.title}</Badge>)}
              </Row>
            ) : <Body>{t("这顿饭还没有可用菜谱，可以编辑后重新选菜。")}</Body>}
            <Row wrap>
              <Action label={t("编辑菜单")} variant="quiet" icon="create-outline" disabled={busy}
                onPress={() => router.push({ pathname: '/meals/form', params: { id: String(meal.id) } })} />
              <Action label={t("看缺料")} variant="quiet" icon="basket-outline"
                onPress={() => router.navigate({ pathname: '/shopping', params: { mealId: String(meal.id) } })} />
              <Action label={t("删除")} variant="danger" disabled={busy} onPress={() => confirmDelete(
                t("删除这顿饭？"), t("将删除「{0}」菜单。", mealName),
                () => void run(() => write((actions) => actions.deleteMeal(meal.id))),
              )} />
            </Row>
          </Card>
        );
      })}
    </Page>
  );
}
