import { presentSavedRecipe } from '../../domain/recipe-collection';
import { useLanguage } from '../../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Badge, Card, Empty, Field, Heading, Page, Row, palette, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { DateField } from '../../components/date-field';
import { localDay } from '../../domain/dates';
import { buildMeal, type MealPlan } from '../../domain/meals';
import { filterRecipes, matchesRecipeSearch, normalizeName } from '../../domain/recipes';

export default function MealFormRoute() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useKitchen();
  const meal = id ? data.meals.find((item) => item.id === Number(id)) : undefined;

  if (id && !meal) {
    return <Page title={t("编辑菜单")} detail><Empty icon="restaurant-outline" title={t("找不到这顿饭")} description={t("返回私人菜单查看其他餐次。")} /></Page>;
  }
  return <MealForm key={id ?? 'new'} meal={meal} />;
}

function MealForm({ meal }: { meal?: MealPlan }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { data: { recipes }, write } = useKitchen();
  const { run, busy } = useTask();
  const [name, setName] = useState(meal?.name ?? '');
  const [day, setDay] = useState(meal?.day ?? localDay());
  const [selected, setSelected] = useState(meal?.recipeIds ?? []);
  const [query, setQuery] = useState('');
  const english = language === 'en';
  const displayed = recipes.map((recipe) => presentSavedRecipe(recipe, english));
  const selectedRecipes = displayed.filter((recipe) => selected.includes(recipe.id));
  const terms = normalizeName(query).split(' ').filter(Boolean);
  const matches = new Set(filterRecipes(recipes, query, null, false).map(({ id }) => id));
  const available = displayed.filter((recipe) => matches.has(recipe.id) || matchesRecipeSearch(recipe, terms));

  return (
    <Page title={meal ? t("编辑菜单") : t("新建一餐")} detail>
      <Card>
        <Field label={t("这顿饭的名称")} placeholder={t("例如周末晚餐")} value={name} onChangeText={setName} />
        <DateField label={t("用餐日期")} day={day} onChange={setDay} />
      </Card>
      <Card>
        <Heading>{t("已选")} {selectedRecipes.length} {t("道菜")}</Heading>
        {!!selectedRecipes.length && (
          <Row wrap>{selectedRecipes.map((recipe) => <Badge key={recipe.id}>{recipe.title}</Badge>)}</Row>
        )}
        <Field label={t("搜索菜谱")} placeholder={t("菜名、分类或食材")} value={query} onChangeText={setQuery} clearButtonMode="while-editing" />
        {available.map((recipe) => {
          const checked = selected.includes(recipe.id);
          return (
            <Pressable key={recipe.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => {
              setSelected((ids) => ids.includes(recipe.id) ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id]);
            }} style={({ pressed }) => [styles.dish, pressed && styles.pressed]}>
              <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={palette.accent} />
              <View style={ui.grow}><Text style={ui.itemTitle}>{recipe.title}</Text></View>
              <Badge warm={recipe.pending}>{recipe.pending ? t("待整理") : recipe.category}</Badge>
            </Pressable>
          );
        })}
        {!available.length && <Empty icon="book-outline" title={recipes.length ? t("没有匹配的菜谱") : t("先添加一道菜谱")}
          description={recipes.length ? t("换一个关键词试试。") : t("在菜谱页添加菜谱后就能选菜。")} />}
        {!recipes.length && <Action label={t("新增菜谱")} variant="quiet" onPress={() => router.push('/recipes/form')} />}
      </Card>
      <Action label={t("保存菜单")} disabled={busy || !selectedRecipes.length} onPress={() => void run(async () => {
        const validIds = selected.filter((id) => selectedRecipes.some((recipe) => recipe.id === id));
        await write((actions) => actions.saveMeal(buildMeal(name, day, validIds), meal?.id));
        router.back();
      })} />
    </Page>
  );
}

const styles = StyleSheet.create({
  dish: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  pressed: { opacity: 0.6 },
});
