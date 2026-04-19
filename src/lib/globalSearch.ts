import { supabase } from './supabase'

export type GlobalSearchResult = {
  id: string
  label: string
  type: 'Client' | 'Chantier' | 'Facture'
  /** Clé de navigation App */
  navKey: 'prospects' | 'sites' | 'paiements'
}

/** Motif ILIKE : '%' + query (échappée pour LIKE) + '%' */
function ilikePattern(query: string): string {
  const q = query.trim()
  const escaped = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  return `%${escaped}%`
}

function dedupeFacturationRows(
  a: Record<string, unknown>[] | null | undefined,
  b: Record<string, unknown>[] | null | undefined,
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>()
  for (const row of [...(a ?? []), ...(b ?? [])]) {
    const id = row.id != null ? String(row.id) : ''
    if (id && !map.has(id)) map.set(id, row)
  }
  return [...map.values()]
}

export async function runGlobalSearch(raw: string): Promise<GlobalSearchResult[]> {
  const q = raw.trim()
  if (q.length < 1) return []

  const query = q
  const pat = ilikePattern(q)

  const [nomClients, entClients, facturationNum, facturationMontant] = await Promise.all([
    supabase.from('clients').select('id, nom, entreprise').ilike('nom', pat).limit(12),
    supabase.from('clients').select('id, nom, entreprise').ilike('entreprise', pat).limit(12),
    supabase
      .from('facturation')
      .select('id, numero, montant_ttc, clients(nom), chantiers(titre, nom)')
      .ilike('numero', pat)
      .limit(12),
    supabase
      .from('facturation')
      .select('id, numero, montant_ttc, clients(nom), chantiers(titre, nom)')
      .filter('montant_ttc::text', 'ilike', pat)
      .limit(12),
  ])

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id, titre')
    .ilike('titre', '%' + query + '%')
    .limit(5)

  for (const res of [nomClients, entClients, facturationNum, facturationMontant]) {
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

  const facturationRows = dedupeFacturationRows(
    facturationNum.data as Record<string, unknown>[] | null,
    facturationMontant.data as Record<string, unknown>[] | null,
  )

  const out: GlobalSearchResult[] = []

  for (const row of clientMap.values()) {
    const nom = row.nom || 'Sans nom'
    const ent = row.entreprise?.trim()
    out.push({
      id: row.id,
      label: ent ? `${nom} — ${ent}` : nom,
      type: 'Client',
      navKey: 'prospects',
    })
  }

  for (const row of chantiers ?? []) {
    const id = row.id != null ? String(row.id) : ''
    if (!id) continue
    const titre = String(row.titre ?? 'Chantier').trim() || 'Chantier'
    out.push({ id, label: titre, type: 'Chantier', navKey: 'sites' })
  }

  for (const row of facturationRows) {
    const id = row.id != null ? String(row.id) : ''
    if (!id) continue
    const montant = Number(row.montant_ttc)
    const amountLabel = Number.isFinite(montant)
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
      : String(row.montant_ttc)
    const num = String(row.numero ?? '').trim()
    const cl = row.clients as { nom?: string } | null | undefined
    const ch = row.chantiers as { titre?: string; nom?: string } | null | undefined
    const clientNom = cl?.nom?.trim()
    const chantierTitre = ch?.titre ?? ch?.nom
    const extra = [num ? `#${num}` : null, clientNom, chantierTitre].filter(Boolean).join(' · ')
    out.push({
      id,
      label: extra ? `${amountLabel} — ${extra}` : amountLabel,
      type: 'Facture',
      navKey: 'paiements',
    })
  }

  return out.slice(0, 24)
}
