export function localDay(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDay(raw: string): Date {
  const value = raw.trim();
  if (/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    if (localDay(date) === value) return date;
  }
  throw new Error('请输入有效日期，格式为 YYYY-MM-DD。');
}

export function moveDay(day: string, offset: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + offset);
  return localDay(date);
}
