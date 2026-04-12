import { supabase } from './supabase'

export type HeaderNotificationKind = 'chantier_retard' | 'facture_impayee' | 'tache_retard'

export type HeaderNotification = {
  id: string
  kind: HeaderNotificationKind
  typeLabel: string
  detail: string
  dateDisplay: string
  /** Tri décroissant (ISO date) */
  sortKey: string
}

function sliceDate(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const s = String(raw)
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function formatDateFr(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d)
}

function formatMontant(raw: unknown): string {
  const n = Number(raw)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Date du jour au format YYYY-MM-DD (UTC), alignée sur la requête tâches. */
function todayIsoForFilter(): string {
  return new Date().toISOString().split('T')[0]!
}

/**
 * Notifications : filtres côté Supabase (chantiers, facturation, tâches).
 */
export async function fetchHeaderNotifications(): Promise<HeaderNotification[]> {
  const out: HeaderNotification[] = []
  const todayIso = todayIsoForFilter()

  const [chantiersRes, facturationRes, tachesRes] = await Promise.all([
    supabase.from('chantiers').select('id, titre, statut').eq('statut', 'En retard'),
    supabase.from('facturation').select('id, montant_ttc, statut, clients(nom)').neq('statut', 'Payée'),
    supabase
      .from('taches')
      .select('id, titre, date_echeance, statut')
      .lt('date_echeance', todayIso)
      .neq('statut', 'Terminé'),
  ])

  if (chantiersRes.error) console.error(chantiersRes.error)
  if (facturationRes.error) console.error(facturationRes.error)
  if (tachesRes.error) console.error(tachesRes.error)

  const chantiers = chantiersRes.data ?? []
  for (const row of chantiers) {
    const r = row as Record<string, unknown>
    const id = r.id != null ? String(r.id) : ''
    if (!id) continue
    const titre = String(r.titre ?? 'Chantier').trim() || 'Chantier'

    out.push({
      id: `chantier-${id}`,
      kind: 'chantier_retard',
      typeLabel: 'Chantier en retard',
      detail: titre,
      dateDisplay: '—',
      sortKey: '0000-01-01',
    })
  }

  const facturationRows = facturationRes.data ?? []
  for (const row of facturationRows) {
    const r = row as Record<string, unknown>
    const id = r.id != null ? String(r.id) : ''
    if (!id) continue
    const clients = r.clients as { nom?: string } | null | undefined
    const clientNom = clients?.nom?.trim() || 'Client inconnu'
    const montantStr = formatMontant(r.montant_ttc)

    out.push({
      id: `facturation-${id}`,
      kind: 'facture_impayee',
      typeLabel: 'Facture en attente',
      detail: `${clientNom} — ${montantStr}`,
      dateDisplay: '—',
      sortKey: '0000-01-01',
    })
  }

  const taches = tachesRes.data ?? []
  for (const row of taches) {
    const r = row as Record<string, unknown>
    const id = r.id != null ? String(r.id) : ''
    if (!id) continue
    const titre = String(r.titre ?? 'Tâche').trim() || 'Tâche'
    const due = sliceDate(r.date_echeance)

    out.push({
      id: `tache-${id}`,
      kind: 'tache_retard',
      typeLabel: 'Tâche en retard',
      detail: titre,
      dateDisplay: formatDateFr(due),
      sortKey: due || '0000-01-01',
    })
  }

  out.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0))
  return out
}
