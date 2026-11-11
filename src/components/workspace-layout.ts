import { Platform, useWindowDimensions } from 'react-native';

export const sidebarWidth = 216;

export function useDesktopLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 960;
}
