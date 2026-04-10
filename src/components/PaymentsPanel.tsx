import { useMemo, useState } from 'react'
import type { PaymentStatus } from './types'
import type { TransactionRow } from './mockData'
import { formatEUR, formatShortISODate } from './format'

function paymentStatusLabel(s: PaymentStatus) {
  switch (s) {
    case 'paid':
      return 'Payé'
    case 'partial':
      return 'Partiel'
    case 'unpaid':
      return 'Impayé'
  }
}

function paymentStatusClasses(s: PaymentStatus) {
  switch (s) {
    case 'paid':
      return 'bg-success/15 text-text ring-success/25'
    case 'partial':
      return 'bg-warning/15 text-text ring-warning/25'
    case 'unpaid':
      return 'bg-danger/15 text-text ring-danger/25'
  }
}

function Donut(props: { paid: number; partial: number; unpaid: number }) {
  const total = props.paid + props.partial + props.unpaid
  const r = 36

  const segs = useMemo(() => {
    const c = 2 * Math.PI * r
    const p1 = (props.paid / total) * c
    const p2 = (props.partial / total) * c
    const p3 = (props.unpaid / total) * c
    return { p1, p2, p3, c }
  }, [props.paid, props.partial, props.unpaid, total, r])

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-40" role="img" aria-label="Répartition des statuts de paiement">
      <g transform="translate(50 50) rotate(-90)">
        <circle r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth="10"
          strokeDasharray={`${segs.p1} ${segs.c - segs.p1}`}
          strokeLinecap="round"
        />
        <circle
          r={r}
          fill="none"
          stroke="var(--warning)"
          strokeWidth="10"
          strokeDasharray={`${segs.p2} ${segs.c - segs.p2}`}
          strokeDashoffset={-segs.p1}
          strokeLinecap="round"
        />
        <circle
          r={r}
          fill="none"
          stroke="var(--danger)"
          strokeWidth="10"
          strokeDasharray={`${segs.p3} ${segs.c - segs.p3}`}
          strokeDashoffset={-(segs.p1 + segs.p2)}
          strokeLinecap="round"
        />
      </g>
      <text
        x="50"
        y="46"
        textAnchor="middle"
        className="fill-text text-[10px] font-semibold"
        transform="rotate(0)"
      >
        Statuts
      </text>
      <text x="50" y="60" textAnchor="middle" className="fill-text-muted text-[9px]">
        Payé / Partiel / Impayé
      </text>
    </svg>
  )
}

export function PaymentsPanel(props: {
  collectedThisMonth: number
  pending: number
  breakdown: Record<PaymentStatus, number>
  transactions: TransactionRow[]
  loading?: boolean
}) {
  const loading = props.loading ?? false
  const [selected, setSelected] = useState<TransactionRow | null>(null)

  return (
    <section
      aria-label="Paiements"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight">Paiements</h2>
        <p className="mt-1 text-sm text-text-muted">Encaissements, en attente et dernières transactions.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[12px] border border-border bg-black-contrast/20 p-4">
            <div className="text-xs font-medium text-text-muted">Encaissé (mois)</div>
            <div className="mt-2 text-[28px] font-bold tabular-nums tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-md bg-white/10" />
              ) : (
                formatEUR(props.collectedThisMonth)
              )}
            </div>
          </div>
          <div className="rounded-[12px] border border-border bg-black-contrast/20 p-4">
            <div className="text-xs font-medium text-text-muted">En attente</div>
            <div className="mt-2 text-[28px] font-bold tabular-nums tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-md bg-white/10" />
              ) : (
                formatEUR(props.pending)
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 rounded-[12px] border border-border bg-black-contrast/15 p-4 sm:flex-row">
          <Donut paid={props.breakdown.paid} partial={props.breakdown.partial} unpaid={props.breakdown.unpaid} />
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                Payé
              </div>
              <div className="font-semibold tabular-nums">{props.breakdown.paid}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Partiel
              </div>
              <div className="font-semibold tabular-nums">{props.breakdown.partial}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="h-2 w-2 rounded-full bg-danger" />
                Impayé
              </div>
              <div className="font-semibold tabular-nums">{props.breakdown.unpaid}%</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-border">
          <div className="border-b border-border bg-black-contrast/25 px-4 py-3 text-xs font-semibold text-text-muted">
            5 dernières transactions
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 text-sm text-text-muted">Chargement des transactions…</div>
            ) : (
              props.transactions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className="flex w-full items-start justify-between gap-4 p-4 text-left outline-none transition duration-200 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.label}</div>
                    <div className="mt-1 text-xs text-text-muted tabular-nums">
                      {formatShortISODate(t.date)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold tabular-nums">{formatEUR(t.amount)}</div>
                    <div className="mt-2 flex justify-end">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                          paymentStatusClasses(t.status),
                        ].join(' ')}
                      >
                        {paymentStatusLabel(t.status)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Détail transaction"
          onMouseDown={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Détail</div>
                <div className="mt-1 text-lg font-bold tracking-tight">{selected.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-10 rounded-[10px] border border-border bg-black-contrast/20 px-3 text-sm font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-text-muted">
              <div>
                <span className="font-semibold text-text">Montant :</span>{' '}
                <span className="tabular-nums">{formatEUR(selected.amount)}</span>
              </div>
              <div>
                <span className="font-semibold text-text">Statut :</span>{' '}
                {paymentStatusLabel(selected.status)}
              </div>
              <div>
                <span className="font-semibold text-text">Date :</span>{' '}
                <span className="tabular-nums">{formatShortISODate(selected.date)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
