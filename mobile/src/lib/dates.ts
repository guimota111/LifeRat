// Datas locais no formato YYYY-MM-DD, sempre calculadas no fuso do usuário.

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function localDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function today(timeZone: string): string {
  return localDate(new Date(), timeZone);
}

function toUtc(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function addDays(d: string, n: number): string {
  const dt = toUtc(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado */
export function weekday(d: string): number {
  return toUtc(d).getUTCDay();
}

/** Semana começa na segunda. */
export function startOfWeek(d: string): string {
  return addDays(d, -((weekday(d) + 6) % 7));
}

export function startOfMonth(d: string): string {
  return `${d.slice(0, 8)}01`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

export function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(toUtc(d).getTime());
}

export function formatDate(d: string, locale: string): string {
  return toUtc(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
