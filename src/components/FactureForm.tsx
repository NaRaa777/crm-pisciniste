import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { devisRowToEditPayload } from './DevisForm'

const eurDetailed = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export type DevisClientOption = { id: string; nom: string }

export type EntrepriseInfo = {
  nom: string
  adresse: string
  email: string
  telephone: string
  siret: string
}

export type FactureLignePersist = {
  description: string
  quantite: number
  prix_unitaire_ht: number
  tva_pct: 0 | 10 | 20
  total_ht: number
}

export type FactureEditPayload = {
  id: string
  devis_id: string | null
  client_id: string
  chantier_id: string | null
  numero: string
  entreprise_info: EntrepriseInfo
  lignes: FactureLignePersist[]
  montant_ht: number
  tva: number
  montant_ttc: number
  date_emission: string
  date_echeance: string
  date_paiement: string | null
  statut: string
  conditions: string | null
}

type LigneDraft = {
  id: string
  description: string
  quantite: string
  prixUnitaireHt: string
  tvaPct: 0 | 10 | 20
}

export type FactureChantierOption = { id: string; titre: string; client_id: string }

type FactureFormProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  clients: DevisClientOption[]
  chantiers: FactureChantierOption[]
  editingFacture?: FactureEditPayload | null
}

const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'En attente', label: 'En attente' },
  { value: 'Payée', label: 'Payée' },
  { value: 'En retard', label: 'En retard' },
]

const TVA_OPTIONS: { value: 0 | 10 | 20; label: string }[] = [
  { value: 0, label: '0 %' },
  { value: 10, label: '10 %' },
  { value: 20, label: '20 %' },
]

function normalizeFactureStatut(raw: unknown): string {
  const s = String(raw ?? 'En attente').trim()
  if (STATUT_OPTIONS.some((o) => o.value === s)) return s
  const k = s.toLowerCase()
  if (k === 'en attente') return 'En attente'
  if (k === 'payée' || k === 'payee') return 'Payée'
  if (k === 'en retard') return 'En retard'
  return 'En attente'
}

function emptyEntreprise(): EntrepriseInfo {
  return { nom: '', adresse: '', email: '', telephone: '', siret: '' }
}

function parseEntreprise(raw: unknown): EntrepriseInfo {
  if (!raw || typeof raw !== 'object') return emptyEntreprise()
  const o = raw as Record<string, unknown>
  return {
    nom: typeof o.nom === 'string' ? o.nom : '',
    adresse: typeof o.adresse === 'string' ? o.adresse : '',
    email: typeof o.email === 'string' ? o.email : '',
    telephone: typeof o.telephone === 'string' ? o.telephone : '',
    siret: typeof o.siret === 'string' ? o.siret : '',
  }
}

function newLine(): LigneDraft {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantite: '1',
    prixUnitaireHt: '',
    tvaPct: 20,
  }
}

function parseLignesFromRow(row: Record<string, unknown>): LigneDraft[] {
  const raw = row.lignes
  if (raw != null && Array.isArray(raw) && raw.length > 0) {
    return raw.map((item) => {
      const o = item as Record<string, unknown>
      const q = Number(o.quantite)
      const pu = Number(o.prix_unitaire_ht ?? o.prix_unitaire)
      const tva = Number(o.tva_pct ?? o.tva)
      const tvaPct: 0 | 10 | 20 = tva === 0 || tva === 10 || tva === 20 ? tva : 20
      const th = Number(o.total_ht)
      const desc = String(o.description ?? '')
      const lineHt = Number.isFinite(th)
        ? th
        : Number.isFinite(q) && Number.isFinite(pu)
          ? Math.round(q * pu * 100) / 100
          : 0
      return {
        id: crypto.randomUUID(),
        description: desc,
        quantite: Number.isFinite(q) ? String(q) : '1',
        prixUnitaireHt: Number.isFinite(pu) ? String(pu) : String(lineHt),
        tvaPct,
      }
    })
  }
  const ht = Number(row.montant_ht)
  const tvaRaw = row.tva != null && row.tva !== '' ? row.tva : (row as { tva_pct?: unknown }).tva_pct
  const tva = Number(tvaRaw)
  const tvaPct: 0 | 10 | 20 = tva === 0 || tva === 10 || tva === 20 ? tva : 20
  return [
    {
      id: crypto.randomUUID(),
      description: String(row.description ?? '').trim() || 'Prestation',
      quantite: '1',
      prixUnitaireHt: Number.isFinite(ht) ? String(ht) : '0',
      tvaPct,
    },
  ]
}

