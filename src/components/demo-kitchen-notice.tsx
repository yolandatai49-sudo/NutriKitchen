import { useLanguage } from '../data/language';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useKitchenMode } from '../data/kitchen-mode';

export function DemoKitchenNotice({ showEntry = false, allowExit = true }: { showEntry?: boolean; allowExit?: boolean }) {
  const { t } = useLanguage();
  const mode = useKitchenMode();
  if (!mode || (!mode.demo && !showEntry)) return null;
  return (
    <View style={[styles.row, mode.demo && styles.demo]}>
      {mode.demo && <Text style={styles.label}>{t("示例厨房 · 临时数据")}</Text>}
      {(!mode.demo || allowExit) && <Pressable accessibilityRole="button" style={styles.button} onPress={() => mode.setDemo(!mode.demo)}>
        <Text style={styles.link}>{mode.demo ? t("退出示例") : t("体验示例厨房")}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  demo: { backgroundColor: '#EFE0D1', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 9 },
  label: { flexShrink: 1, color: '#665B50', fontSize: 13 },
  button: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#9B372B', fontSize: 13, fontWeight: '700' },
});
