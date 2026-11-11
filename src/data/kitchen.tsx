import { appName } from '../domain/brand';
import { useLanguage } from './language';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { Action, Empty, Page, palette } from '../components/ui';
import { kitchenActions, loadKitchen, type KitchenActions, type KitchenData, type KitchenDatabase } from './repository';

type KitchenContextValue = {
  data: KitchenData;
  write: <T>(operation: (actions: KitchenActions) => Promise<T>) => Promise<T>;
};

const KitchenContext = createContext<KitchenContextValue | null>(null);

export function ExpoKitchenProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <KitchenProvider db={db}>{children}</KitchenProvider>;
}

export function KitchenProvider({ children, db, afterWrite }: {
  children: ReactNode;
  db: KitchenDatabase;
  afterWrite?: () => void;
}) {
  const { t } = useLanguage();
  const actions = useMemo(() => kitchenActions(db), [db]);
  const [data, setData] = useState<KitchenData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const tail = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    loadKitchen(db).then(
      (next) => { if (active) setData(next); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [db, attempt]);

  function write<T>(operation: (actions: KitchenActions) => Promise<T>): Promise<T> {
    const task = tail.current.then(async () => {
      const result = await operation(actions);
      afterWrite?.();
      try {
        setData(await loadKitchen(db));
      } catch {
        setData(null);
        setFailed(true);
      }
      return result;
    });
    tail.current = task.catch(() => undefined);
    return task;
  }

  if (!data) {
    return (
      <Page title={appName}>
        {failed ? (
          <>
            <Empty icon="warning-outline" title={t("无法读取本地数据")} description={t("请重试读取数据库。")} />
            <Action label={t("重试")} onPress={() => { setFailed(false); setAttempt((value) => value + 1); }} />
          </>
        ) : <ActivityIndicator color={palette.accent} accessibilityLabel={t("正在读取本地数据")} />}
      </Page>
    );
  }
  return <KitchenContext.Provider value={{ data, write }}>{children}</KitchenContext.Provider>;
}

export function useKitchen() {
  const context = useContext(KitchenContext);
  if (!context) throw new Error('KitchenProvider is required.');
  return context;
}
