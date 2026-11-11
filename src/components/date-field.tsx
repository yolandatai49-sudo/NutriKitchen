import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, Text, View } from 'react-native';
import { localDay, parseDay } from '../domain/dates';
import { useLanguage } from '../data/language';
import { palette } from './ui';

export function DateField({ label, day, onChange, compact = false }: { label: string; day: string; onChange: (day: string) => void; compact?: boolean }) {
  const { language } = useLanguage();
  return (
    <View style={styles.field}>
      {!compact && <Text style={styles.label}>{label}</Text>}
      <DateTimePicker accessibilityLabel={label} value={parseDay(day)} mode="date" display="compact"
        themeVariant="light" locale={language === 'en' ? 'en-US' : 'zh-CN'} accentColor={palette.accent}
        onValueChange={(_, date) => onChange(localDay(date))} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8, alignItems: 'flex-start' },
  label: { color: palette.ink, fontSize: 14, fontWeight: '500' },
});
