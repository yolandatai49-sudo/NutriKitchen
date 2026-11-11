import { createContext, useContext } from 'react';

export const KitchenMode = createContext<{ demo: boolean; setDemo: (demo: boolean) => void } | null>(null);

export function useKitchenMode() {
  return useContext(KitchenMode);
}
