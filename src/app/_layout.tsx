import { appName } from '../domain/brand';
import { LanguageProvider, useLanguage } from '../data/language';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KitchenSidebar } from '../components/kitchen-sidebar';
import { useDesktopLayout } from '../components/workspace-layout';
import { Action, Empty, Page, palette, ui } from '../components/ui';
import { KitchenProvider } from '../data/kitchen';
import { initializeKitchen } from '../data/repository';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return <LanguageProvider><KitchenLayout /></LanguageProvider>;
}

function KitchenLayout() {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <Page title={appName}>
        <Empty icon="warning-outline" title={t("无法打开厨房")} description={t("本地数据库暂时无法打开。")} />
        <Action label={t("重试")} onPress={() => { setAttempt((value) => value + 1); setFailed(false); }} />
      </Page>
    );
  }

  return (
    <SQLiteProvider key={attempt} databaseName="nutrikitchen.db"
      onInit={initializeKitchen} onError={() => queueMicrotask(() => setFailed(true))}>
      <KitchenProvider>
        <KitchenNavigator />
      </KitchenProvider>
    </SQLiteProvider>
  );
}

function KitchenNavigator() {
  const { t } = useLanguage();
  const desktop = useDesktopLayout();
  return (
    <View style={styles.shell}>
      <StatusBar style="dark" />
      {desktop && <KitchenSidebar />}
      <View style={ui.grow}>
        <Stack screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.ink,
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ shell: { flex: 1, flexDirection: 'row', backgroundColor: palette.background } });
