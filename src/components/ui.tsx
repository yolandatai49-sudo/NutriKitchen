import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = {
  background: '#F6F3EB',
  surface: '#FFFEFA',
  ink: '#232D25',
  muted: '#556358',
  line: '#DEDCD0',
  accent: '#315C45',
  soft: '#E4EDDF',
  onAccent: '#FFFFFF',
  orange: '#92511F',
  orangeSoft: '#F7E8D5',
  danger: '#983D36',
};

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Page({ title, subtitle, headerAction, children, detail = false }: {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  detail?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={detail ? ['bottom', 'left', 'right'] : ['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            <View style={styles.pageHeader}>
              <View style={styles.flex}>
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                {!!subtitle && <Body>{subtitle}</Body>}
              </View>
              {headerAction}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={styles.heading}>{children}</Text>;
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

export function Action({ label, icon, onPress, variant = 'primary', disabled = false }: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'quiet' | 'danger';
  disabled?: boolean;
}) {
  const color = variant === 'primary' ? palette.onAccent : variant === 'danger' ? palette.danger : palette.accent;
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action, variant === 'primary' && styles.primary,
        variant === 'quiet' && styles.quiet, (pressed || disabled) && styles.dim,
      ]}>
      {icon && <Ionicons name={icon} color={color} size={17} />}
      <Text style={[styles.actionText, { color }]}>{label}</Text>
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
      <View style={styles.emptyIcon}><Ionicons name={icon} size={24} color={palette.accent} /></View>
      <Heading>{title}</Heading>
      <Body>{description}</Body>
    </View>
  );
}

export function useTask() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(operation: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      Alert.alert('操作未完成', error instanceof Error ? error.message : '请重试。');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}

export function confirmDelete(title: string, message: string, onDelete: () => void) {
  Alert.alert(title, message, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: onDelete },
  ]);
}

export const ui = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  stack: { gap: 10 },
  spaced: { justifyContent: 'space-between' },
  itemTitle: { color: palette.ink, fontSize: 17, fontWeight: '700' },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  content: { gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.7, color: palette.ink, marginBottom: 5 },
  heading: { fontSize: 19, fontWeight: '700', color: palette.ink },
  body: { fontSize: 15, lineHeight: 22, color: palette.muted },
  card: { borderRadius: 19, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 12, backgroundColor: palette.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  badge: { color: palette.accent, backgroundColor: palette.soft, fontSize: 12, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, overflow: 'hidden' },
  warmBadge: { color: palette.orange, backgroundColor: palette.orangeSoft },
  action: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primary: { backgroundColor: palette.accent },
  quiet: { backgroundColor: palette.soft },
  actionText: { flexShrink: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  dim: { opacity: 0.6 },
  chip: { borderColor: palette.line, borderWidth: 1, backgroundColor: palette.surface, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, minHeight: 42, justifyContent: 'center' },
  selectedChip: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { fontSize: 14, fontWeight: '600', color: palette.ink },
  selectedChipText: { color: palette.onAccent },
  field: { gap: 6 },
  fieldLabel: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, minHeight: 46, color: palette.ink, fontSize: 16 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  empty: { gap: 7, padding: 20, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 18 },
  emptyIcon: { backgroundColor: palette.soft, width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
});
