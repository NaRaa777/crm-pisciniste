import { supabase } from './supabase'

export type GlobalSearchResult = {
  id: string
  label: string
  type: 'Client' | 'Chantier' | 'Paiement'
  /** Clé de navigation App (`clients` | `sites` | `payments`) */
  navKey: 'clients' | 'sites' | 'payments'
}

/** Motif ILIKE : '%' + query (échappée pour LIKE) + '%' */
function ilikePattern(query: string): string {
  const q = query.trim()
  const escaped = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  return `%${escaped}%`
}

export async function runGlobalSearch(raw: string): Promise<GlobalSearchResult[]> {
  const q = raw.trim()
  if (q.length < 1) return []

  const query = q
  const pat = ilikePattern(q)

  const [nomClients, entClients, paiementsRes] = await Promise.all([
    supabase.from('clients').select('id, nom, entreprise').ilike('nom', pat).limit(12),
    supabase.from('clients').select('id, nom, entreprise').ilike('entreprise', pat).limit(12),
    supabase
      .from('paiements')
      .select('id, montant, clients(nom), chantiers(titre, nom)')
      .filter('montant::text', 'ilike', pat)
      .limit(12),
  ])

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id, titre')
    .ilike('titre', '%' + query + '%')
    .limit(5)

  for (const res of [nomClients, entClients, paiementsRes]) {
    if (res.error) console.error(res.error)
  }

  const clientMap = new Map<string, { id: string; nom: string; entreprise: string | null }>()
  for (const row of [...(nomClients.data ?? []), ...(entClients.data ?? [])]) {
    const id = row.id != null ? String(row.id) : ''
    if (!id || clientMap.has(id)) continue
    clientMap.set(id, {
      id,
      nom: String(row.nom ?? '').trim(),
      entreprise: row.entreprise != null ? String(row.entreprise).trim() : '',
    })
  }

  const paiementsRows = (paiementsRes.data ?? []) as {
    id: string
    montant: number
    clients: { nom?: string } | null
    chantiers: { titre?: string; nom?: string } | null
  }[]

  const out: GlobalSearchResult[] = []

  for (const row of clientMap.values()) {
    const nom = row.nom || 'Sans nom'
    const ent = row.entreprise?.trim()
    out.push({
      id: row.id,
      label: ent ? `${nom} — ${ent}` : nom,
      type: 'Client',
      navKey: 'clients',
    })
  }

  for (const row of chantiers ?? []) {
    const id = row.id != null ? String(row.id) : ''
    if (!id) continue
    const titre = String(row.titre ?? 'Chantier').trim() || 'Chantier'
    out.push({ id, label: titre, type: 'Chantier', navKey: 'sites' })
  }

  for (const row of paiementsRows) {
    const id = row.id != null ? String(row.id) : ''
    if (!id) continue
    const montant = Number(row.montant)
    const amountLabel = Number.isFinite(montant)
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
      : String(row.montant)
    const clientNom = row.clients?.nom?.trim()
    const chantierTitre = row.chantiers?.titre ?? row.chantiers?.nom
    const extra = [clientNom, chantierTitre].filter(Boolean).join(' · ')
    out.push({
      id,
      label: extra ? `${amountLabel} — ${extra}` : amountLabel,
      type: 'Paiement',
      navKey: 'payments',
    })
  }

  return out.slice(0, 24)
}
