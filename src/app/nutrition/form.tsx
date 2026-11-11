import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Action, Body, Card, Chip, Empty, Field, Heading, Page, Row, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { DateField } from '../../components/date-field';
import { localDay } from '../../domain/dates';
import { buildNutritionEntry, type NutritionEntry } from '../../domain/nutrition';
import { normalizeName, readDecimal } from '../../domain/recipes';

export default function NutritionFormRoute() {
  const { id, day } = useLocalSearchParams<{ id?: string; day?: string }>();
  const { data } = useKitchen();
  const entry = id ? data.nutrition.find((item) => item.id === Number(id)) : undefined;

  if (id && !entry) {
    return <Page title="编辑记录" detail><Empty icon="nutrition-outline" title="找不到这条记录" description="返回营养记录查看其他食物。" /></Page>;
  }
  return <NutritionForm key={id ?? 'new'} entry={entry} initialDay={day ?? localDay()} />;
}

function NutritionForm({ entry, initialDay }: { entry?: NutritionEntry; initialDay: string }) {
  const router = useRouter();
  const { data, write } = useKitchen();
  const { run, busy } = useTask();
  const [day, setDay] = useState(entry?.day ?? initialDay);
  const [name, setName] = useState(entry?.name ?? '');
  const [grams, setGrams] = useState(entry?.grams.toString() ?? '');
  const [energyUnit, setEnergyUnit] = useState<'kcal' | 'kJ'>('kcal');
  const [per100, setPer100] = useState(entry ? formValues(entry) : { kcal: '', protein: '', carbs: '', fat: '' });

  function changeEnergyUnit(next: 'kcal' | 'kJ') {
    if (next === energyUnit) return;
    const value = readDecimal(per100.kcal);
    if (value !== null) {
      const converted = next === 'kJ' ? value * 4.184 : value / 4.184;
      setPer100((values) => ({ ...values, kcal: String(Number(converted.toPrecision(12))) }));
    }
    setEnergyUnit(next);
  }

  const recent = new Map<string, NutritionEntry>();
  for (const item of [...data.nutrition].sort((a, b) => b.id - a.id)) {
    const key = normalizeName(item.name);
    if (!recent.has(key)) recent.set(key, item);
    if (recent.size === 6) break;
  }

  return (
    <Page title={entry ? '编辑记录' : '记录食物'} detail>
      {!entry && !!recent.size && (
        <Card>
          <Heading>最近记录过</Heading>
          <Body>点选食物可沿用每 100 克的数据。</Body>
          <Row wrap>
            {[...recent.values()].map((item) => <Chip key={item.id} label={item.name} selected={name === item.name}
              onPress={() => { setName(item.name); setEnergyUnit('kcal'); setPer100(formValues(item)); }} />)}
          </Row>
        </Card>
      )}
      <Card>
        <DateField label="记录日期" day={day} onChange={setDay} />
        <Field label="食物名称" placeholder="例如原味酸奶" value={name} onChangeText={setName} />
        <Field label="实际食用重量（克）" placeholder="例如 150" keyboardType="decimal-pad" value={grams} onChangeText={setGrams} />
      </Card>
      <Card>
        <Heading>每 100 克的营养成分</Heading>
        <Body>按包装或你使用的数据来源填写。含量为零时请输入 0。</Body>
        <Row wrap>
          <Chip label="热量用千卡" selected={energyUnit === 'kcal'} onPress={() => changeEnergyUnit('kcal')} />
          <Chip label="热量用千焦" selected={energyUnit === 'kJ'} onPress={() => changeEnergyUnit('kJ')} />
        </Row>
        <Field label={energyUnit === 'kcal' ? '热量（千卡）' : '热量（千焦）'} keyboardType="decimal-pad" value={per100.kcal}
          onChangeText={(value) => setPer100((values) => ({ ...values, kcal: value }))} />
        <Row>
          <View style={ui.grow}>
            <Field label="蛋白质（克）" keyboardType="decimal-pad" value={per100.protein}
              onChangeText={(value) => setPer100((values) => ({ ...values, protein: value }))} />
          </View>
          <View style={ui.grow}>
            <Field label="碳水（克）" keyboardType="decimal-pad" value={per100.carbs}
              onChangeText={(value) => setPer100((values) => ({ ...values, carbs: value }))} />
          </View>
        </Row>
        <Field label="脂肪（克）" keyboardType="decimal-pad" value={per100.fat}
          onChangeText={(value) => setPer100((values) => ({ ...values, fat: value }))} />
      </Card>
      <Action label="保存营养记录" disabled={busy} onPress={() => void run(async () => {
        const input = buildNutritionEntry({ day, name, grams, per100, energyUnit });
        await write((actions) => actions.saveNutritionEntry(input, entry?.id));
        router.back();
      })} />
    </Page>
  );
}

function formValues({ per100 }: NutritionEntry) {
  return {
    kcal: String(per100.kcal),
    protein: String(per100.protein),
    carbs: String(per100.carbs),
    fat: String(per100.fat),
  };
}
