import { englishFood } from '../../domain/recipe-translations';
import { useLanguage } from '../../data/language';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Badge, Body, Card, Empty, Heading, Page, Row, useConfirmDelete, palette, typeStyles, ui, useTask } from '../../components/ui';
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
  const peak = Math.max(1, ...week.days.map(({ total }) => total.kcal));

  function exportNutrition() {
    return shareNutrition(`NutriKitchen-${today}.csv`, nutritionCsv(personal, language === 'en'));
  }

  return (
    <Page title={t("营养记录")} headerAction={
      <Action label={t("记录食物")} icon="add" onPress={() => router.push({ pathname: '/nutrition/form', params: { day } })} />
    }>
      {hasReference && <Body>{t('预置营养数据仅供参考，不会导出。记录自己的食物后，这些参考数据会自动清除。')}</Body>}
      <Row wrap>
        <Action label={t("前一天")} variant="quiet" icon="chevron-back" iconOnly onPress={() => setDay(moveDay(day, -1))} />
        <DateField label={t("查看日期")} day={day} onChange={setDay} compact />
        <Action label={t("后一天")} variant="quiet" icon="chevron-forward" iconOnly onPress={() => setDay(moveDay(day, 1))} />
        {day !== today && <Action label={t("回到今天")} variant="quiet" onPress={() => setDay(today)} />}
      </Row>
      <View style={styles.summary}>
        <Heading>{t("当天合计")}</Heading>
        <NutrientGrid values={sumNutrition(daily)} />
      </View>
      {!!daily.length && <Heading>{t('当天记录')}</Heading>}
      {!daily.length && <Empty icon="nutrition-outline" title={t("当天还没有记录")} description={t("输入食物重量和营养标签，即可计算实际摄入。")} />}
      {!!daily.length && <View style={ui.hairline}>{daily.map((entry) => {
        const values = nutritionForWeight(entry);
        return (
          <View key={entry.id} style={styles.entry}>
            <View style={ui.grow}>
              <Row wrap>
                <Text style={typeStyles.label}>{entry.starter && language === 'en' ? englishFood(entry.name) : entry.name}</Text>
                {entry.starter && <Badge>{t('参考')}</Badge>}
              </Row>
              <Text style={typeStyles.caption}>{formatNutrient(entry.grams)} {t('克')} · {nutritionFields
                .filter(({ key }) => key !== 'kcal')
                .map(({ key, label, unit }) => `${t(label)} ${formatNutrient(values[key])} ${t(unit)}`).join(' · ')}</Text>
            </View>
            <Text style={typeStyles.amount}>{formatNutrient(values.kcal)} {t('千卡')}</Text>
            <Action label={t('编辑')} variant="quiet" icon="create-outline" iconOnly disabled={busy} onPress={() => router.push({
              pathname: '/nutrition/form', params: { id: String(entry.id) },
            })} />
            <Action label={t('删除')} variant="danger" icon="trash-outline" iconOnly disabled={busy} onPress={() => confirmDelete(
              t('删除营养记录？'), t('将删除这条「{0}」记录。', entry.name),
              () => void run(() => write((actions) => actions.deleteNutritionEntry(entry.id))),
            )} />
          </View>
        );
      })}</View>}
      <Card>
        <Heading>{t("本周合计")}</Heading>
        <Body>{week.firstDay} {t("至")} {week.lastDay}{t("（周一至周日）")}</Body>
        <NutrientGrid values={week.total} />
        <View>
          {week.days.map(({ date, count, total }) => (
            <Pressable key={date} accessibilityRole="button" accessibilityLabel={t('查看 {0} 的记录', date)}
              accessibilityState={{ selected: date === day }} onPress={() => setDay(date)} style={styles.weekRow}>
              <Text style={typeStyles.amount}>{date.slice(5).replace('-', '/')}</Text>
              <View style={styles.track} accessible={false}>
                {total.kcal > 0 && <View style={[styles.bar, { width: `${total.kcal / peak * 100}%` },
                  date === day && styles.activeBar]} />}
              </View>
              <Text style={styles.weekValue}>{count ? `${formatNutrient(total.kcal)} ${t('千卡')}` : t('无记录')}</Text>
            </Pressable>
          ))}
        </View>
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
          <Text style={typeStyles.caption}>{t(label)}</Text>
          <Text style={styles.metricValue}>{formatNutrient(values[key])} <Text style={typeStyles.caption}>{t(unit)}</Text></Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { paddingVertical: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 8 },
  metric: { minWidth: 66, flexGrow: 1, gap: 3 },
  metricValue: { ...typeStyles.section, fontSize: 20, fontVariant: ['tabular-nums'] },
  entry: { minHeight: 59, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  weekRow: { minHeight: 41, alignItems: 'center', flexDirection: 'row', gap: 12 },
  track: { flex: 1, height: 5, borderRadius: 2, backgroundColor: palette.soft },
  bar: { height: 5, borderRadius: 2, backgroundColor: '#A5AAB2' },
  activeBar: { backgroundColor: palette.accent },
  weekValue: { ...typeStyles.amount, width: 84, textAlign: 'right' },
});
