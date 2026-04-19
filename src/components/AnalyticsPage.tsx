import { useMemo } from 'react'
import { formatEUR } from './format'

export type AnalyticsPageProps = {
  chantiers: Record<string, unknown>[]
  facturation: Record<string, unknown>[]
  devis: Record<string, unknown>[]
  loading: boolean
}

type ChantierStatutKey = 'en_cours' | 'planifie' | 'retard' | 'termine'

function categorizeChantierStatut(raw: unknown): ChantierStatutKey {
  const v = String(raw ?? '').toLowerCase().trim()
  if (v.includes('retard') || v.includes('late')) return 'retard'
  if (
    v.includes('term') ||
    v === 'done' ||
    v.includes('compl') ||
    v.includes('achev') ||
    v.includes('livre')
  )
    return 'termine'
  if (v.includes('planif') || v.includes('prevu') || v.includes('a venir') || v.includes('program')) return 'planifie'
  if (v.includes('cours') || v.includes('progress') || v.includes('active')) return 'en_cours'
  return 'planifie'
}

const CHANTIER_LABELS: Record<ChantierStatutKey, string> = {
  en_cours: 'En cours',
  planifie: 'Planifié',
  retard: 'En retard',
  termine: 'Terminé',
}

function mapFactureEncaisse(raw: unknown): 'encaisse' | 'attente' {
  const value = String(raw ?? '').trim()
  if (value === 'Payée') return 'encaisse'
  return 'attente'
}

function facturationDateForMonth(p: Record<string, unknown>): string {
  const paid = String(p.statut ?? '').trim() === 'Payée'
  return String(paid ? p.date_paiement ?? p.date_emission : p.date_emission ?? p.created_at ?? '').slice(0, 10)
}

function monthKey(iso: string): string | null {
  if (!iso || iso.length < 7) return null
  return iso.slice(0, 7)
}

function normalizeInvoiceStatus(raw: unknown): 'paid' | 'partial' | 'unpaid' {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'payée' || value === 'payee' || value === 'paid') return 'paid'
  if (value === 'partielle' || value === 'partial') return 'partial'
  return 'unpaid'
}

function isAcceptedDevis(raw: unknown): boolean {
  const v = String(raw ?? '').trim().toLowerCase()
  return v === 'accepte' || v === 'accepté' || v === 'signe' || v === 'signé' || v === 'accepted'
}

function monthIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const BAR_MAX_PX = 160

