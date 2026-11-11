import { parseDay } from '../domain/dates';

export function DateField({ label, day, onChange }: { label: string; day: string; onChange: (day: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700, color: '#292720' }}>
      {label}
      <input aria-label={label} type="date" value={day}
        style={{ background: '#FFFCF5', border: '1px solid #D9CABB', borderRadius: 6, padding: 8, color: '#292720' }}
        onChange={(event) => {
          const value = event.currentTarget.value;
          try { parseDay(value); } catch { return; }
          onChange(value);
        }} />
    </label>
  );
}
