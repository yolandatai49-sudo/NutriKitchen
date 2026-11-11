import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Action, Body, Card, Empty, Heading, Page, Row, confirmDelete, palette, ui, useTask } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { DateField } from '../../components/date-field';
import { localDay, moveDay } from '../../domain/dates';
import { formatNutrient, nutritionCsv, nutritionFields, nutritionForWeight, nutritionWeek, sumNutrition, type Nutrients } from '../../domain/nutrition';

export default function NutritionScreen() {
  const router = useRouter();
  const { data: { nutrition }, write } = useKitchen();
  const { run, busy } = useTask();
  const [day, setDay] = useState(localDay);
  const today = localDay();
  const daily = nutrition.filter((entry) => entry.day === day);
  const week = nutritionWeek(nutrition, day);

  async function exportNutrition() {
    if (!(await Sharing.isAvailableAsync())) throw new Error('当前设备无法打开系统分享菜单。');
    const file = new File(Paths.cache, `NutriKitchen-${today}.csv`);
    try {
      file.create({ overwrite: true });
      file.write(nutritionCsv(nutrition));
      await Sharing.shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
    } finally {
      if (file.exists) file.delete();
    }
  }

  return (
    <Page title="营养记录" headerAction={
      <Action label="记录食物" icon="add" onPress={() => router.push({ pathname: '/nutrition/form', params: { day } })} />
    }>
      <Row wrap>
        <Action label="前一天" variant="quiet" icon="chevron-back" onPress={() => setDay(moveDay(day, -1))} />
        <DateField label="查看日期" day={day} onChange={setDay} />
        <Action label="后一天" variant="quiet" icon="chevron-forward" onPress={() => setDay(moveDay(day, 1))} />
        {day !== today && <Action label="回到今天" variant="quiet" onPress={() => setDay(today)} />}
      </Row>
      <Card>
        <Heading>当天合计</Heading>
        <NutrientGrid values={sumNutrition(daily)} />
      </Card>
      {!daily.length && <Empty icon="nutrition-outline" title="当天还没有记录" description="输入食物重量和营养标签，即可计算实际摄入。" />}
      {daily.map((entry) => {
        const values = nutritionForWeight(entry);
        return (
          <Card key={entry.id}>
            <Row>
              <View style={ui.grow}><Text style={ui.itemTitle}>{entry.name}</Text></View>
              <Body>{formatNutrient(entry.grams)} 克</Body>
            </Row>
            <Body>{nutritionFields.map(({ key, label, unit }) => `${label} ${formatNutrient(values[key])} ${unit}`).join(' · ')}</Body>
            <Row wrap>
              <Action label="编辑" variant="quiet" disabled={busy} onPress={() => router.push({
                pathname: '/nutrition/form', params: { id: String(entry.id) },
              })} />
              <Action label="删除" variant="danger" disabled={busy} onPress={() => confirmDelete(
                '删除营养记录？', `将删除这条「${entry.name}」记录。`,
                () => void run(() => write((actions) => actions.deleteNutritionEntry(entry.id))),
              )} />
            </Row>
          </Card>
        );
      })}
      <Card>
        <Heading>本周合计</Heading>
        <Body>{week.firstDay} 至 {week.lastDay}（周一至周日）</Body>
        <NutrientGrid values={week.total} />
        {week.days.map(({ date, count, total }) => (
          <Row key={date}>
            <View style={ui.grow}><Body>{date.slice(5)}</Body></View>
            <Body>{count ? `${formatNutrient(total.kcal)} 千卡` : '无记录'}</Body>
          </Row>
        ))}
      </Card>
      <Action label="导出全部 CSV" icon="share-outline" variant="quiet" disabled={busy || !nutrition.length}
        onPress={() => void run(exportNutrition)} />
    </Page>
  );
}

function NutrientGrid({ values }: { values: Nutrients }) {
  return (
    <View style={styles.metrics}>
      {nutritionFields.map(({ key, label, unit }) => (
        <View key={key} style={styles.metric}>
          <Body>{label} · {unit}</Body>
          <Text style={styles.metricValue}>{formatNutrient(values[key])}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { flexBasis: '46%', flexGrow: 1, padding: 10, borderRadius: 12, backgroundColor: palette.soft },
  metricValue: { color: palette.accent, fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
