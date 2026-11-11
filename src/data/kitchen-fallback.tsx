import type { ReactNode } from 'react';
import { KitchenOpenError } from './kitchen-open-error';

export function KitchenFallback({ onRetry }: { children: ReactNode; onRetry: () => void }) {
  return <KitchenOpenError onRetry={onRetry} />;
}