function PaymentsBarChart(props: { data: { key: string; label: string; total: number }[] }) {
  const max = Math.max(...props.data.map((d) => d.total), 1)

  return (
    <div
      className="flex min-h-[220px] items-end gap-1 overflow-x-auto pb-1 sm:gap-2"
      role="img"
      aria-label="Encaissements par mois"
    >
      {props.data.map((d) => {
        const h =
          max > 0 ? Math.max((d.total / max) * BAR_MAX_PX, d.total > 0 ? 6 : 0) : 0
        return (
          <div key={d.key} className="flex min-w-[40px] flex-1 flex-col items-center justify-end gap-2">
            <div className="text-center text-[10px] font-semibold tabular-nums text-text sm:text-xs">
              {d.total > 0 ? formatEUR(d.total) : '—'}
            </div>
            <div
              className="w-full max-w-[48px] rounded-t-[8px] bg-gradient-to-t from-primary/40 to-primary shadow-[0_0_20px_rgba(91,33,182,0.15)]"
              style={{ height: h }}
            />
            <div className="text-center text-[10px] font-medium text-text-muted sm:text-xs">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function AnalyticsPage(props: AnalyticsPageProps) {
  const stats = useMemo(() => {
    const chantierBuckets: Record<ChantierStatutKey, number> = {
      en_cours: 0,
      planifie: 0,
      retard: 0,
      termine: 0,
    }
    for (const c of props.chantiers) {
      const k = categorizeChantierStatut((c as Record<string, unknown>).statut)
      chantierBuckets[k] += 1
    }

    let encaisses = 0
    let enAttente = 0
    let collectedThisMonth = 0
    const now = new Date()
    const currentMonth = monthIso(now)
    const paymentStatusCounts = { paid: 0, partial: 0, unpaid: 0 }
    for (const p of props.facturation) {
      const row = p as Record<string, unknown>
      const m = Number.isFinite(Number(row.montant_ttc)) ? Number(row.montant_ttc) : 0
      const status = normalizeInvoiceStatus(row.statut)
      paymentStatusCounts[status] += 1
      if (status === 'paid') {
        encaisses += m
        const paidDate = String(row.date_paiement ?? row.created_at ?? '').slice(0, 7)
        if (paidDate === currentMonth) collectedThisMonth += m
      } else {
        enAttente += m
      }
    }

    const monthTotals = new Map<string, number>()
    for (const p of props.facturation) {
      const row = p as Record<string, unknown>
      if (mapFactureEncaisse(row.statut) !== 'encaisse') continue
      const mk = monthKey(facturationDateForMonth(row))
      if (!mk) continue
      const m = Number.isFinite(Number(row.montant_ttc)) ? Number(row.montant_ttc) : 0
      monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + m)
    }

    const months: { key: string; label: string; total: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
      months.push({
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        total: monthTotals.get(key) ?? 0,
      })
    }

    const thisMonthCa = months[months.length - 1]?.total ?? 0
    const activeChantiers = props.chantiers.filter((c) => {
      const s = String((c as Record<string, unknown>).statut ?? '').toLowerCase()
      return !(s.includes('termin') || s === 'done' || s === 'completed')
    }).length
    const acceptedDevis = props.devis.filter((d) => isAcceptedDevis((d as Record<string, unknown>).statut)).length
    const conversionRate = props.devis.length > 0 ? (acceptedDevis / props.devis.length) * 100 : 0
    const totalPayments = Math.max(
      paymentStatusCounts.paid + paymentStatusCounts.partial + paymentStatusCounts.unpaid,
      1,
    )
    const paymentStatusBreakdown = {
      paid: Math.round((paymentStatusCounts.paid / totalPayments) * 100),
      partial: Math.round((paymentStatusCounts.partial / totalPayments) * 100),
      unpaid: Math.round((paymentStatusCounts.unpaid / totalPayments) * 100),
    }

    return {
      chantierBuckets,
      encaisses,
      enAttente,
      months,
      kpis: {
        productions: props.chantiers.length,
        activeChantiers,
        pendingPayments: enAttente,
        monthlyRevenue: thisMonthCa,
      },
      paymentSummary: {
        collectedThisMonth,
        pending: enAttente,
      },
      paymentStatusBreakdown,
      conversionRate,
    }
  }, [props.chantiers, props.facturation, props.devis])

  if (props.loading) {
    return (
      <section className="rounded-[12px] border border-border bg-surface p-8 text-center text-text-muted shadow-[var(--shadow-card)]">
        Chargement des statistiques…
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">KPIs</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="text-xs text-text-muted">Productions</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{stats.kpis.productions}</div>
          </div>
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="text-xs text-text-muted">Chantiers actifs</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{stats.kpis.activeChantiers}</div>
          </div>
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="text-xs text-text-muted">Paiements en attente</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.kpis.pendingPayments)}</div>
          </div>
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4">
            <div className="text-xs text-text-muted">CA mensuel</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.kpis.monthlyRevenue)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Chantiers par statut</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(CHANTIER_LABELS) as ChantierStatutKey[]).map((k) => (
            <div
              key={k}
              className="rounded-[12px] border border-border bg-black-contrast/15 p-4"
            >
              <div className="text-xs font-medium text-text-muted">{CHANTIER_LABELS[k]}</div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-text">{stats.chantierBuckets[k]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Facturation</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] border border-success/30 bg-success/10 p-4">
            <div className="text-xs font-semibold text-text-muted">Collecté ce mois</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.paymentSummary.collectedThisMonth)}</div>
            <div className="mt-1 text-xs text-text-muted">Somme des factures au statut « Payée » ce mois</div>
          </div>
          <div className="rounded-[12px] border border-warning/30 bg-warning/10 p-4">
            <div className="text-xs font-semibold text-text-muted">En attente</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.paymentSummary.pending)}</div>
            <div className="mt-1 text-xs text-text-muted">Montants non encore payés</div>
          </div>
          <div className="rounded-[12px] border border-border bg-black-contrast/15 p-4 sm:col-span-2">
            <div className="text-xs font-semibold text-text-muted">Répartition statuts de paiement</div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-[10px] border border-border px-3 py-2">
                <div className="text-text-muted">Payé</div>
                <div className="font-semibold tabular-nums">{stats.paymentStatusBreakdown.paid}%</div>
              </div>
              <div className="rounded-[10px] border border-border px-3 py-2">
                <div className="text-text-muted">Partiel</div>
                <div className="font-semibold tabular-nums">{stats.paymentStatusBreakdown.partial}%</div>
              </div>
              <div className="rounded-[10px] border border-border px-3 py-2">
                <div className="text-text-muted">Impayé</div>
                <div className="font-semibold tabular-nums">{stats.paymentStatusBreakdown.unpaid}%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Conversion devis</h2>
        <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-text">
          {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(stats.conversionRate)}%
        </p>
        <p className="mt-1 text-sm text-text-muted">Devis acceptés / total devis</p>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Encaissements par mois (12 derniers mois)</h2>
        <div className="mt-4">
          <PaymentsBarChart data={stats.months} />
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
