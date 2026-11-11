import { appName } from '../domain/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../data/language';
import { palette, typeStyles, type IconName } from './ui';
import { sidebarWidth } from './workspace-layout';

const destinations = [
  { href: '/', label: '菜谱', icon: 'book-outline', matches: /^\/(?:$|recipes(?:\/|$))/ },
  { href: '/menu', label: '菜单', icon: 'restaurant-outline', matches: /^\/(?:menu|meals)(?:\/|$)/ },
  { href: '/fridge', label: '冰箱', icon: 'cube-outline', matches: /^\/fridge(?:\/|$)/ },
  { href: '/shopping', label: '购物', icon: 'basket-outline', matches: /^\/shopping(?:\/|$)/ },
  { href: '/nutrition', label: '营养', icon: 'stats-chart-outline', matches: /^\/nutrition(?:\/|$)/ },
] as const satisfies readonly { href: string; label: string; icon: IconName; matches: RegExp }[];

export function KitchenSidebar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  return (
    <View style={styles.sidebar}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={appName} style={styles.brand}>
          <Ionicons name="restaurant-outline" size={20} color={palette.accent} accessible={false} />
          <Text style={styles.brandText}>{appName}</Text>
        </Pressable>
      </Link>
      <View accessibilityRole="navigation" accessibilityLabel={t('厨房导航')} style={styles.navigation}>
        {destinations.map(({ href, icon, label, matches }) => {
          const active = matches.test(pathname);
          return (
            <Link key={href} href={href} asChild style={[styles.link, active && styles.current]}>
              <Pressable accessibilityRole="link" accessibilityLabel={t(label)} accessibilityState={{ selected: active }}>
                <Ionicons name={icon} size={19} color={active ? palette.ink : palette.muted} accessible={false} />
                <Text style={[styles.label, active && styles.currentLabel]}>{t(label)}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
      {setLanguage && (
        <View accessibilityLabel={t('语言')} style={styles.footer}>
          <Ionicons name="globe-outline" size={17} color={palette.muted} accessible={false} />
          {([{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }] as const).map(({ value, label }) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: language === value }}
              onPress={() => setLanguage(value)} style={styles.language}>
              <Text style={[typeStyles.caption, language === value && styles.currentLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: sidebarWidth, paddingHorizontal: 16, backgroundColor: palette.panel, borderRightWidth: 1, borderColor: palette.line },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, minHeight: 65, gap: 9 },
  brandText: { ...typeStyles.label, color: palette.ink, fontSize: 17, fontWeight: '600' },
  navigation: { flex: 1, gap: 3, paddingTop: 10 },
  link: { flexDirection: 'row', alignItems: 'center', minHeight: 42, gap: 11, paddingHorizontal: 11, borderRadius: 6 },
  current: { backgroundColor: '#E8EBEE' },
  label: { ...typeStyles.body, color: palette.muted },
  currentLabel: { color: palette.ink, fontWeight: '600' },
  footer: { borderTopWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 12, paddingHorizontal: 10 },
  language: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 7 },
});
