import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatAmount } from '../domain/inventory';
import type { CollectionRecipe } from '../domain/recipe-collection';
import type { RecipeInput } from '../domain/recipes';
import { recipeCover } from './recipe-covers';
import { Action, Body, Page, editorialFont, palette, ui } from './ui';

export function RecipeReader({ recipe, collection, controls, footer }: {
  recipe: RecipeInput;
  collection?: CollectionRecipe;
  controls: ReactNode;
  footer?: ReactNode;
}) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [step, setStep] = useState<number | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const cover = recipeCover(collection?.key);

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
        <Text accessibilityRole="header" style={styles.sectionTitle}>备料</Text>
        {recipe.ingredients.length > 0 && <Text style={styles.meta}>已备 {checked.size} / {recipe.ingredients.length}</Text>}
      </View>
      {recipe.ingredients.length === 0 && <Body>尚未添加食材。</Body>}
      {recipe.ingredients.map((item, index) => {
        const ready = checked.has(index);
        const amount = formatAmount(item);
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
      <Page key="cook" title="逐步烹饪" subtitle={recipe.title} detail>
        <View style={styles.stepPage}>
          <Text accessibilityLiveRegion="polite" style={styles.stepCount}>第 {step + 1} 步 / 共 {recipe.steps.length} 步</Text>
          <View style={styles.progress} accessible={false}>
            {recipe.steps.map((_, index) => (
              <View key={index} style={[styles.progressSegment, index <= step && styles.progressFilled]} />
            ))}
          </View>
          <Text style={styles.currentStep}>{recipe.steps[step]}</Text>
        </View>
        <View style={styles.controls}>
          <Action label="上一步" variant="quiet" disabled={step === 0} onPress={() => setStep(step - 1)} />
          <Action label={last ? '完成烹饪' : '下一步'} icon={last ? 'checkmark' : 'arrow-forward'}
            onPress={() => setStep(last ? null : step + 1)} />
        </View>
        <View style={styles.secondaryControls}>
          <Action label={showIngredients ? '收起食材' : '查看食材'} variant="quiet" onPress={() => setShowIngredients(!showIngredients)} />
          <Action label="返回菜谱" variant="quiet" onPress={() => setStep(null)} />
        </View>
        {showIngredients && ingredients}
      </Page>
    );
  }

  return (
    <Page key="recipe" title={recipe.title} detail>
      <Text style={styles.meta}>
        {recipe.category}{collection ? ` · ${collection.servings} 人份 · 约 ${collection.minutes} 分钟` : ''}
        {recipe.pending ? ' · 待整理' : ''}
      </Text>
      {cover !== undefined && <Image source={cover} resizeMode="cover" style={styles.cover} accessible={false} />}
      <View style={styles.controls}>{controls}</View>
      {ingredients}
      <View>
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>做法</Text>
          {recipe.steps.length > 0 && (
            <Action label="开始做菜" icon="arrow-forward" onPress={() => { setShowIngredients(false); setStep(0); }} />
          )}
        </View>
        {recipe.steps.length === 0 && <Body>尚未添加步骤。</Body>}
        {recipe.steps.map((line, index) => (
          <View key={index} style={styles.direction}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={ui.grow}><Body>{line}</Body></View>
          </View>
        ))}
      </View>
      {footer}
    </Page>
  );
}

const rule = StyleSheet.hairlineWidth;
const styles = StyleSheet.create({
  cover: { width: '100%', aspectRatio: 1.45, maxHeight: 340, backgroundColor: palette.soft },
  meta: { fontSize: 14, lineHeight: 20, color: palette.muted },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  secondaryControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTopWidth: rule, borderColor: palette.line },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6, paddingBottom: 10, borderBottomWidth: rule, borderColor: palette.line },
  sectionTitle: { fontFamily: editorialFont, color: palette.ink, fontSize: 25, fontWeight: '700' },
  ingredient: { flexDirection: 'row', minHeight: 47, alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: rule, borderColor: palette.line },
  ingredientName: { flex: 1, color: palette.ink, fontSize: 16 },
  checked: { color: palette.muted, textDecorationLine: 'line-through' },
  pressed: { opacity: 0.5 },
  direction: { flexDirection: 'row', gap: 16, paddingVertical: 14, borderBottomWidth: rule, borderColor: palette.line },
  number: { color: palette.accent, fontFamily: 'Georgia', fontSize: 17, lineHeight: 22 },
  stepPage: { padding: 20, gap: 18, backgroundColor: palette.surface, borderWidth: rule, borderColor: palette.line },
  stepCount: { fontSize: 15, fontWeight: '700', color: palette.accent },
  progress: { flexDirection: 'row', gap: 5 },
  progressSegment: { flex: 1, height: 3, backgroundColor: palette.line },
  progressFilled: { backgroundColor: palette.accent },
  currentStep: { color: palette.ink, fontSize: 26, lineHeight: 41, paddingBottom: 20 },
});
