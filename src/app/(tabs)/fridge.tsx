import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Field, Heading, Page, Row, confirmDelete, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { formatAmount, matchRecipes } from '../../domain/inventory';
import { readIngredient } from '../../domain/recipes';

export default function FridgeScreen() {
  const router = useRouter();
  const { data: { stock, recipes }, write } = useKitchen();
  const { busy, run } = useTask();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const matches = matchRecipes(recipes, stock);

  return (
    <Page title="我的冰箱" subtitle={`${stock.length} 条库存记录`} headerAction={
      <Action label={adding ? '收起' : '添加食材'} icon={adding ? 'remove' : 'add'} onPress={() => setAdding(!adding)} />
    }>
      {adding && (
        <Card>
          <Field label="食材名称" placeholder="例如鸡蛋" value={name} onChangeText={setName} />
          <Row>
            <View style={ui.grow}>
              <Field label="库存量（选填）" placeholder="例如 6" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
            </View>
            <View style={ui.grow}>
              <Field label="单位" placeholder="例如 个" value={unit} onChangeText={setUnit} />
            </View>
          </Row>
          <Body>填写库存量和单位，可用于计算还差多少食材。</Body>
          <Action label="存入冰箱" disabled={busy} onPress={() => void run(async () => {
            const item = readIngredient({ name, quantity, unit });
            await write((actions) => actions.addStock(item));
            setName('');
            setQuantity('');
            setUnit('');
            setAdding(false);
          })} />
        </Card>
      )}
      {!stock.length && <Empty icon="cube-outline" title="冰箱还没有食材" description="先添加手边已有的食材。" />}
      {stock.map((item) => (
        <Card key={item.id}>
          <Row>
            <View style={[ui.grow, ui.stack]}>
              <Text style={ui.itemTitle}>{item.name}</Text>
              <Body>{item.quantity === null ? '库存量未记录' : formatAmount(item)}</Body>
            </View>
            <Action label="移除" variant="danger" disabled={busy} onPress={() => confirmDelete(
              '删除库存？', `将从冰箱移除「${item.name}」这条记录。`,
              () => void run(() => write((actions) => actions.deleteStock(item.id))),
            )} />
          </Row>
        </Card>
      ))}
      <Heading>菜谱匹配</Heading>
      {!stock.length || !matches.length ? (
        <Body>记录库存并添加含食材的菜谱，即可查看匹配结果。</Body>
      ) : matches.map(({ recipe, total, available, missing }) => (
        <Card key={recipe.id}>
          <Row>
            <View style={ui.grow}><Text style={ui.itemTitle}>{recipe.title}</Text></View>
            <Action label="查看" variant="quiet" onPress={() => router.push({
              pathname: '/recipes/[id]', params: { id: String(recipe.id) },
            })} />
          </Row>
          <Row wrap>
            <Badge warm={available !== total}>{available === total ? '已录入食材齐全' : `已匹配 ${available}/${total} 种`}</Badge>
            {recipe.pending && <Badge warm>菜谱待整理</Badge>}
          </Row>
          {!!missing.length && (
            <Body>{missing.map((item) => `${item.name} ${formatAmount(item)}${item.needsReview ? '（库存待核对）' : ''}`).join(' · ')}</Body>
          )}
        </Card>
      ))}
    </Page>
  );
}
