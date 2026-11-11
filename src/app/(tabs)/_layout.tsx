import { useLanguage } from '../../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { palette, type IconName } from '../../components/ui';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'string' ? color : palette.muted} size={size} accessible={false} />;
  };
}

export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.accent,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: t("菜谱"), tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen name="menu" options={{ title: t("菜单"), tabBarIcon: tabIcon('restaurant-outline') }} />
      <Tabs.Screen name="fridge" options={{ title: t("冰箱"), tabBarIcon: tabIcon('cube-outline') }} />
      <Tabs.Screen name="shopping" options={{ title: t("购物"), tabBarIcon: tabIcon('basket-outline') }} />
      <Tabs.Screen name="nutrition" options={{ title: t("营养"), tabBarIcon: tabIcon('nutrition-outline') }} />
    </Tabs>
  );
}
