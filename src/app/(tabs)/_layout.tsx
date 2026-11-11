import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { palette, type IconName } from '../../components/ui';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'string' ? color : palette.muted} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.accent,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: '菜谱', tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen name="menu" options={{ title: '菜单', tabBarIcon: tabIcon('restaurant-outline') }} />
      <Tabs.Screen name="fridge" options={{ title: '冰箱', tabBarIcon: tabIcon('cube-outline') }} />
    </Tabs>
  );
}
