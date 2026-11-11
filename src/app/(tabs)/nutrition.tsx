import { englishFood } from '../../domain/recipe-translations';
import { useLanguage } from '../../data/language';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Heading, Page, Row, useConfirmDelete, palette, ui, useTask } from '../../components/ui';
import { shareNutrition } from '../../data/share-nutrition';
import { useKitchen } from '../../data/kitchen';
import { DateField } from '../../components/date-field';
import { localDay, moveDay } from '../../domain/dates';
import { formatNutrient, nutritionCsv, nutritionFields, nutritionForWeight, nutritionWeek, sumNutrition, type Nutrients } from '../../domain/nutrition';

export default function NutritionScreen() {
  const { t, language } = useLanguage();
  const confirmDelete = useConfirmDelete();
  const router = useRouter();
  const { data: { nutrition }, write } = useKitchen();
  const { run, busy } = useTask();
  const [day, setDay] = useState(localDay);
  const today = localDay();
  const personal = nutrition.filter((entry) => !entry.starter);
  const hasReference = nutrition.some((entry) => entry.starter);
  const daily = nutrition.filter((entry) => entry.day === day);
  const week = nutritionWeek(nutrition, day);

  function exportNutrition() {
    return shareNutrition(`NutriKitchen-${today}.csv`, nutritionCsv(personal, language === 'en'));
  }

  return (
    <Page title={t("营养记录")} headerAction={
      <Action label={t("记录食物")} icon="add" onPress={() => router.push({ pathname: '/nutrition/form', params: { day } })} />
    }>
      {hasReference && <Body>{t('预置营养数据仅供参考，不会导出。记录自己的食物后，这些参考数据会自动清除。')}</Body>}
      <Row wrap>
        <Action label={t("前一天")} variant="quiet" icon="chevron-back" onPress={() => setDay(moveDay(day, -1))} />
        <DateField label={t("查看日期")} day={day} onChange={setDay} />
        <Action label={t("后一天")} variant="quiet" icon="chevron-forward" onPress={() => setDay(moveDay(day, 1))} />
        {day !== today && <Action label={t("回到今天")} variant="quiet" onPress={() => setDay(today)} />}
      </Row>
      <Card>
        <Heading>{t("当天合计")}</Heading>
        <NutrientGrid values={sumNutrition(daily)} />
      </Card>
      {!daily.length && <Empty icon="nutrition-outline" title={t("当天还没有记录")} description={t("输入食物重量和营养标签，即可计算实际摄入。")} />}
      {daily.map((entry) => {
        const values = nutritionForWeight(entry);
        return (
          <Card key={entry.id}>
            <Row>
              <View style={ui.grow}><Text style={ui.itemTitle}>{entry.starter && language === 'en' ? englishFood(entry.name) : entry.name}</Text></View>
              {entry.starter && <Badge>{t('参考')}</Badge>}
              <Body>{formatNutrient(entry.grams)} {t("克")}</Body>
            </Row>
            <Body>{nutritionFields.map(({ key, label, unit }) => `${t(label)} ${formatNutrient(values[key])} ${t(unit)}`).join(' · ')}</Body>
            <Row wrap>
              <Action label={t("编辑")} variant="quiet" disabled={busy} onPress={() => router.push({
                pathname: '/nutrition/form', params: { id: String(entry.id) },
              })} />
              <Action label={t("删除")} variant="danger" disabled={busy} onPress={() => confirmDelete(
                t("删除营养记录？"), t("将删除这条「{0}」记录。", entry.name),
                () => void run(() => write((actions) => actions.deleteNutritionEntry(entry.id))),
              )} />
            </Row>
          </Card>
        );
      })}
      <Card>
        <Heading>{t("本周合计")}</Heading>
        <Body>{week.firstDay} {t("至")} {week.lastDay}{t("（周一至周日）")}</Body>
        <NutrientGrid values={week.total} />
        {week.days.map(({ date, count, total }) => (
          <Row key={date}>
            <View style={ui.grow}><Body>{date.slice(5)}</Body></View>
            <Body>{count ? `${formatNutrient(total.kcal)} ${t('千卡')}` : t("无记录")}</Body>
          </Row>
        ))}
      </Card>
      <Action label={t("导出全部 CSV")} icon="share-outline" variant="quiet" disabled={busy || !personal.length}
        onPress={() => void run(exportNutrition)} />
    </Page>
  );
}

function NutrientGrid({ values }: { values: Nutrients }) {
  const { t } = useLanguage();
  return (
    <View style={styles.metrics}>
      {nutritionFields.map(({ key, label, unit }) => (
        <View key={key} style={styles.metric}>
          <Body>{t(label)} · {t(unit)}</Body>
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
