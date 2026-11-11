import { Asset } from 'expo-asset';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Database } from 'sql.js';
import { Page, palette, typeStyles } from '../components/ui';
import { appName } from '../domain/brand';
import { KitchenOpenError } from './kitchen-open-error';
import { KitchenProvider } from './kitchen';
import { useLanguage } from './language';
import { initializeKitchen } from './repository';
import { createSessionDatabase, sessionSnapshot } from './session-sqlite';

import sqliteBinary from 'sql.js/dist/sql-wasm-browser.wasm';

const snapshotKey = 'nutrikitchen.session-db';

function readSnapshot() {
  try {
    const snapshot = sessionStorage.getItem(snapshotKey);
    return snapshot ? Uint8Array.from(atob(snapshot), (character) => character.charCodeAt(0)) : undefined;
  } catch {
    return undefined;
  }
}

function saveSnapshot(connection: Database) {
  try {
    const bytes = sessionSnapshot(connection);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    sessionStorage.setItem(snapshotKey, btoa(binary));
    return true;
  } catch {
    return false;
  }
}

export function KitchenFallback({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  const { t } = useLanguage();
  const [storage, setStorage] = useState<{
    db: ReturnType<typeof createSessionDatabase>;
    save: () => void;
  }>();
  const [sessionSaved, setSessionSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let close: (() => void) | undefined;

    async function openTemporaryDatabase() {
      const { default: initSqlJs } = await import('sql.js/dist/sql-wasm-browser.js');
      const asset = Asset.fromModule(sqliteBinary);
      const sql = await initSqlJs({ locateFile: () => new URL(asset.uri, location.href).href });
      if (disposed) return;
      const connection = new sql.Database(readSnapshot());
      close = () => connection.close();
      const db = createSessionDatabase(connection);
      await initializeKitchen(db);
      if (disposed) return;
      const save = () => setSessionSaved(saveSnapshot(connection));
      save();
      setStorage({ db, save });
    }

    void openTemporaryDatabase().catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; close?.(); };
  }, []);

  if (failed) return <KitchenOpenError onRetry={onRetry} />;
  if (!storage) return <Page title={appName}><ActivityIndicator color={palette.accent} accessibilityLabel={t('正在读取本地数据')} /></Page>;

  return (
    <KitchenProvider db={storage.db} afterWrite={storage.save}>
      <View style={styles.shell}>
        <Text accessibilityRole="alert" style={styles.notice}>
          {sessionSaved
            ? t('临时存储 · 关闭标签页后，本次记录会清除。')
            : t('临时存储 · 刷新或关闭页面后，本次记录会清除。')}
        </Text>
        {children}
      </View>
    </KitchenProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  notice: { ...typeStyles.caption, backgroundColor: palette.orangeSoft, color: palette.orange, paddingVertical: 6, paddingHorizontal: 12, textAlign: 'center' },
});
