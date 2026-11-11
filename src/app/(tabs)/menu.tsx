import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Body, Empty, Page, palette, typeStyles, ui, useConfirmDelete, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { useLanguage } from '../../data/language';
import { localDay, parseDay } from '../../domain/dates';
import { recipesForMeal } from '../../domain/meals';
import { presentSavedRecipe } from '../../domain/recipe-collection';

export default function MenuScreen() {
  const { t, language } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const router = useRouter();
  const { data: { meals, recipes }, write } = useKitchen();
  const { busy, run } = useTask();
  const today = localDay();
  const weekday = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', { weekday: 'short' });
  const ordered = [...meals].sort((a, b) => {
    const aPast = a.day < today;
    const bPast = b.day < today;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return (aPast ? b.day.localeCompare(a.day) : a.day.localeCompare(b.day)) || b.id - a.id;
  });

  return (
    <Page title={t('私人菜单')} headerAction={
      <Action label={t('新建一餐')} icon="add" onPress={() => router.push('/meals/form')} />
    }>
      {!ordered.length && <Empty icon="restaurant-outline" title={t('还没有菜单')} description={t('从菜谱中挑几道菜，保存为午饭、晚饭或聚餐。')} />}
      {!!ordered.length && (
        <View style={styles.list}>
          {ordered.map((meal) => {
            const dishes = recipesForMeal(meal, recipes).map((recipe) => presentSavedRecipe(recipe, language === 'en'));
            const mealName = t(meal.name);
            return (
              <View key={meal.id} style={styles.meal}>
                <View style={styles.date}>
                  <Text style={styles.day}>{meal.day.slice(5).replace('-', '/')}</Text>
                  <Text style={typeStyles.caption}>{weekday.format(parseDay(meal.day))}</Text>
                </View>
                <Pressable style={styles.entry} accessibilityRole="button" accessibilityLabel={t('编辑餐单「{0}」', mealName)}
                  onPress={() => router.push({ pathname: '/meals/form', params: { id: String(meal.id) } })}>
                  <Text style={typeStyles.label}>{mealName}</Text>
                  <Body>{dishes.length ? dishes.map(({ title }) => title).join(' · ') : t('这顿饭还没有可用菜谱，可以编辑后重新选菜。')}</Body>
                </Pressable>
                <View style={styles.actions}>
                  <Action label={t('看缺料')} variant="quiet" icon="basket-outline" iconOnly
                    onPress={() => router.navigate({ pathname: '/shopping', params: { mealId: String(meal.id) } })} />
                  <Action label={t('删除')} variant="danger" icon="trash-outline" iconOnly disabled={busy} onPress={() => confirmDelete(
                    t('删除这顿饭？'), t('将删除「{0}」菜单。', mealName),
                    () => void run(() => write((actions) => actions.deleteMeal(meal.id))),
                  )} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { ...ui.hairline },
  meal: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 75, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  date: { width: 53, alignSelf: 'stretch', justifyContent: 'center' },
  day: { ...typeStyles.amount, color: palette.ink },
  entry: { ...ui.grow, justifyContent: 'center', minHeight: 68, paddingVertical: 10 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
