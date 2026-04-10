import { CalendarClock, Hammer, TrendingUp, Wallet } from 'lucide-react'
import { formatDeltaPct, formatEUR } from './format'

type Kpi = {
  id: string
  title: string
  value: number
  deltaPct: number
  format: 'number' | 'currency'
}

function iconFor(id: string) {
  switch (id) {
    case 'prod-week':
      return CalendarClock
    case 'sites-active':
      return Hammer
    case 'payments-pending':
      return Wallet
    case 'mrr-est':
      return TrendingUp
    default:
      return TrendingUp
  }
}

function formatValue(kpi: Kpi) {
  if (kpi.format === 'currency') return formatEUR(kpi.value)
  return new Intl.NumberFormat('fr-FR').format(kpi.value)
}

export function KpiCards(props: { items: Kpi[]; loading?: boolean }) {
  const loading = props.loading ?? false

  return (
    <section aria-label="Indicateurs clés" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {props.items.map((kpi) => {
        const Icon = iconFor(kpi.id)
        const positive = kpi.deltaPct >= 0

        return (
          <div
            key={kpi.id}
            className={[
              'rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition duration-200 ease-out',
              'hover:-translate-y-[1px] hover:border-primary/35 hover:shadow-[var(--shadow-hover)]',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-medium text-text-muted">{kpi.title}</div>
                <div className="mt-2 text-[32px] font-bold tabular-nums tracking-tight">
                  {loading ? (
                    <span className="inline-block h-9 w-40 animate-pulse rounded-md bg-white/10" />
                  ) : (
                    formatValue(kpi)
                  )}
                </div>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-black-contrast/30 ring-1 ring-border">
                <Icon className="h-[22px] w-[22px] text-primary" strokeWidth={1.75} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div
                className={[
                  'text-xs font-semibold tabular-nums',
                  positive ? 'text-success' : 'text-danger',
                ].join(' ')}
              >
                {loading ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded-md bg-white/10" />
                ) : (
                  <>
                    {positive ? '+' : ''}
                    {formatDeltaPct(kpi.deltaPct)} <span className="text-text-muted">vs période</span>
                  </>
                )}
              </div>
              <div className="text-xs text-text-muted">MAJ auto</div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
