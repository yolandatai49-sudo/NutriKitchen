import { useLanguage } from '../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDesktopLayout } from './workspace-layout';


export const palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  panel: '#F7F8F9',
  ink: '#202226',
  muted: '#5D626B',
  line: '#E4E7EB',
  accent: '#B52B3E',
  soft: '#F2F4F6',
  onAccent: '#FFFFFF',
  orange: '#92511F',
  orangeSoft: '#FFF3E9',
  danger: '#983D36',
};

const font = Platform.select({
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  default: undefined,
});

export const typeStyles = StyleSheet.create({
  title: { fontFamily: font, fontSize: 24, lineHeight: 33, fontWeight: '600', color: palette.ink },
  section: { fontFamily: font, fontSize: 17, lineHeight: 25, fontWeight: '600', color: palette.ink },
  label: { fontFamily: font, fontSize: 15, lineHeight: 22, fontWeight: '500', color: palette.ink },
  body: { fontFamily: font, fontSize: 15, lineHeight: 23, fontWeight: '400', color: palette.muted },
  caption: { fontFamily: font, fontSize: 13, lineHeight: 19, fontWeight: '400', color: palette.muted },
  amount: { fontFamily: font, fontSize: 14, lineHeight: 21, fontWeight: '400', color: palette.muted, fontVariant: ['tabular-nums'] },
});

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Page({ title, subtitle, headerAction, children, detail = false }: {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  detail?: boolean;
}) {
  const desktop = useDesktopLayout();
  return (
    <SafeAreaView style={styles.safe} edges={detail ? ['bottom', 'left', 'right'] : ['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.desktopScroll]} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={[styles.content, desktop && styles.desktopContent]}>
          <View style={styles.pageHeader}>
            <View style={styles.flex}>
              <Text accessibilityRole="header" style={typeStyles.title}>{title}</Text>
              {!!subtitle && <Body>{subtitle}</Body>}
            </View>
            {headerAction}
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={typeStyles.body}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={typeStyles.section}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Row({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && styles.wrap]}>{children}</View>;
}

export function Badge({ children, warm = false }: { children: ReactNode; warm?: boolean }) {
  return <Text style={[styles.badge, warm && styles.warmBadge]}>{children}</Text>;
}

export function Action({ label, icon, onPress, variant = 'primary', disabled = false, iconOnly = false }: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'quiet' | 'danger';
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  const color = variant === 'primary' ? palette.onAccent : variant === 'danger' ? palette.danger : palette.ink;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action, variant === 'primary' && styles.primary,
        iconOnly && styles.iconAction, (pressed || disabled) && styles.dim,
      ]}>
      {icon && <Ionicons name={icon} color={color} size={17} accessible={false} />}
      {!iconOnly && <Text style={[styles.actionText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && styles.dim]}>
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, multiline, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props} multiline={multiline} accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={palette.muted}
        style={[styles.input, multiline && styles.multiline, style]}
      />
    </View>
  );
}

export function Empty({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={23} color={palette.muted} accessible={false} />
      <Heading>{title}</Heading>
      <Body>{description}</Body>
    </View>
  );
}

export function useTask() {
  const { t } = useLanguage();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(operation: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      const title = t('操作未完成');
      const message = t(error instanceof Error ? error.message : '请重试。');
      if (Platform.OS === 'web') window.alert(title + '\n\n' + message);
      else Alert.alert(title, message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}

export function useConfirmDelete() {
  const { t } = useLanguage();
  return (title: string, message: string, onDelete: () => void, label = t('删除')) => {
    if (Platform.OS === 'web') {
      if (window.confirm(title + '\n\n' + message)) onDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: t('取消'), style: 'cancel' },
      { text: label, style: 'destructive', onPress: onDelete },
    ]);
  };
}

export const ui = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  stack: { gap: 10 },
  spaced: { justifyContent: 'space-between' },
  itemTitle: typeStyles.label,
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30 },
  desktopScroll: { paddingHorizontal: 36, paddingTop: 28 },
  content: { gap: 18, width: '100%', maxWidth: 680, alignSelf: 'center' },
  desktopContent: { maxWidth: 790, alignSelf: 'flex-start' },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  card: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line, paddingVertical: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  badge: { ...typeStyles.caption, color: palette.muted, backgroundColor: palette.soft, fontSize: 12, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', maxWidth: '100%', flexShrink: 1 },
  warmBadge: { color: palette.orange, backgroundColor: palette.orangeSoft },
  action: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 11, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  primary: { backgroundColor: palette.accent },
  iconAction: { width: 44, paddingHorizontal: 0 },
  actionText: { ...typeStyles.label, flexShrink: 1, fontSize: 14, textAlign: 'center' },
  dim: { opacity: 0.6 },
  chip: { borderColor: palette.line, borderWidth: 1, backgroundColor: palette.surface, borderRadius: 6, paddingHorizontal: 11, paddingVertical: 6, minHeight: 42, justifyContent: 'center' },
  selectedChip: { backgroundColor: palette.soft, borderColor: '#BFC5CC' },
  chipText: { ...typeStyles.label, fontSize: 14 },
  selectedChipText: { fontWeight: '600' },
  field: { gap: 6 },
  fieldLabel: { ...typeStyles.label, fontSize: 14 },
  input: { fontFamily: font, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, minHeight: 46, color: palette.ink, fontSize: 16 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  empty: { gap: 6, paddingVertical: 24, borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
});
