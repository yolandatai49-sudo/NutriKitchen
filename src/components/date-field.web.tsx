import { palette } from './ui';
import { parseDay } from '../domain/dates';

export function DateField({ label, day, onChange, compact = false }: { label: string; day: string; onChange: (day: string) => void; compact?: boolean }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 500, color: palette.ink }}>
      {!compact && label}
      <input aria-label={label} type="date" value={day}
        style={{ background: palette.surface, border: '1px solid ' + palette.line, borderRadius: 6, padding: 8, color: palette.ink }}
        onChange={(event) => {
          const value = event.currentTarget.value;
          try { parseDay(value); } catch { return; }
          onChange(value);
        }} />
    </label>
  );
}
