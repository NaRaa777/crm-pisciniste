import type { AnalyticsPeriod } from './types'
import { useMemo } from 'react'

type RevenuePoint = { month: string; revenue: number }
type DeliveriesPoint = { month: string; delivered: number; late: number }

function rowDate(row: Record<string, unknown>, key: string): Date | null {
  const raw = String(row[key] ?? '').trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function rowAmount(row: Record<string, unknown>, key: string): number {
  const n = Number(row[key])
  return Number.isFinite(n) ? n : 0
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildLastMonths(count: number): { key: string; label: string }[] {
  const now = new Date()
  const out: { key: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
    out.push({
      key: monthKey(d),
      label: label.charAt(0).toUpperCase() + label.slice(1),
    })
  }
  return out
}

function isLateChantier(raw: unknown): boolean {
  const v = String(raw ?? '').trim().toLowerCase()
  return v.includes('retard') || v === 'en_retard' || v === 'late'
}

function isDoneChantier(raw: unknown): boolean {
  const v = String(raw ?? '').trim().toLowerCase()
  return v.includes('termin') || v === 'done' || v === 'completed'
}

function isAcceptedDevis(raw: unknown): boolean {
  const v = String(raw ?? '').trim().toLowerCase()
  return v === 'accepte' || v === 'accepté' || v === 'signe' || v === 'signé' || v === 'accepted'
}

function startDateFromPeriod(period: AnalyticsPeriod): Date {
  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
  const start = new Date(now)
  start.setDate(now.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return start
}

function PeriodTabs(props: {
  value: AnalyticsPeriod
  onChange: (p: AnalyticsPeriod) => void
}) {
  const items: { key: AnalyticsPeriod; label: string }[] = [
    { key: '7d', label: '7j' },
    { key: '30d', label: '30j' },
    { key: '90d', label: '90j' },
    { key: '1y', label: '1 an' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = props.value === it.key
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => props.onChange(it.key)}
            className={[
              'h-9 rounded-[10px] border px-3 text-xs font-semibold outline-none transition duration-200 ease-out',
              'focus-visible:ring-2 focus-visible:ring-accent/60',
              active
                ? 'border-primary/40 bg-primary/15 text-text'
                : 'border-border bg-black-contrast/20 text-text-muted hover:bg-white/5 hover:text-text',
            ].join(' ')}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function LineChart(props: { data: RevenuePoint[] }) {
  const w = 520
  const h = 170
  const pad = 18
  const max = Math.max(...props.data.map((d) => d.revenue), 1)

  const points = props.data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(props.data.length - 1, 1)
    const y = h - pad - (d.revenue / max) * (h - pad * 2)
    return { x, y, label: d.month, value: d.revenue }
  })

  const d = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-[190px] w-full"
      role="img"
      aria-label="Évolution du chiffre d’affaires sur 6 mois"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,0.08)" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(255,255,255,0.08)" />

      <path
        d={d}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2">
            <title>
              {p.label}: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.value)}
            </title>
          </circle>
          <text x={p.x} y={h - 6} textAnchor="middle" className="fill-text-muted text-[10px]">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function GroupedBars(props: { data: DeliveriesPoint[] }) {
  const w = 520
  const h = 190
  const pad = 22
  const barW = 10
  const gap = 6
  const max = Math.max(
    ...props.data.flatMap((d) => [d.delivered, d.late]),
    1,
  )

  const groupW = barW * 2 + gap
  const totalW = props.data.length * groupW + Math.max(props.data.length - 1, 0) * 10
  const startX = (w - totalW) / 2

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[210px] w-full" role="img" aria-label="Chantiers livrés vs en retard">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,0.08)" />

      {props.data.map((d, i) => {
        const gx = startX + i * (groupW + 10)
        const yBase = h - pad

        const h1 = (d.delivered / max) * (h - pad * 2)
        const h2 = (d.late / max) * (h - pad * 2)

        const x1 = gx
        const x2 = gx + barW + gap

        return (
          <g key={d.month}>
            <rect
              x={x1}
              y={yBase - h1}
              width={barW}
              height={h1}
              rx="3"
              fill="var(--primary)"
            >
              <title>
                {d.month} — Livrés: {d.delivered}
              </title>
            </rect>
            <rect
              x={x2}
              y={yBase - h2}
              width={barW}
              height={h2}
              rx="3"
              fill="var(--danger)"
            >
              <title>
                {d.month} — Retard: {d.late}
              </title>
            </rect>
            <text x={gx + groupW / 2} y={h - 6} textAnchor="middle" className="fill-text-muted text-[10px]">
              {d.month}
            </text>
          </g>
        )
      })}

      <g transform={`translate(${w - pad - 150} ${pad})`} className="text-[10px]">
        <rect x="0" y="0" width="10" height="10" rx="3" fill="var(--primary)" />
        <text x="16" y="9" className="fill-text-muted">
          Livrés
        </text>
        <rect x="78" y="0" width="10" height="10" rx="3" fill="var(--danger)" />
        <text x="94" y="9" className="fill-text-muted">
          Retard
        </text>
      </g>
    </svg>
  )
}

