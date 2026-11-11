import { presentSavedRecipe } from '../../domain/recipe-collection';
import { englishFood } from '../../domain/recipe-translations';
import { useLanguage } from '../../data/language';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Field, Heading, Page, Row, useConfirmDelete, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { formatAmount, matchRecipes } from '../../domain/inventory';
import { readIngredient } from '../../domain/recipes';

export default function FridgeScreen() {
  const { t, language } = useLanguage();
  const english = language === 'en';
  const foodName = (name: string) => english ? englishFood(name) : name;
  const confirmDelete = useConfirmDelete();
  const router = useRouter();
  const { data: { stock, recipes }, write } = useKitchen();
  const { busy, run } = useTask();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const matches = matchRecipes(recipes, stock);

  return (
    <Page title={t("我的冰箱")} subtitle={t("{0} 条库存记录", stock.length)} headerAction={
      <Action label={adding ? t("收起") : t("添加食材")} icon={adding ? 'remove' : 'add'} onPress={() => setAdding(!adding)} />
    }>
      {adding && (
        <Card>
          <Field label={t("食材名称")} placeholder={t("例如鸡蛋")} value={name} onChangeText={setName} />
          <Row>
            <View style={ui.grow}>
              <Field label={t("库存量（选填）")} placeholder={t("例如 6")} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
            </View>
            <View style={ui.grow}>
              <Field label={t("单位")} placeholder={t("例如 个")} value={unit} onChangeText={setUnit} />
            </View>
          </Row>
          <Body>{t("填写库存量和单位，可用于计算还差多少食材。")}</Body>
          <Action label={t("存入冰箱")} disabled={busy} onPress={() => void run(async () => {
            const item = readIngredient({ name, quantity, unit });
            await write((actions) => actions.addStock(item));
            setName('');
            setQuantity('');
            setUnit('');
            setAdding(false);
          })} />
        </Card>
      )}
      {!stock.length && <Empty icon="cube-outline" title={t("冰箱还没有食材")} description={t("先添加手边已有的食材。")} />}
      {stock.map((item) => (
        <Card key={item.id}>
          <Row>
            <View style={[ui.grow, ui.stack]}>
              <Text style={ui.itemTitle}>{foodName(item.name)}</Text>
              <Body>{item.quantity === null ? t("库存量未记录") : formatAmount(item, english)}</Body>
            </View>
            <Action label={t("移除")} variant="danger" disabled={busy} onPress={() => confirmDelete(
              t("删除库存？"), t("将从冰箱移除「{0}」这条记录。", item.name),
              () => void run(() => write((actions) => actions.deleteStock(item.id))),
            )} />
          </Row>
        </Card>
      ))}
      <Heading>{t("菜谱匹配")}</Heading>
      {!stock.length || !matches.length ? (
        <Body>{t("记录库存并添加含食材的菜谱，即可查看匹配结果。")}</Body>
      ) : matches.map(({ recipe, total, available, missing }) => (
        <Card key={recipe.id}>
          <Row>
            <View style={ui.grow}><Text style={ui.itemTitle}>{presentSavedRecipe(recipe, english).title}</Text></View>
            <Action label={t("查看")} variant="quiet" onPress={() => router.push({
              pathname: '/recipes/[id]', params: { id: String(recipe.id) },
            })} />
          </Row>
          <Row wrap>
            <Badge warm={available !== total}>{available === total ? t("已录入食材齐全") : t("已匹配 {0}/{1} 种", available, total)}</Badge>
            {recipe.pending && <Badge warm>{t("菜谱待整理")}</Badge>}
          </Row>
          {!!missing.length && (
            <Body>{missing.map((item) => `${foodName(item.name)} ${formatAmount(item, english)}${item.needsReview ? ' (' + t('库存待核对') + ')' : ''}`).join(' · ')}</Body>
          )}
        </Card>
      ))}
    </Page>
  );
}
