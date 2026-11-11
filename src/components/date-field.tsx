import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, Text, View } from 'react-native';
import { localDay, parseDay } from '../domain/dates';
import { palette } from './ui';

export function DateField({ label, day, onChange }: { label: string; day: string; onChange: (day: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <DateTimePicker accessibilityLabel={label} value={parseDay(day)} mode="date" display="compact"
        themeVariant="light" locale="zh-CN" accentColor={palette.accent}
        onValueChange={(_, date) => onChange(localDay(date))} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8, alignItems: 'flex-start' },
  label: { color: palette.ink, fontSize: 14, fontWeight: '700' },
});
