import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Badge, Card, Empty, Field, Heading, Page, Row, palette, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { localDay } from '../../domain/dates';
import { buildMeal, type MealPlan } from '../../domain/meals';
import { filterRecipes } from '../../domain/recipes';

export default function MealFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useKitchen();
  const meal = id ? data.meals.find((item) => item.id === Number(id)) : undefined;

  if (id && !meal) {
    return <Page title="编辑菜单" detail><Empty icon="restaurant-outline" title="找不到这顿饭" description="返回私人菜单查看其他餐次。" /></Page>;
  }
  return <MealForm key={id ?? 'new'} meal={meal} />;
}

function MealForm({ meal }: { meal?: MealPlan }) {
  const router = useRouter();
  const { data: { recipes }, write } = useKitchen();
  const { run, busy } = useTask();
  const [name, setName] = useState(meal?.name ?? '');
  const [day, setDay] = useState(meal?.day ?? localDay());
  const [selected, setSelected] = useState(meal?.recipeIds ?? []);
  const [query, setQuery] = useState('');
  const selectedRecipes = recipes.filter((recipe) => selected.includes(recipe.id));
  const available = filterRecipes(recipes, query, null, false);

  return (
    <Page title={meal ? '编辑菜单' : '新建一餐'} detail>
      <Card>
        <Field label="这顿饭的名称" placeholder="例如周末晚餐" value={name} onChangeText={setName} />
        <Field label="日期（YYYY-MM-DD）" value={day} onChangeText={setDay} autoCorrect={false} />
      </Card>
      <Card>
        <Heading>已选 {selectedRecipes.length} 道菜</Heading>
        {!!selectedRecipes.length && (
          <Row wrap>{selectedRecipes.map((recipe) => <Badge key={recipe.id}>{recipe.title}</Badge>)}</Row>
        )}
        <Field label="搜索菜谱" placeholder="菜名、分类或食材" value={query} onChangeText={setQuery} clearButtonMode="while-editing" />
        {available.map((recipe) => {
          const checked = selected.includes(recipe.id);
          return (
            <Pressable key={recipe.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => {
              setSelected((ids) => ids.includes(recipe.id) ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id]);
            }} style={({ pressed }) => [styles.dish, pressed && styles.pressed]}>
              <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={palette.accent} />
              <View style={ui.grow}><Text style={ui.itemTitle}>{recipe.title}</Text></View>
              <Badge warm={recipe.pending}>{recipe.pending ? '待整理' : recipe.category}</Badge>
            </Pressable>
          );
        })}
        {!available.length && <Empty icon="book-outline" title={recipes.length ? '没有匹配的菜谱' : '先添加一道菜谱'}
          description={recipes.length ? '换一个关键词试试。' : '在菜谱页添加菜谱后就能选菜。'} />}
        {!recipes.length && <Action label="新增菜谱" variant="quiet" onPress={() => router.push('/recipes/form')} />}
      </Card>
      <Action label="保存菜单" disabled={busy || !selectedRecipes.length} onPress={() => void run(async () => {
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
