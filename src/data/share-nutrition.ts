import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareNutrition(filename: string, csv: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('当前设备无法打开系统分享菜单。');
  const file = new File(Paths.cache, filename);
  try {
    file.create({ overwrite: true });
    file.write(csv);
    await Sharing.shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
  } finally {
    if (file.exists) file.delete();
  }
}