function parseDelaiNotes(conditions: string | null): { delai: string; notes: string } {
  const t = String(conditions ?? '').trim()
  if (!t) return { delai: '', notes: '' }
  const firstLineEnd = t.indexOf('\n')
  const first = firstLineEnd === -1 ? t : t.slice(0, firstLineEnd)
  const rest = firstLineEnd === -1 ? '' : t.slice(firstLineEnd + 1).trim()
  const m = first.match(/^Délai de paiement\s*:\s*(.+)$/i)
  if (m) {
    return { delai: m[1].trim(), notes: rest }
  }
  return { delai: '', notes: t }
}

function lineHt(l: LigneDraft): number {
  const q = Number(String(l.quantite).replace(',', '.'))
  const pu = Number(String(l.prixUnitaireHt).replace(',', '.'))
  if (!Number.isFinite(q) || !Number.isFinite(pu) || q < 0 || pu < 0) return 0
  return Math.round(q * pu * 100) / 100
}

function computeAggregate(lines: LigneDraft[]): { ht: number; montantTva: number; ttc: number } {
  let ht = 0
  let montantTva = 0
  for (const ln of lines) {
    const lht = lineHt(ln)
    ht += lht
    montantTva += Math.round(lht * (ln.tvaPct / 100) * 100) / 100
  }
  const ttc = Math.round((ht + montantTva) * 100) / 100
  return { ht, montantTva, ttc }
}

function effectiveTvaPercent(ht: number, ttc: number): number {
  if (!(ht > 0) || !Number.isFinite(ttc)) return 0
  return Math.round(((ttc - ht) / ht) * 10000) / 100
}

function persistLignes(lines: LigneDraft[]): FactureLignePersist[] {
  return lines.map((ln) => {
    const th = lineHt(ln)
    const q = Number(String(ln.quantite).replace(',', '.'))
    const pu = Number(String(ln.prixUnitaireHt).replace(',', '.'))
    return {
      description: ln.description.trim(),
      quantite: Number.isFinite(q) ? q : 0,
      prix_unitaire_ht: Number.isFinite(pu) ? pu : 0,
      tva_pct: ln.tvaPct,
      total_ht: th,
    }
  })
}

function defaultEcheanceIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export async function fetchNextFactureNumero(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`
  const { data, error } = await supabase.from('facturation').select('numero').not('numero', 'is', null)
  if (error || !data) return `${prefix}001`
  let max = 0
  for (const row of data) {
    const n = row.numero
    if (typeof n !== 'string' || !n.startsWith(prefix)) continue
    const suffix = n.slice(prefix.length)
    const num = parseInt(suffix, 10)
    if (Number.isFinite(num)) max = Math.max(max, num)
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function factureRowToEditPayload(row: Record<string, unknown>): FactureEditPayload | null {
  const id = row.id != null ? String(row.id) : ''
  if (!id) return null
  const client_id = String(row.client_id ?? '')
  if (!client_id) return null
  const ht = Number(row.montant_ht)
  const tvaRaw = row.tva != null && row.tva !== '' ? row.tva : (row as { tva_pct?: unknown }).tva_pct
  const tva = Number(tvaRaw)
  const ttc = Number(row.montant_ttc)
  const drafts = parseLignesFromRow(row)
  const persisted = persistLignes(drafts)
  return {
    id,
    devis_id: row.devis_id != null ? String(row.devis_id) : null,
    client_id,
    chantier_id: row.chantier_id != null ? String(row.chantier_id) : null,
    numero: String(row.numero ?? '').trim() || `FAC-${new Date().getFullYear()}-000`,
    entreprise_info: parseEntreprise(row.entreprise_info),
    lignes: persisted,
    montant_ht: Number.isFinite(ht) ? ht : 0,
    tva: Number.isFinite(tva) ? tva : 20,
    montant_ttc: Number.isFinite(ttc) ? ttc : 0,
    date_emission: String(row.date_emission ?? '').slice(0, 10),
    date_echeance: (() => {
      const s = String(row.date_echeance ?? '').slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      return defaultEcheanceIso()
    })(),
    statut: normalizeFactureStatut(row.statut),
    conditions: row.conditions != null ? String(row.conditions) : null,
    date_paiement: (() => {
      const s = String(row.date_paiement ?? '').slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    })(),
  }
}

/** Brouillon de facture à partir d’un devis accepté (préremplissage). */
export function factureDraftFromDevisRow(devisRow: Record<string, unknown>): FactureEditPayload | null {
  const d = devisRowToEditPayload(devisRow)
  if (!d) return null
  const devisId = devisRow.id != null ? String(devisRow.id) : ''
  const chantierId = devisRow.chantier_id != null ? String(devisRow.chantier_id) : null
  const today = new Date().toISOString().slice(0, 10)
  const due = new Date()
  due.setDate(due.getDate() + (d.validite_jours >= 1 ? d.validite_jours : 30))
  return {
    id: '',
    devis_id: devisId,
    client_id: d.client_id,
    chantier_id: chantierId,
    numero: '',
    entreprise_info: d.entreprise_info,
    lignes: d.lignes.map((l) => ({ ...l })),
    montant_ht: d.montant_ht,
    tva: d.tva,
    montant_ttc: d.montant_ttc,
    conditions: d.conditions,
    date_emission: today,
    date_echeance: due.toISOString().slice(0, 10),
    date_paiement: null,
    statut: 'En attente',
  }
}

/**
 * Insère une facture préremplie depuis un devis, numérotation FAC-AAAA-NNN,
 * puis passe le devis en statut `converti`. Annule la facture si la mise à jour du devis échoue.
 */
export async function createFactureFromDevisRow(
  devisRow: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const draft = factureDraftFromDevisRow(devisRow)
  if (!draft) return { ok: false, message: 'Devis invalide ou incomplet.' }
  const devisId = devisRow.id != null ? String(devisRow.id) : ''
  if (!devisId) return { ok: false, message: 'Devis sans identifiant.' }

  const numero = await fetchNextFactureNumero()
  const ei = draft.entreprise_info
  const tvaEffective = effectiveTvaPercent(draft.montant_ht, draft.montant_ttc)

  const row: Record<string, unknown> = {
    type: 'facture',
    client_id: draft.client_id.trim(),
    chantier_id: draft.chantier_id?.trim() || null,
    devis_id: devisId,
    numero,
    entreprise_info: {
      nom: ei.nom.trim(),
      adresse: ei.adresse.trim(),
      email: ei.email.trim(),
      telephone: ei.telephone.trim(),
      siret: ei.siret.trim(),
    },
    lignes: draft.lignes,
    conditions: draft.conditions,
    montant_ht: draft.montant_ht,
    tva: tvaEffective,
    montant_ttc: draft.montant_ttc,
    date_emission: draft.date_emission,
    date_echeance: draft.date_echeance,
    statut: 'En attente',
    date_paiement: null,
  }

  const { data: inserted, error: insErr } = await supabase.from('facturation').insert(row).select('id').maybeSingle()

  if (insErr) {
    console.error(insErr)
    return {
      ok: false,
      message:
        insErr.message.includes('relation') || insErr.message.includes('does not exist')
          ? 'Table « facturation » absente : exécute la migration SQL Supabase.'
          : insErr.message.includes('unique') && insErr.message.includes('numero')
            ? 'Ce numéro de facture existe déjà. Réessaie.'
            : insErr.message || 'Impossible de créer la facture.',
    }
  }

  const newId = inserted?.id != null ? String(inserted.id) : ''

  const { error: upErr } = await supabase.from('devis').update({ statut: 'converti' }).eq('id', devisId)
  if (upErr) {
    console.error(upErr)
    if (newId) await supabase.from('facturation').delete().eq('id', newId)
    return { ok: false, message: upErr.message || 'Impossible de marquer le devis comme converti.' }
  }

  return { ok: true }
}

function initialLinesFromPayload(ed: FactureEditPayload | null | undefined): LigneDraft[] {
  if (!ed?.lignes?.length) return [newLine()]
  return ed.lignes.map((l) => ({
    id: crypto.randomUUID(),
    description: l.description,
    quantite: String(l.quantite),
    prixUnitaireHt: String(l.prix_unitaire_ht),
    tvaPct: l.tva_pct === 0 || l.tva_pct === 10 || l.tva_pct === 20 ? l.tva_pct : 20,
  }))
}

export function FactureForm(props: FactureFormProps) {
  const { online } = useNetworkStatus()
  const readOnly = !online
  const isEdit = Boolean(props.editingFacture?.id)
  const [numero, setNumero] = useState(() => props.editingFacture?.numero ?? '')
  const [devisId, setDevisId] = useState<string | null>(() => props.editingFacture?.devis_id ?? null)
  const [entreprise, setEntreprise] = useState<EntrepriseInfo>(() =>
    props.editingFacture ? parseEntreprise(props.editingFacture.entreprise_info) : emptyEntreprise(),
  )
  const [clientId, setClientId] = useState(() => props.editingFacture?.client_id ?? '')
  const [chantierId, setChantierId] = useState(() => props.editingFacture?.chantier_id ?? '')
  const [lignes, setLignes] = useState<LigneDraft[]>(() => initialLinesFromPayload(props.editingFacture))
  const [delaiPaiement, setDelaiPaiement] = useState(() => {
    if (!props.editingFacture) return ''
    return parseDelaiNotes(props.editingFacture.conditions).delai
  })
  const [notesLegales, setNotesLegales] = useState(() => {
    if (!props.editingFacture) return ''
    return parseDelaiNotes(props.editingFacture.conditions).notes
  })
  const [dateEmission, setDateEmission] = useState(
    () => props.editingFacture?.date_emission ?? new Date().toISOString().slice(0, 10),
  )
  const [dateEcheance, setDateEcheance] = useState(
    () => props.editingFacture?.date_echeance ?? defaultEcheanceIso(),
  )
  const [statut, setStatut] = useState(() => normalizeFactureStatut(props.editingFacture?.statut))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const chantiersFiltres = useMemo(() => {
    if (!clientId) return []
    return props.chantiers.filter((c) => c.client_id === clientId)
  }, [props.chantiers, clientId])

  useEffect(() => {
    if (!props.open) return
    const ed = props.editingFacture
    if (ed) {
      setNumero(ed.numero)
      setDevisId(ed.devis_id)
      setEntreprise(parseEntreprise(ed.entreprise_info))
      setClientId(ed.client_id)
      setChantierId(ed.chantier_id ?? '')
      setLignes(initialLinesFromPayload(ed))
      setDelaiPaiement(parseDelaiNotes(ed.conditions).delai)
      setNotesLegales(parseDelaiNotes(ed.conditions).notes)
      setDateEmission(ed.date_emission)
      setDateEcheance(ed.date_echeance || defaultEcheanceIso())
      setStatut(normalizeFactureStatut(ed.statut))
      return
    }
    setDevisId(null)
    setEntreprise(emptyEntreprise())
    setClientId('')
    setChantierId('')
    setLignes([newLine()])
    setDelaiPaiement('')
    setNotesLegales('')
    setDateEmission(new Date().toISOString().slice(0, 10))
    setDateEcheance(defaultEcheanceIso())
    setStatut('En attente')
    let cancelled = false
    void fetchNextFactureNumero().then((n) => {
      if (!cancelled) setNumero(n)
    })
    return () => {
      cancelled = true
    }
  }, [props.open, props.editingFacture])

  const totals = useMemo(() => computeAggregate(lignes), [lignes])

  const updateLine = useCallback((id: string, patch: Partial<LigneDraft>) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const addLine = useCallback(() => {
    setLignes((prev) => [...prev, newLine()])
  }, [])

  const removeLine = useCallback((id: string) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }, [])

  if (!props.open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (readOnly) return
    if (!entreprise.nom.trim()) {
      setFormError('Indique le nom de ton entreprise.')
      return
    }
    if (!clientId.trim()) {
      setFormError('Sélectionne un client.')
      return
    }
    const validLines = lignes.filter((l) => l.description.trim() && lineHt(l) > 0)
    if (validLines.length === 0) {
      setFormError('Ajoute au moins une ligne avec description et montants valides.')
      return
    }
    if (!numero.trim()) {
      setFormError('Numéro de facture indisponible. Réessaie dans un instant.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const persisted = persistLignes(validLines)
    const agg = computeAggregate(validLines)
    const tvaEffective = effectiveTvaPercent(agg.ht, agg.ttc)
    const conditionsCombined = [
      delaiPaiement.trim() ? `Délai de paiement : ${delaiPaiement.trim()}` : '',
      notesLegales.trim(),
    ]
      .filter(Boolean)
      .join('\n\n')

    const st = normalizeFactureStatut(statut)
    const todayIso = new Date().toISOString().slice(0, 10)
    const row: Record<string, unknown> = {
      type: 'facture',
      client_id: clientId.trim(),
      chantier_id: chantierId.trim() || null,
      devis_id: devisId,
      numero: numero.trim(),
      entreprise_info: {
        nom: entreprise.nom.trim(),
        adresse: entreprise.adresse.trim(),
        email: entreprise.email.trim(),
        telephone: entreprise.telephone.trim(),
        siret: entreprise.siret.trim(),
      },
      lignes: persisted,
      conditions: conditionsCombined || null,
      montant_ht: agg.ht,
      tva: tvaEffective,
      montant_ttc: agg.ttc,
      date_emission: dateEmission.trim() || new Date().toISOString().slice(0, 10),
      date_echeance: dateEcheance.trim() || null,
      statut: st,
      date_paiement:
        st === 'Payée'
          ? props.editingFacture?.date_paiement?.slice(0, 10) || todayIso
          : null,
    }

    const editingId = props.editingFacture?.id
    const { error } = editingId
      ? await supabase.from('facturation').update(row).eq('id', editingId)
      : await supabase.from('facturation').insert(row)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(
        error.message.includes('relation') || error.message.includes('does not exist')
          ? 'Table « facturation » absente : exécute la migration SQL Supabase.'
          : error.message.includes('unique') && error.message.includes('numero')
            ? 'Ce numéro de facture existe déjà.'
            : error.message || 'Impossible d’enregistrer la facture.',
      )
      return
    }

    props.onSuccess?.()
    props.onClose()
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="facture-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,calc(100vh-1rem))] w-[min(92vw,880px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="facture-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Numéro :{' '}
              <span className="font-mono font-semibold text-text">{numero || '…'}</span>
            </p>
            {readOnly ? (
              <p className="mt-2 text-sm text-warning">Reconnectez-vous pour modifier les données.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => !submitting && props.onClose()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-black-contrast/20 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className={readOnly ? 'pointer-events-none select-none' : ''}>
          <section className="rounded-[12px] border border-border bg-black-contrast/10 p-4">
            <h3 className="text-sm font-semibold text-text">Votre entreprise</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="facture-ent-nom" className="block text-xs font-semibold text-text-muted">
                  Nom / raison sociale
                </label>
                <input
                  id="facture-ent-nom"
                  value={entreprise.nom}
                  onChange={(e) => setEntreprise((p) => ({ ...p, nom: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="facture-ent-adr" className="block text-xs font-semibold text-text-muted">
                  Adresse
                </label>
                <textarea
                  id="facture-ent-adr"
                  value={entreprise.adresse}
                  onChange={(e) => setEntreprise((p) => ({ ...p, adresse: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="Rue, CP, ville"
                />
              </div>
              <div>
                <label htmlFor="facture-ent-email" className="block text-xs font-semibold text-text-muted">
                  Email
                </label>
                <input
                  id="facture-ent-email"
                  type="email"
                  autoComplete="email"
                  value={entreprise.email}
                  onChange={(e) => setEntreprise((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="facture-ent-tel" className="block text-xs font-semibold text-text-muted">
                  Téléphone
                </label>
                <input
                  id="facture-ent-tel"
                  type="tel"
                  value={entreprise.telephone}
                  onChange={(e) => setEntreprise((p) => ({ ...p, telephone: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="facture-ent-siret" className="block text-xs font-semibold text-text-muted">
                  SIRET
                </label>
                <input
                  id="facture-ent-siret"
                  value={entreprise.siret}
                  onChange={(e) => setEntreprise((p) => ({ ...p, siret: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="14 chiffres"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-text">Client</h3>
            <label htmlFor="facture-client" className="mt-2 block text-xs font-semibold text-text-muted">
              Client
            </label>
            <select
              id="facture-client"
              required
              value={clientId}
              onChange={(e) => {
                const v = e.target.value
                setClientId(v)
                setChantierId('')
              }}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
            >
              <option value="">— Choisir un client —</option>
              {props.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom || 'Sans nom'}
                </option>
              ))}
            </select>
            <label htmlFor="facture-chantier" className="mt-3 block text-xs font-semibold text-text-muted">
              Chantier (optionnel)
            </label>
            <select
              id="facture-chantier"
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              disabled={!clientId || chantiersFiltres.length === 0}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!clientId
                  ? '— Sélectionne d’abord un client —'
                  : chantiersFiltres.length === 0
                    ? '— Aucun chantier —'
                    : '— Optionnel —'}
              </option>
              {chantiersFiltres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[12px] border border-border bg-black-contrast/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text">Lignes de la facture</h3>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Ajouter une ligne
              </button>
            </div>
            <div className="mt-3 overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-black-contrast/25 text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:text-xs">
                  <tr>
                    <th className="px-2 py-2">Description</th>
                    <th className="w-20 px-2 py-2">Qté</th>
                    <th className="w-24 px-2 py-2">PU HT</th>
                    <th className="w-24 px-2 py-2">TVA</th>
                    <th className="w-28 px-2 py-2 text-right">Total HT</th>
                    <th className="w-10 px-1 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lignes.map((ln) => {
                    const th = lineHt(ln)
                    return (
                      <tr key={ln.id} className="bg-surface">
                        <td className="px-2 py-2 align-top">
                          <input
                            value={ln.description}
                            onChange={(e) => updateLine(ln.id, { description: e.target.value })}
                            className="w-full rounded-[8px] border border-border bg-black-contrast/20 px-2 py-1.5 text-sm outline-none focus:border-primary/40"
                            placeholder="Désignation"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={ln.quantite}
                            onChange={(e) => updateLine(ln.id, { quantite: e.target.value })}
                            className="w-full rounded-[8px] border border-border bg-black-contrast/20 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-primary/40"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={ln.prixUnitaireHt}
                            onChange={(e) => updateLine(ln.id, { prixUnitaireHt: e.target.value })}
                            className="w-full rounded-[8px] border border-border bg-black-contrast/20 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-primary/40"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <select
                            value={ln.tvaPct}
                            onChange={(e) =>
                              updateLine(ln.id, { tvaPct: Number(e.target.value) as 0 | 10 | 20 })
                            }
                            className="w-full rounded-[8px] border border-border bg-black-contrast/20 px-1 py-1.5 text-sm outline-none focus:border-primary/40"
                          >
                            {TVA_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right align-top font-medium tabular-nums text-text">
                          {eurDetailed.format(th)}
                        </td>
                        <td className="px-1 py-2 align-top">
                          <button
                            type="button"
                            onClick={() => removeLine(ln.id)}
                            disabled={lignes.length <= 1}
                            className="rounded-[6px] p-1.5 text-text-muted outline-none hover:bg-danger/15 hover:text-text disabled:opacity-30"
                            aria-label="Supprimer la ligne"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[12px] border border-border bg-black-contrast/10 p-4">
            <h3 className="text-sm font-semibold text-text">Totaux</h3>
            <div className="mt-3 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">Sous-total HT</span>
                <span className="font-semibold tabular-nums">{eurDetailed.format(totals.ht)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">TVA</span>
                <span className="font-semibold tabular-nums">{eurDetailed.format(totals.montantTva)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base">
                <span className="font-semibold">Total TTC</span>
                <span className="font-bold tabular-nums text-primary">{eurDetailed.format(totals.ttc)}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-text">Conditions</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="facture-delai" className="block text-xs font-semibold text-text-muted">
                  Délai de paiement
                </label>
                <input
                  id="facture-delai"
                  value={delaiPaiement}
                  onChange={(e) => setDelaiPaiement(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="ex. 30 jours fin de mois"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="facture-notes" className="block text-xs font-semibold text-text-muted">
                  Notes et mentions légales
                </label>
                <textarea
                  id="facture-notes"
                  value={notesLegales}
                  onChange={(e) => setNotesLegales(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="Pénalités de retard, clause de rétractation…"
                />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <div>
              <label htmlFor="facture-date-emission" className="block text-xs font-semibold text-text-muted">
                Date d’émission
              </label>
              <input
                id="facture-date-emission"
                type="date"
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                required
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="facture-date-echeance" className="block text-xs font-semibold text-text-muted">
                Date d’échéance
              </label>
              <input
                id="facture-date-echeance"
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="facture-statut" className="block text-xs font-semibold text-text-muted">
                Statut
              </label>
              <select
                id="facture-statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>

          {formError ? (
            <p className="rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-text" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => props.onClose()}
              disabled={submitting}
              className="h-11 rounded-[10px] border border-border bg-black-contrast/20 px-4 text-sm font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || readOnly}
              className="h-11 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Enregistrer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FactureForm
