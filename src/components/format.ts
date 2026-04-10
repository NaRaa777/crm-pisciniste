const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const pct1 = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
})

export function formatEUR(value: number) {
  return eur.format(value)
}

export function formatDeltaPct(value: number) {
  return pct1.format(value / 100)
}

export function formatShortISODate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`)
  return shortDate.format(d)
}

export function hoursUntilDueDate(isoDate: string, now = new Date()) {
  const due = new Date(`${isoDate}T23:59:59`)
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60)
}
