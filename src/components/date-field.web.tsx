import { palette } from './ui';
import { parseDay } from '../domain/dates';

export function DateField({ label, day, onChange }: { label: string; day: string; onChange: (day: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700, color: palette.ink }}>
      {label}
      <input aria-label={label} type="date" value={day}
        style={{ background: palette.surface, border: '1px solid ' + palette.line, borderRadius: 6, padding: 8, color: '#292720' }}
        onChange={(event) => {
          const value = event.currentTarget.value;
          try { parseDay(value); } catch { return; }
          onChange(value);
        }} />
    </label>
  );
}
