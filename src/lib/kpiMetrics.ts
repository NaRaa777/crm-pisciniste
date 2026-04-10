/** Lundi 00:00:00 (locale) de la semaine contenant `d`. */
export function mondayStartOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** [start, end) en temps UNIX */
export function inTimeRange(ts: number, start: Date, endExclusive: Date): boolean {
  return ts >= start.getTime() && ts < endExclusive.getTime()
}

export function parseTimestamp(iso: unknown): number | null {
  if (iso == null || iso === '') return null
  const t = new Date(String(iso)).getTime()
  return Number.isNaN(t) ? null : t
}

export function inCalendarMonth(isoOrDateStr: string, ref: Date): boolean {
  const t = parseTimestamp(isoOrDateStr)
  if (t == null) return false
  const d = new Date(t)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function firstDayOfMonth(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0)
}

export function firstDayOfPreviousMonth(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0)
}

/**
 * Variation en % : (actuel − précédent) / précédent × 100.
 * Si précédent = 0 : 0 si actuel = 0, sinon 100.
 */
export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}
