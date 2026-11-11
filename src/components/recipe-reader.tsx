import { useLanguage } from '../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatAmount } from '../domain/inventory';
import { presentRecipe, type CollectionRecipe } from '../domain/recipe-collection';
import type { RecipeInput } from '../domain/recipes';
import { PhotoViewer } from './photo-viewer';
import { recipeCover } from './recipe-covers';
import { Action, Body, Page, palette, ui, useTask } from './ui';

export function RecipeReader({ recipe: input, collection, controls, footer }: {
  recipe: RecipeInput;
  collection?: CollectionRecipe;
  controls: ReactNode;
  footer?: ReactNode;
}) {
  const { t, language } = useLanguage();
  const recipe = presentRecipe(input, collection, language === 'en');
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [step, setStep] = useState<number | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [preview, setPreview] = useState(false);
  const { run, busy } = useTask();
  const cover = recipeCover(collection?.key);
  const reference = collection?.reference;

  function toggleIngredient(index: number) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const ingredients = (
    <View>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{t("备料")}</Text>
        {recipe.ingredients.length > 0 && <Text style={styles.meta}>{t("已备")} {checked.size} / {recipe.ingredients.length}</Text>}
      </View>
      {recipe.ingredients.length === 0 && <Body>{t("尚未添加食材。")}</Body>}
      {recipe.ingredients.map((item, index) => {
        const ready = checked.has(index);
        const amount = t(formatAmount(item));
        return (
          <Pressable key={index} accessibilityRole="checkbox" accessibilityState={{ checked: ready }}
            accessibilityLabel={`${item.name}，${amount}`} onPress={() => toggleIngredient(index)}
            style={({ pressed }) => [styles.ingredient, pressed && styles.pressed]}>
            <Ionicons name={ready ? 'checkmark-circle' : 'ellipse-outline'} color={ready ? palette.accent : palette.muted} size={21} accessible={false} />
            <Text style={[styles.ingredientName, ready && styles.checked]}>{item.name}</Text>
            <Text style={styles.meta}>{amount}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (step !== null) {
    const last = step === recipe.steps.length - 1;
    return (
      <Page key="cook" title={t("逐步烹饪")} subtitle={recipe.title} detail>
        <View style={styles.stepPage}>
          <Text accessibilityLiveRegion="polite" style={styles.stepCount}>{t('第 {0} 步 / 共 {1} 步', step + 1, recipe.steps.length)}</Text>
          <View style={styles.progress} accessible={false}>
            {recipe.steps.map((_, index) => (
              <View key={index} style={[styles.progressSegment, index <= step && styles.progressFilled]} />
            ))}
          </View>
          <Text style={styles.currentStep}>{recipe.steps[step]}</Text>
        </View>
        <View style={styles.controls}>
          <Action label={t("上一步")} variant="quiet" disabled={step === 0} onPress={() => setStep(step - 1)} />
          <Action label={last ? t("完成烹饪") : t("下一步")} icon={last ? 'checkmark' : 'arrow-forward'}
            onPress={() => setStep(last ? null : step + 1)} />
        </View>
        <View style={styles.secondaryControls}>
          <Action label={showIngredients ? t("收起食材") : t("查看食材")} variant="quiet" onPress={() => setShowIngredients(!showIngredients)} />
          <Action label={t("返回菜谱")} variant="quiet" onPress={() => setStep(null)} />
        </View>
        {showIngredients && ingredients}
      </Page>
    );
  }

  return (
    <Page key="recipe" title={recipe.title} detail>
      <Text style={styles.meta}>
        {recipe.category}{collection ? t(" · {0} 人份 · 约 {1} 分钟", collection.servings, collection.minutes) : ''}
        {recipe.pending ? ' ' + t('· 待整理') : ''}
      </Text>
      {cover !== undefined && (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={t("放大菜谱图片")} onPress={() => setPreview(true)}
            style={styles.coverFrame}>
            <Image source={cover} resizeMode="contain" style={styles.cover} accessible={false} />
            <View style={styles.expand}><Ionicons name="expand-outline" color="#fff" size={20} accessible={false} /></View>
          </Pressable>
          {preview && <PhotoViewer photo={cover} title={recipe.title} onClose={() => setPreview(false)} />}
        </>
      )}
      <View style={styles.controls}>{controls}</View>
      {ingredients}
      <View>
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{t("做法")}</Text>
          {recipe.steps.length > 0 && (
            <Action label={t("开始做菜")} icon="arrow-forward" onPress={() => { setShowIngredients(false); setStep(0); }} />
          )}
        </View>
        {recipe.steps.length === 0 && <Body>{t("尚未添加步骤。")}</Body>}
        {recipe.steps.map((line, index) => (
          <View key={index} style={styles.direction}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={ui.grow}><Body>{line}</Body></View>
          </View>
        ))}
      </View>
      {reference && <View style={styles.source}>
        <Body>{t("两人份家常改写 · 配图为示意")}</Body>
        <Action label={t(reference.label)} icon="open-outline" variant="quiet" disabled={busy}
          onPress={() => void run(() => Linking.openURL(reference.url))} />
      </View>}
      {footer}
    </Page>
  );
}

const rule = StyleSheet.hairlineWidth;
const styles = StyleSheet.create({
  coverFrame: { width: '100%', aspectRatio: 4 / 5, maxHeight: 380, backgroundColor: palette.soft, overflow: 'hidden', borderRadius: 14 },
  cover: { width: '100%', height: '100%' },
  expand: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#151515C9', borderRadius: 18, padding: 8 },
  source: { gap: 4, alignItems: 'flex-start' },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  secondaryControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTopWidth: rule, borderColor: palette.line },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6, paddingBottom: 10, borderBottomWidth: rule, borderColor: palette.line },
  sectionTitle: { color: palette.ink, fontSize: 25, fontWeight: '700' },
  ingredient: { flexDirection: 'row', minHeight: 47, alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: rule, borderColor: palette.line },
  ingredientName: { flex: 1, color: palette.ink, fontSize: 16 },
  checked: { color: palette.muted, textDecorationLine: 'line-through' },
  pressed: { opacity: 0.5 },
  direction: { flexDirection: 'row', gap: 16, paddingVertical: 14, borderBottomWidth: rule, borderColor: palette.line },
  number: { color: palette.accent, fontSize: 17, lineHeight: 22 },
  stepPage: { padding: 20, gap: 18, backgroundColor: palette.surface, borderWidth: rule, borderColor: palette.line },
  stepCount: { fontSize: 15, fontWeight: '700', color: palette.accent },
  progress: { flexDirection: 'row', gap: 5 },
  progressSegment: { flex: 1, height: 3, backgroundColor: palette.line },
  progressFilled: { backgroundColor: palette.accent },
  currentStep: { color: palette.ink, fontSize: 26, lineHeight: 41, paddingBottom: 20 },
});
