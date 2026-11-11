import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Action, Empty, Page, palette } from '../components/ui';
import { KitchenProvider } from '../data/kitchen';
import { initializeDatabase } from '../data/repository';

export default function RootLayout() {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <Page title="今天吃什么">
        <Empty icon="warning-outline" title="无法打开厨房" description="本地数据库暂时无法打开。" />
        <Action label="重试" onPress={() => { setAttempt((value) => value + 1); setFailed(false); }} />
      </Page>
    );
  }

  return (
    <SQLiteProvider key={attempt} databaseName="nutrikitchen.db" onInit={initializeDatabase} onError={() => setFailed(true)}>
      <KitchenProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.accent,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: palette.background },
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipes/[id]" options={{ title: '菜谱详情' }} />
          <Stack.Screen name="recipes/form" options={{ title: '菜谱编辑' }} />
          <Stack.Screen name="meals/form" options={{ title: '选菜' }} />
          <Stack.Screen name="nutrition/form" options={{ title: '营养编辑' }} />
        </Stack>
      </KitchenProvider>
    </SQLiteProvider>
  );
}
