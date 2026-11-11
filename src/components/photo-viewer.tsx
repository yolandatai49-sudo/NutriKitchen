import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Image, Modal, PanResponder, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../data/language';
import { typeStyles, type IconName } from './ui';

export function PhotoViewer({ photo, title, caption, position, onClose, onPrevious, onNext, onRecipe }: {
  photo: ImageSourcePropType;
  title: string;
  caption?: string;
  position?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onRecipe?: () => void;
}) {
  const { t } = useLanguage();
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Boolean(onNext || onPrevious) && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4,
    onPanResponderRelease: (_, { dx }) => {
      if (dx <= -48) onNext?.();
      if (dx >= 48) onPrevious?.();
    },
  }), [onNext, onPrevious]);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.frame} accessibilityViewIsModal>
        <StatusBar style="light" />
        <View style={styles.toolbar}>
          <View style={styles.side} />
          <Text style={styles.counter} accessibilityLiveRegion="polite">{position}</Text>
          <ViewerButton icon="close" label={t('关闭图片预览')} onPress={onClose} />
        </View>
        <View style={styles.stage} {...pan.panHandlers}>
          <Image accessibilityLabel={t('{0}完整图片', title)} accessibilityRole="image" source={photo}
            resizeMode="contain" style={styles.image} />
        </View>
        <View style={styles.footer}>
          <View style={styles.metadata}>
            <Text style={styles.title}>{title}</Text>
            {caption && <Text style={styles.caption}>{caption}</Text>}
          </View>
          {onRecipe && (
            <View style={styles.actions}>
              <ViewerButton icon="chevron-back" label={t('上一道菜')} onPress={onPrevious} />
              <Pressable accessibilityRole="button" accessibilityLabel={t('查看做法')} onPress={onRecipe} style={styles.recipe}>
                <Text style={styles.recipeText}>{t('查看做法')}</Text>
              </Pressable>
              <ViewerButton icon="chevron-forward" label={t('下一道菜')} onPress={onNext} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ViewerButton({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={!onPress}
      accessibilityState={{ disabled: !onPress }} onPress={onPress} style={[styles.button, !onPress && styles.disabled]}>
      <Ionicons name={icon} size={25} color="#fff" accessible={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#0B0B0C', paddingHorizontal: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50 },
  side: { width: 46 },
  counter: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'], color: '#ddd' },
  button: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.28 },
  stage: { flex: 1, minHeight: 0, alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  footer: { gap: 10, paddingTop: 12, paddingBottom: 8, width: '100%', maxWidth: 510, alignSelf: 'center' },
  metadata: { gap: 4, alignItems: 'center', paddingHorizontal: 12 },
  title: { ...typeStyles.section, textAlign: 'center', color: '#fff' },
  caption: { textAlign: 'center', color: '#ccc', fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  recipe: { borderRadius: 24, minHeight: 44, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  recipeText: { ...typeStyles.label, color: '#141415' },
});
