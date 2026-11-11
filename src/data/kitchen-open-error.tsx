import { Action, Empty, Page } from '../components/ui';
import { appName } from '../domain/brand';
import { useLanguage } from './language';

export function KitchenOpenError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <Page title={appName}>
      <Empty icon="warning-outline" title={t('无法打开厨房')} description={t('本地数据库暂时无法打开。')} />
      <Action label={t('重试')} onPress={onRetry} />
    </Page>
  );
}
