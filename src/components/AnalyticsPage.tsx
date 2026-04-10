import { useMemo } from 'react'
import { formatEUR } from './format'

export type AnalyticsPageProps = {
  clients: Record<string, unknown>[]
  chantiers: Record<string, unknown>[]
  paiements: Record<string, unknown>[]
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

function mapPaymentEncaisse(raw: unknown): 'encaisse' | 'attente' {
  const value = String(raw ?? '')
    .toLowerCase()
    .trim()
  if (value.includes('pay') || value === 'paid' || value.includes('encaiss')) return 'encaisse'
  return 'attente'
}

function paymentDate(p: Record<string, unknown>): string {
  return String(p.date_paiement ?? p.date ?? p.created_at ?? '').slice(0, 10)
}

function monthKey(iso: string): string | null {
  if (!iso || iso.length < 7) return null
  return iso.slice(0, 7)
}

const BAR_MAX_PX = 160

function PaymentsBarChart(props: { data: { key: string; label: string; total: number }[] }) {
  const max = Math.max(...props.data.map((d) => d.total), 1)

  return (
    <div
      className="flex min-h-[220px] items-end gap-1 overflow-x-auto pb-1 sm:gap-2"
      role="img"
      aria-label="Paiements par mois"
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
              className="w-full max-w-[48px] rounded-t-[8px] bg-gradient-to-t from-primary/40 to-primary shadow-[0_0_20px_rgba(45,107,255,0.15)]"
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
    const totalClients = props.clients.length

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
    for (const p of props.paiements) {
      const row = p as Record<string, unknown>
      const m = Number.isFinite(Number(row.montant)) ? Number(row.montant) : 0
      if (mapPaymentEncaisse(row.statut ?? row.status) === 'encaisse') encaisses += m
      else enAttente += m
    }

    const monthTotals = new Map<string, number>()
    for (const p of props.paiements) {
      const row = p as Record<string, unknown>
      const mk = monthKey(paymentDate(row))
      if (!mk) continue
      const m = Number.isFinite(Number(row.montant)) ? Number(row.montant) : 0
      monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + m)
    }

    const now = new Date()
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

    return { totalClients, chantierBuckets, encaisses, enAttente, months }
  }, [props.clients, props.chantiers, props.paiements])

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
        <h1 className="text-[20px] font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">Indicateurs calculés à partir des tables Supabase (clients, chantiers, paiements).</p>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Clients</h2>
        <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-text">{stats.totalClients}</p>
        <p className="mt-1 text-sm text-text-muted">Nombre total de clients</p>
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
        <h2 className="text-sm font-semibold text-text-muted">Paiements</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] border border-success/30 bg-success/10 p-4">
            <div className="text-xs font-semibold text-text-muted">Encaissés</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.encaisses)}</div>
            <div className="mt-1 text-xs text-text-muted">Montants au statut « payé »</div>
          </div>
          <div className="rounded-[12px] border border-warning/30 bg-warning/10 p-4">
            <div className="text-xs font-semibold text-text-muted">En attente</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text">{formatEUR(stats.enAttente)}</div>
            <div className="mt-1 text-xs text-text-muted">Montants non encore payés</div>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-muted">Paiements par mois (12 derniers mois)</h2>
        <div className="mt-4">
          <PaymentsBarChart data={stats.months} />
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
