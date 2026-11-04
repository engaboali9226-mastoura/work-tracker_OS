/** NOOR R165 laboratory-only models. NO real Apple Health or Screen Time connection. */
export type Reflection = Readonly<{
  id: string;
  date: string;
  mood: number;
  energy: number;
  emotions: readonly string[];
  text: string;
  trigger: string;
  helpful: string;
}>;
export type AppMinutes = Readonly<{ name: string; minutes: number; opens: number | null }>;
export type DailySignals = Readonly<{
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  screenMinutes: number | null;
  pickups: number | null;
  apps: readonly AppMinutes[];
  source: 'manual' | 'synthetic';
}>;
const DATE = /^\d{4}-\d{2}-\d{2}$/u;
export function isValidLocalDate(date: string): boolean {
  return DATE.test(date) && !Number.isNaN(Date.parse(date + 'T00:00:00Z'))
    && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
}
export function numberOrNull(value: unknown, maximum: number): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(n) && n >= 0 && n <= maximum ? n : null;
}
export function validateReflection(input: Reflection): string | null {
  if (!isValidLocalDate(input.date)) return 'تاريخ غير صالح';
  if (!Number.isInteger(input.mood) || input.mood < 1 || input.mood > 5) return 'اختَر الحالة المزاجية';
  if (!Number.isInteger(input.energy) || input.energy < 1 || input.energy > 5) return 'اختَر مستوى الطاقة';
  if (input.text.length > 5000 || input.trigger.length > 300 || input.helpful.length > 300) return 'النص أطول من المسموح';
  if (input.emotions.length > 6 || input.emotions.some(e => e.length > 30)) return 'المشاعر المحددة غير صالحة';
  return null;
}
export function dailyMood(reflections: readonly Reflection[]): Map<string, number> {
  const m = new Map<string, number[]>();
  for (const r of reflections) if (validateReflection(r) === null) m.set(r.date, [...(m.get(r.date) ?? []), r.mood]);
  return new Map([...m].map(([date, values]) => [date, values.reduce((a, b) => a + b, 0) / values.length]));
}
export function correlation(
  reflections: readonly Reflection[],
  metrics: readonly DailySignals[],
  field: 'steps' | 'sleepMinutes' | 'screenMinutes',
): Readonly<{ n: number; value: number | null; status: 'insufficient' | 'no-variance' | 'ok' }> {
  const moods = dailyMood(reflections);
  const seen = new Set<string>();
  const pairs: Array<[number, number]> = [];
  for (const row of metrics) {
    if (!isValidLocalDate(row.date) || seen.has(row.date)) continue;
    seen.add(row.date);
    const mood = moods.get(row.date), amount = row[field];
    if (mood === undefined || amount === null || !Number.isFinite(amount) || amount < 0) continue;
    pairs.push([mood, amount]);
  }
  if (pairs.length < 7) return { n: pairs.length, value: null, status: 'insufficient' };
  const avgX = pairs.reduce((a, b) => a + b[0], 0) / pairs.length;
  const avgY = pairs.reduce((a, b) => a + b[1], 0) / pairs.length;
  const covariance = pairs.reduce((a, [x, y]) => a + (x - avgX) * (y - avgY), 0);
  const vx = pairs.reduce((a, [x]) => a + (x - avgX) ** 2, 0);
  const vy = pairs.reduce((a, [, y]) => a + (y - avgY) ** 2, 0);
  if (vx === 0 || vy === 0) return { n: pairs.length, value: null, status: 'no-variance' };
  const result = covariance / Math.sqrt(vx * vy);
  return { n: pairs.length, value: Math.max(-1, Math.min(1, result)), status: 'ok' };
}
export function riyadhDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (kind: string) => parts.find(p => p.type === kind)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return 'غير مسجل';
  return `${Math.floor(minutes / 60)} س ${String(minutes % 60).padStart(2, '0')} د`;
}
