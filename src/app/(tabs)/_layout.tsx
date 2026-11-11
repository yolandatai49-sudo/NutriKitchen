import { useLanguage } from '../../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useDesktopLayout } from '../../components/workspace-layout';
import { palette, type IconName } from '../../components/ui';

function tabIcon(active: IconName, idle: IconName) {
  return function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : idle} color={typeof color === 'string' ? color : palette.muted} size={size} accessible={false} />;
  };
}

export default function TabLayout() {
  const { t } = useLanguage();
  const desktop = useDesktopLayout();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.ink,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: desktop ? { display: 'none' } : { backgroundColor: palette.surface, borderTopColor: palette.line },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tabs.Screen name="index" options={{ title: t('菜谱'), tabBarAccessibilityLabel: t('菜谱'), tabBarIcon: tabIcon('compass', 'compass-outline') }} />
      <Tabs.Screen name="menu" options={{ title: t('菜单'), tabBarAccessibilityLabel: t('菜单'), tabBarIcon: tabIcon('restaurant', 'restaurant-outline') }} />
      <Tabs.Screen name="fridge" options={{ title: t('冰箱'), tabBarAccessibilityLabel: t('冰箱'), tabBarIcon: tabIcon('cube', 'cube-outline') }} />
      <Tabs.Screen name="shopping" options={{ title: t('购物'), tabBarAccessibilityLabel: t('购物'), tabBarIcon: tabIcon('basket', 'basket-outline') }} />
      <Tabs.Screen name="nutrition" options={{ title: t('营养'), tabBarAccessibilityLabel: t('营养'), tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }} />
    </Tabs>
  );
}
