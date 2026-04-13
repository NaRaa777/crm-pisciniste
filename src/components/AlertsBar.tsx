import { AlertTriangle, CreditCard } from 'lucide-react'
import { formatEUR } from './format'

export function AlertsBar(props: { lateTasks: number; pendingAmount: number }) {
  return (
    <div className="rounded-[12px] border border-[rgba(196,181,253,0.25)] bg-gradient-to-r from-danger/10 via-surface to-warning/10 p-4 shadow-[var(--shadow-card),0_0_12px_2px_rgba(196,181,253,0.15)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-[12px] bg-black-contrast/25 ring-1 ring-border">
            <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-sm font-semibold">Alertes critiques</div>
            <div className="mt-1 text-sm text-text-muted">
              {props.lateTasks > 0 ? (
                <>
                  <span className="font-semibold text-text">{props.lateTasks}</span> production(s) en retard — prioriser
                  les relances et ré-allocation.
                </>
              ) : (
                <>Aucune production en retard détectée sur la période visible.</>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 md:justify-end">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-[12px] bg-black-contrast/25 ring-1 ring-border">
            <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          <div className="text-left md:text-right">
            <div className="text-sm font-semibold">Montants en attente</div>
            <div className="mt-1 text-sm text-text-muted">
              Montant total :{' '}
              <span className="font-bold tabular-nums text-text">{formatEUR(props.pendingAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
