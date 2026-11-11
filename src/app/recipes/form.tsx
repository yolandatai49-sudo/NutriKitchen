import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Action, Body, Card, Empty, Field, Heading, Page, Row, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { buildRecipe, type IngredientDraft, type Recipe } from '../../domain/recipes';

type IngredientRow = IngredientDraft & { key: number };

export default function RecipeFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useKitchen();
  const recipe = id ? data.recipes.find((item) => item.id === Number(id)) : undefined;

  if (id && !recipe) {
    return <Page title="编辑菜谱" detail><Empty icon="book-outline" title="找不到这道菜" description="返回菜谱列表查看其他菜谱。" /></Page>;
  }
  return <RecipeForm key={id ?? 'new'} recipe={recipe} />;
}

function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const { write } = useKitchen();
  const { run, busy } = useTask();
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [category, setCategory] = useState(recipe?.category ?? '');
  const [source, setSource] = useState(recipe?.sourceUrl ?? '');
  const [steps, setSteps] = useState(recipe?.steps.join('\n') ?? '');
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() => recipe?.ingredients.length
    ? recipe.ingredients.map((item, key) => ({ ...item, key, quantity: item.quantity?.toString() ?? '' }))
    : [{ key: 0, name: '', quantity: '', unit: '' }]);
  const nextKey = useRef(ingredients.length);

  function updateIngredient(key: number, field: keyof IngredientDraft, value: string) {
    setIngredients((rows) => rows.map((item) => item.key === key ? { ...item, [field]: value } : item));
  }

  return (
    <Page title={recipe ? '编辑菜谱' : '新增菜谱'} detail>
      <Card>
        <Field label="菜名" placeholder="例如番茄炒蛋" value={title} onChangeText={setTitle} />
        <Field label="分类（选填）" placeholder="例如家常菜" value={category} onChangeText={setCategory} />
        <Field label="小红书原文（选填）" placeholder="粘贴链接或分享文字" value={source} onChangeText={setSource}
          autoCapitalize="none" autoCorrect={false} multiline />
        <Body>只有链接也可以保存。补全菜名、食材和步骤后会取消「待整理」。</Body>
      </Card>
      <Card>
        <Heading>食材</Heading>
        <Body>只填名称也可以。需要自动汇总用量时，请同时填写数量和单位。</Body>
        {ingredients.map((item, index) => (
          <View key={item.key} style={ui.stack}>
            <Row>
              <View style={ui.grow}>
                <Field label={`食材 ${index + 1}`} placeholder="名称" value={item.name} onChangeText={(value) => updateIngredient(item.key, 'name', value)} />
              </View>
              <Action label="移除" variant="danger" onPress={() => setIngredients((rows) => rows.filter((row) => row.key !== item.key))} />
            </Row>
            <Row>
              <View style={ui.grow}>
                <Field label="数量" placeholder="例如 200" keyboardType="decimal-pad" value={item.quantity}
                  onChangeText={(value) => updateIngredient(item.key, 'quantity', value)} />
              </View>
              <View style={ui.grow}>
                <Field label="单位" placeholder="例如 克、个" value={item.unit} onChangeText={(value) => updateIngredient(item.key, 'unit', value)} />
              </View>
            </Row>
          </View>
        ))}
        <Action label="添加食材" icon="add" variant="quiet" onPress={() => {
          const key = nextKey.current++;
          setIngredients((rows) => [...rows, { key, name: '', quantity: '', unit: '' }]);
        }} />
      </Card>
      <Card>
        <Field label="烹饪步骤" placeholder="每行填写一个步骤" multiline value={steps} onChangeText={setSteps} />
      </Card>
      <Action label={busy ? '保存中…' : '保存菜谱'} disabled={busy} onPress={() => void run(async () => {
        const input = buildRecipe({ title, category, source, steps, ingredients });
        const id = await write((actions) => actions.saveRecipe(input, recipe?.id));
        if (recipe) router.back();
        else router.replace({ pathname: '/recipes/[id]', params: { id: String(id) } });
      })} />
    </Page>
  );
}
