import { LanguageProvider, useLanguage } from '../data/language';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Action, Empty, Page, palette } from '../components/ui';
import { KitchenProvider } from '../data/kitchen';
import { initializeDemoKitchen } from '../data/demo-kitchen';
import { KitchenMode } from '../data/kitchen-mode';
import { initializeDatabase } from '../data/repository';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return <LanguageProvider><KitchenLayout /></LanguageProvider>;
}

function KitchenLayout() {
  const { t } = useLanguage();
  const [demo, setDemo] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <Page title={t("今天吃什么")}>
        <Empty icon="warning-outline" title={t("无法打开厨房")} description={t("本地数据库暂时无法打开。")} />
        {demo && <Action label={t("退出示例")} variant="quiet" onPress={() => { setDemo(false); setFailed(false); }} />}
        <Action label={t("重试")} onPress={() => { setAttempt((value) => value + 1); setFailed(false); }} />
      </Page>
    );
  }

  return (
    <KitchenMode.Provider value={{ demo, setDemo }}>
      <SQLiteProvider key={`${demo}-${attempt}`} databaseName={demo ? ':memory:' : 'nutrikitchen.db'}
        options={demo ? { useNewConnection: true } : undefined}
        onInit={demo ? initializeDemoKitchen : initializeDatabase} onError={() => queueMicrotask(() => setFailed(true))}>
        <KitchenProvider>
          <KitchenNavigator />
        </KitchenProvider>
      </SQLiteProvider>
    </KitchenMode.Provider>
  );
}

function KitchenNavigator() {
  const { t } = useLanguage();
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.accent,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: palette.background },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipes/[id]" options={{ title: t('菜谱详情') }} />
        <Stack.Screen name="recipes/collection/[key]" options={{ title: t('家常菜谱') }} />
        <Stack.Screen name="recipes/form" options={{ title: t('菜谱编辑') }} />
        <Stack.Screen name="meals/form" options={{ title: t('选菜') }} />
        <Stack.Screen name="nutrition/form" options={{ title: t('营养编辑') }} />
      </Stack>
    </>
  );
}
