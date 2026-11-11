import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Badge, Body, Card, Chip, Empty, Field, Heading, Page, Row, confirmDelete, palette, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { formatAmount, missingIngredients } from '../../domain/inventory';
import { recipesForMeal } from '../../domain/meals';
import { readIngredient, type Ingredient } from '../../domain/recipes';
import { adjustedShortages, isShortageChecked, shortageAmountKey, type ShoppingItem, type ShoppingShortage } from '../../domain/shopping';

export default function ShoppingScreen() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  const { data: { meals, recipes, stock, shopping, shoppingChecks, shoppingAdjustments }, write } = useKitchen();
  const { busy, run } = useTask();
  const [editor, setEditor] = useState<ShoppingItem | 'new' | null>(null);

  const meal = meals.find((item) => item.id === Number(mealId)) ?? meals[0];
  const dishes = recipesForMeal(meal, recipes);
  const required = dishes.flatMap((recipe) => recipe.ingredients);
  const calculated = missingIngredients(required, stock);
  const missing = adjustedShortages(calculated, shoppingAdjustments, meal?.id ?? 0);
  const hasAdjustments = shoppingAdjustments.some((item) => item.mealId === meal?.id);
  const checkedCount = shopping.filter((item) => item.checked).length;

  async function saveItem(input: Ingredient, id?: number) {
    await write((actions) => actions.saveShoppingItem(input, id));
    setEditor(null);
  }

  return (
    <Page title="购物清单" subtitle="先看这顿饭还缺什么。" headerAction={
      <Action label={editor === 'new' ? '收起' : '手动添加'} icon={editor === 'new' ? 'remove' : 'add'}
        onPress={() => setEditor(editor === 'new' ? null : 'new')} />
    }>
      {editor === 'new' && <Card><ShoppingEditor onSave={saveItem} /></Card>}
      <Card>
        <Heading>菜单缺料</Heading>
        {meals.length ? (
          <Row wrap>
            {meals.map((item) => <Chip key={item.id} label={`${item.name} · ${item.day}`} selected={item.id === meal?.id}
              onPress={() => router.setParams({ mealId: String(item.id) })} />)}
          </Row>
        ) : (
          <Body>保存一餐菜单后，这里会扣除冰箱库存并列出缺少的食材。</Body>
        )}
        {!!meal && (
          <>
            {dishes.some((dish) => dish.pending) && <Body>菜单包含待整理菜谱，清单只计算已录入的食材。</Body>}
            {!required.length && <Body>这顿饭还没有已录入的食材。</Body>}
            {!!required.length && !calculated.length && <Badge>已录入的食材齐全</Badge>}
            {!!calculated.length && !missing.length && <Body>已移除本餐全部缺料项目。</Body>}
            {missing.map((item) => {
              const checked = isShortageChecked(shoppingChecks, meal.id, item);
              return (
                <AutomaticItem key={item.key + item.originalAmountKey} item={item} checked={checked} disabled={busy}
                  onSave={async (input) => {
                    await write((actions) => actions.setShoppingAdjustment({
                      mealId: meal.id, ingredientKey: item.key,
                      originalAmountKey: item.originalAmountKey, replacement: input,
                    }));
                  }}
                  onDelete={() => void run(() => write((actions) => actions.setShoppingAdjustment({
                    mealId: meal.id, ingredientKey: item.key,
                    originalAmountKey: item.originalAmountKey, replacement: null,
                  })))}
                  onPress={() => void run(() => write((actions) => actions.setShoppingCheck({
                    mealId: meal.id, ingredientKey: item.key, amountKey: shortageAmountKey(item),
                  }, !checked)))} />
              );
            })}
            {hasAdjustments && <Action label="恢复自动清单" variant="quiet" disabled={busy} onPress={() => {
              confirmDelete('恢复自动清单？', '将清除本餐的手动调整、移除记录和勾选状态。', () => {
                void run(() => write((actions) => actions.resetShoppingAdjustments(meal.id)));
              }, '恢复');
            }} />}
          </>
        )}
      </Card>
      <Row>
        <Heading>手动清单</Heading>
        <Body>{checkedCount}/{shopping.length} 已勾选</Body>
      </Row>
      {!shopping.length && <Empty icon="basket-outline" title="没有手动项目" description="可手动添加临时想买的食材或厨房用品。" />}
      {shopping.map((item) => (
        <Card key={item.id}>
          <CheckItem item={item} checked={item.checked} disabled={busy}
            onPress={() => void run(() => write((actions) => actions.setShoppingItemChecked(item.id, !item.checked)))} />
          <Row wrap>
            <Action label={editor !== 'new' && editor?.id === item.id ? '取消编辑' : '编辑'}
              variant="quiet" disabled={busy}
              onPress={() => setEditor(editor !== 'new' && editor?.id === item.id ? null : item)} />
            <Action label="删除" variant="danger" disabled={busy} onPress={() => confirmDelete(
              '删除购物项目？', `将删除「${item.name}」。`,
              () => void run(async () => {
                await write((actions) => actions.deleteShoppingItem(item.id));
                if (editor !== 'new' && editor?.id === item.id) setEditor(null);
              }),
            )} />
          </Row>
          {editor !== 'new' && editor?.id === item.id &&
            <ShoppingEditor item={item} onSave={(input) => saveItem(input, item.id)} />}
        </Card>
      ))}
    </Page>
  );
}

