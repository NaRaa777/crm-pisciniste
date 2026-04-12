import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

export type DevisLignePersist = {
  description: string
  quantite: number
  prix_unitaire_ht: number
  tva_pct: 0 | 10 | 20
  total_ht: number
}

export type DevisEditPayload = {
  id: string
  client_id: string
  numero: string
  entreprise_info: EntrepriseInfo
  lignes: DevisLignePersist[]
  montant_ht: number
  tva: number
  montant_ttc: number
  date_emission: string
  statut: string
  conditions: string | null
  validite_jours: number
}

type LigneDraft = {
  id: string
  description: string
  quantite: string
  prixUnitaireHt: string
  tvaPct: 0 | 10 | 20
}

type DevisFormProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  clients: DevisClientOption[]
  editingDevis?: DevisEditPayload | null
}

const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoyé' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'refuse', label: 'Refusé' },
  { value: 'annule', label: 'Annulé' },
]

const TVA_OPTIONS: { value: 0 | 10 | 20; label: string }[] = [
  { value: 0, label: '0 %' },
  { value: 10, label: '10 %' },
  { value: 20, label: '20 %' },
]

function normalizeStatut(raw: unknown): string {
  const s = String(raw ?? 'brouillon').trim().toLowerCase()
  if (STATUT_OPTIONS.some((o) => o.value === s)) return s
  return 'brouillon'
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

function persistLignes(lines: LigneDraft[]): DevisLignePersist[] {
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

function descriptionSummary(lines: LigneDraft[]): string {
  const parts = lines.map((l) => l.description.trim()).filter(Boolean)
  const s = parts.join(' ; ')
  return s.slice(0, 500)
}

async function fetchNextNumero(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `DEV-${year}-`
  const { data, error } = await supabase.from('devis').select('numero').not('numero', 'is', null)
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

export function devisRowToEditPayload(row: Record<string, unknown>): DevisEditPayload | null {
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
    client_id,
    numero: String(row.numero ?? '').trim() || `DEV-${new Date().getFullYear()}-000`,
    entreprise_info: parseEntreprise(row.entreprise_info),
    lignes: persisted,
    montant_ht: Number.isFinite(ht) ? ht : 0,
    tva: Number.isFinite(tva) ? tva : 20,
    montant_ttc: Number.isFinite(ttc) ? ttc : 0,
    date_emission: String(row.date_emission ?? '').slice(0, 10),
    statut: String(row.statut ?? 'brouillon'),
    conditions: row.conditions != null ? String(row.conditions) : null,
    validite_jours: (() => {
      const v = Number(row.validite_jours)
      return Number.isFinite(v) && v >= 1 ? Math.floor(v) : 30
    })(),
  }
}

function initialLinesFromPayload(ed: DevisEditPayload | null | undefined): LigneDraft[] {
  if (!ed?.lignes?.length) return [newLine()]
  return ed.lignes.map((l) => ({
    id: crypto.randomUUID(),
    description: l.description,
    quantite: String(l.quantite),
    prixUnitaireHt: String(l.prix_unitaire_ht),
    tvaPct: l.tva_pct === 0 || l.tva_pct === 10 || l.tva_pct === 20 ? l.tva_pct : 20,
  }))
}

export function DevisForm(props: DevisFormProps) {
  const isEdit = Boolean(props.editingDevis)
  const [numero, setNumero] = useState(() => props.editingDevis?.numero ?? '')
  const [entreprise, setEntreprise] = useState<EntrepriseInfo>(() =>
    props.editingDevis ? parseEntreprise(props.editingDevis.entreprise_info) : emptyEntreprise(),
  )
  const [clientId, setClientId] = useState(() => props.editingDevis?.client_id ?? '')
  const [lignes, setLignes] = useState<LigneDraft[]>(() => initialLinesFromPayload(props.editingDevis))
  const [delaiPaiement, setDelaiPaiement] = useState(() => {
    if (!props.editingDevis) return ''
    return parseDelaiNotes(props.editingDevis.conditions).delai
  })
  const [validiteJours, setValiditeJours] = useState(() => props.editingDevis?.validite_jours ?? 30)
  const [notesLegales, setNotesLegales] = useState(() => {
    if (!props.editingDevis) return ''
    return parseDelaiNotes(props.editingDevis.conditions).notes
  })
  const [dateEmission, setDateEmission] = useState(
    () => props.editingDevis?.date_emission ?? new Date().toISOString().slice(0, 10),
  )
  const [statut, setStatut] = useState(() => normalizeStatut(props.editingDevis?.statut))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!props.open) return
    if (props.editingDevis) {
      setNumero(props.editingDevis.numero)
      setEntreprise(parseEntreprise(props.editingDevis.entreprise_info))
      setClientId(props.editingDevis.client_id)
      setLignes(initialLinesFromPayload(props.editingDevis))
      setDelaiPaiement(parseDelaiNotes(props.editingDevis.conditions).delai)
      setValiditeJours(props.editingDevis.validite_jours)
      setNotesLegales(parseDelaiNotes(props.editingDevis.conditions).notes)
      setDateEmission(props.editingDevis.date_emission)
      setStatut(normalizeStatut(props.editingDevis.statut))
      return
    }
    setEntreprise(emptyEntreprise())
    setClientId('')
    setLignes([newLine()])
    setDelaiPaiement('')
    setValiditeJours(30)
    setNotesLegales('')
    setDateEmission(new Date().toISOString().slice(0, 10))
    setStatut('brouillon')
    let cancelled = false
    void fetchNextNumero().then((n) => {
      if (!cancelled) setNumero(n)
    })
    return () => {
      cancelled = true
    }
  }, [props.open, props.editingDevis])

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
      setFormError('Numéro de devis indisponible. Réessaie dans un instant.')
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

    const row: Record<string, unknown> = {
      client_id: clientId.trim(),
      chantier_id: null,
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
      validite_jours: Math.max(1, Math.floor(Number(validiteJours)) || 30),
      description: descriptionSummary(validLines) || `Devis ${numero.trim()}`,
      montant_ht: agg.ht,
      tva: tvaEffective,
      montant_ttc: agg.ttc,
      date_emission: dateEmission.trim() || new Date().toISOString().slice(0, 10),
      statut: normalizeStatut(statut),
    }

    const { error } = isEdit
      ? await supabase.from('devis').update(row).eq('id', props.editingDevis!.id)
      : await supabase.from('devis').insert(row)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(
        error.message.includes('relation') || error.message.includes('does not exist')
          ? 'Table « devis » absente ou colonnes manquantes : exécute les migrations SQL Supabase.'
          : error.message.includes('unique') && error.message.includes('numero')
            ? 'Ce numéro de devis existe déjà.'
            : error.message || 'Impossible d’enregistrer le devis.',
      )
      return
    }

    props.onSuccess?.()
    props.onClose()
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="devis-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,calc(100vh-1rem))] w-[min(92vw,880px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="devis-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Numéro :{' '}
              <span className="font-mono font-semibold text-text">{numero || '…'}</span>
            </p>
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
          <section className="rounded-[12px] border border-border bg-black-contrast/10 p-4">
            <h3 className="text-sm font-semibold text-text">Votre entreprise</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="devis-ent-nom" className="block text-xs font-semibold text-text-muted">
                  Nom / raison sociale
                </label>
                <input
                  id="devis-ent-nom"
                  value={entreprise.nom}
                  onChange={(e) => setEntreprise((p) => ({ ...p, nom: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="devis-ent-adr" className="block text-xs font-semibold text-text-muted">
                  Adresse
                </label>
                <textarea
                  id="devis-ent-adr"
                  value={entreprise.adresse}
                  onChange={(e) => setEntreprise((p) => ({ ...p, adresse: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="Rue, CP, ville"
                />
              </div>
              <div>
                <label htmlFor="devis-ent-email" className="block text-xs font-semibold text-text-muted">
                  Email
                </label>
                <input
                  id="devis-ent-email"
                  type="email"
                  autoComplete="email"
                  value={entreprise.email}
                  onChange={(e) => setEntreprise((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="devis-ent-tel" className="block text-xs font-semibold text-text-muted">
                  Téléphone
                </label>
                <input
                  id="devis-ent-tel"
                  type="tel"
                  value={entreprise.telephone}
                  onChange={(e) => setEntreprise((p) => ({ ...p, telephone: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="devis-ent-siret" className="block text-xs font-semibold text-text-muted">
                  SIRET
                </label>
                <input
                  id="devis-ent-siret"
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
            <label htmlFor="devis-client" className="mt-2 block text-xs font-semibold text-text-muted">
              Client
            </label>
            <select
              id="devis-client"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
            >
              <option value="">— Choisir un client —</option>
              {props.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom || 'Sans nom'}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[12px] border border-border bg-black-contrast/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text">Lignes du devis</h3>
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
                <label htmlFor="devis-delai" className="block text-xs font-semibold text-text-muted">
                  Délai de paiement
                </label>
                <input
                  id="devis-delai"
                  value={delaiPaiement}
                  onChange={(e) => setDelaiPaiement(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="ex. 30 jours fin de mois"
                />
              </div>
              <div>
                <label htmlFor="devis-validite" className="block text-xs font-semibold text-text-muted">
                  Validité du devis (jours)
                </label>
                <input
                  id="devis-validite"
                  type="number"
                  min={1}
                  step={1}
                  value={validiteJours}
                  onChange={(e) => setValiditeJours(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="devis-notes" className="block text-xs font-semibold text-text-muted">
                  Notes et mentions légales
                </label>
                <textarea
                  id="devis-notes"
                  value={notesLegales}
                  onChange={(e) => setNotesLegales(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                  placeholder="Pénalités de retard, clause de rétractation…"
                />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <label htmlFor="devis-date" className="block text-xs font-semibold text-text-muted">
                Date d’émission
              </label>
              <input
                id="devis-date"
                type="date"
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                required
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="devis-statut" className="block text-xs font-semibold text-text-muted">
                Statut
              </label>
              <select
                id="devis-statut"
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
              disabled={submitting}
              className="h-11 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Enregistrer le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DevisForm