export function AnalyticsPanel(props: {
  period: AnalyticsPeriod
  onPeriodChange: (p: AnalyticsPeriod) => void
  chantiers: Record<string, unknown>[]
  facturation: Record<string, unknown>[]
  devis: Record<string, unknown>[]
  loading?: boolean
}) {
  const loading = props.loading ?? false
  const { revenueByMonth, deliveriesVsLate, conversion } = useMemo(() => {
    const months = buildLastMonths(6)
    const monthMap = new Map(months.map((m) => [m.key, { month: m.label, revenue: 0 }]))

    for (const row of props.facturation) {
      const d = rowDate(row, 'created_at')
      if (!d) continue
      const key = monthKey(d)
      const bucket = monthMap.get(key)
      if (!bucket) continue
      bucket.revenue += rowAmount(row, 'montant_ttc')
    }

    const revenue = months.map((m) => monthMap.get(m.key) ?? { month: m.label, revenue: 0 })

    const chantierMap = new Map(months.map((m) => [m.key, { month: m.label, delivered: 0, late: 0 }]))
    for (const row of props.chantiers) {
      const d = rowDate(row, 'created_at')
      if (!d) continue
      const key = monthKey(d)
      const bucket = chantierMap.get(key)
      if (!bucket) continue
      if (isDoneChantier(row.statut)) bucket.delivered += 1
      if (isLateChantier(row.statut)) bucket.late += 1
    }
    const deliveries = months.map((m) => chantierMap.get(m.key) ?? { month: m.label, delivered: 0, late: 0 })

    const start = startDateFromPeriod(props.period)
    let total = 0
    let accepted = 0
    for (const row of props.devis) {
      const d = rowDate(row, 'created_at')
      if (!d || d < start) continue
      total += 1
      if (isAcceptedDevis(row.statut)) accepted += 1
    }
    const conversionPct = total > 0 ? (accepted / total) * 100 : 0

    return { revenueByMonth: revenue, deliveriesVsLate: deliveries, conversion: conversionPct }
  }, [props.facturation, props.chantiers, props.devis, props.period])

  return (
    <section
      aria-label="Analytics"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-text-muted">
            Tendances CA, livraisons, et conversion prospects (période sélectionnable).
          </p>
        </div>
        <PeriodTabs value={props.period} onChange={props.onPeriodChange} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Évolution CA (6 mois)</div>
              <div className="text-xs text-text-muted">Lissé + grille discrète</div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-[190px] w-full animate-pulse rounded-[12px] bg-white/5" />
              ) : (
                <LineChart data={revenueByMonth} />
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="text-sm font-semibold">Conversion prospects</div>
            <div className="mt-3">
              <div className="text-[34px] font-bold tabular-nums tracking-tight">
                {loading ? (
                  <span className="inline-block h-10 w-40 animate-pulse rounded-md bg-white/10" />
                ) : (
                  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(conversion)}%`
                )}
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Période : <span className="font-semibold text-text">{props.period}</span>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black-contrast/35 ring-1 ring-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${Math.min(conversion, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-12">
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Chantiers livrés vs en retard</div>
              <div className="text-xs text-text-muted">Barres groupées</div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-[210px] w-full animate-pulse rounded-[12px] bg-white/5" />
              ) : (
                <GroupedBars data={deliveriesVsLate} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