function AutomaticItem({ item, checked, disabled, onPress, onSave, onDelete }: {
  item: ShoppingShortage;
  checked: boolean;
  disabled: boolean;
  onPress: () => void;
  onSave: (input: Ingredient) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <View style={ui.stack}>
      <CheckItem item={item} checked={checked} disabled={disabled} onPress={onPress}
        note={item.adjusted ? '已手动调整' : item.needsReview ? '库存量或单位待核对' : undefined} />
      <Row wrap>
        <Action label={editing ? '取消编辑' : '编辑'} variant="quiet" disabled={disabled} onPress={() => setEditing(!editing)} />
        <Action label="移除" variant="danger" disabled={disabled}
          onPress={() => confirmDelete('移除缺料项目？', `将从本餐购物清单移除「${item.name}」。`, onDelete, '移除')} />
      </Row>
      {editing && <ShoppingEditor item={item} onSave={async (input) => {
        await onSave(input);
        setEditing(false);
      }} />}
    </View>
  );
}

function ShoppingEditor({ item, onSave }: { item?: Ingredient; onSave: (input: Ingredient) => Promise<void> }) {
  const { run, busy } = useTask();
  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '');
  const [unit, setUnit] = useState(item?.unit ?? '');

  return (
    <View style={ui.stack}>
      <Heading>{item ? '编辑购物项目' : '添加购物项目'}</Heading>
      <Field label="项目名称" placeholder="例如酸奶" value={name} onChangeText={setName} />
      <Row>
        <View style={ui.grow}>
          <Field label="数量（选填）" placeholder="例如 2" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
        </View>
        <View style={ui.grow}>
          <Field label="单位" placeholder="例如 盒" value={unit} onChangeText={setUnit} />
        </View>
      </Row>
      <Action label="保存" disabled={busy} onPress={() => void run(() => onSave(readIngredient({ name, quantity, unit })))} />
    </View>
  );
}

function CheckItem({ item, checked, onPress, note, disabled }: {
  item: Ingredient; checked: boolean; onPress: () => void; note?: string; disabled: boolean;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={`${item.name}，${formatAmount(item)}${note ? `，${note}` : ''}`}
      accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.check, pressed && styles.pressed]}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={palette.accent} />
      <View style={ui.grow}>
        <Text style={[ui.itemTitle, checked && styles.checkedText]}>{item.name}</Text>
        {note && <Body>{note}</Body>}
      </View>
      <Body>{formatAmount(item)}</Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 5 },
  pressed: { opacity: 0.6 },
  checkedText: { color: palette.muted, textDecorationLine: 'line-through' },
});
