import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const eurDetailed = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export type DevisClientOption = { id: string; nom: string }
export type DevisChantierOption = { id: string; titre: string; client_id: string }

export type DevisEditPayload = {
  id: string
  client_id: string
  chantier_id: string | null
  description: string
  montant_ht: number
  tva: number
  montant_ttc: number
  date_emission: string
  statut: string
}

type DevisFormProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  clients: DevisClientOption[]
  chantiers: DevisChantierOption[]
  editingDevis?: DevisEditPayload | null
}

const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoyé' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'refuse', label: 'Refusé' },
  { value: 'annule', label: 'Annulé' },
]

function calcTtc(ht: number, tvaPct: number): number {
  if (!Number.isFinite(ht) || ht < 0) return 0
  return Math.round(ht * (1 + tvaPct / 100) * 100) / 100
}

function normalizeStatut(raw: unknown): string {
  const s = String(raw ?? 'brouillon').trim().toLowerCase()
  if (STATUT_OPTIONS.some((o) => o.value === s)) return s
  return 'brouillon'
}

type DevisFields = {
  clientId: string
  chantierId: string
  description: string
  montantHt: string
  tvaPct: number
  dateEmission: string
  statut: string
}

function initialDevisFields(props: DevisFormProps): DevisFields {
  const ed = props.editingDevis
  if (!ed) {
    return {
      clientId: '',
      chantierId: '',
      description: '',
      montantHt: '',
      tvaPct: 20,
      dateEmission: new Date().toISOString().slice(0, 10),
      statut: 'brouillon',
    }
  }
  const clientId = ed.client_id
  let chantierId = ed.chantier_id ?? ''
  if (chantierId && !props.chantiers.some((c) => c.id === chantierId && c.client_id === clientId)) {
    chantierId = ''
  }
  const tva = Number(ed.tva)
  return {
    clientId,
    chantierId,
    description: ed.description ?? '',
    montantHt: String(ed.montant_ht ?? ''),
    tvaPct: tva === 0 || tva === 10 || tva === 20 ? tva : 20,
    dateEmission:
      String(ed.date_emission ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    statut: normalizeStatut(ed.statut),
  }
}

export function DevisForm(props: DevisFormProps) {
  const [f, setF] = useState(() => initialDevisFields(props))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = Boolean(props.editingDevis)

  const htNum = useMemo(() => {
    const n = Number(String(f.montantHt).replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }, [f.montantHt])

  const montantTtc = useMemo(() => calcTtc(htNum, f.tvaPct), [htNum, f.tvaPct])

  const chantiersFiltres = useMemo(() => {
    if (!f.clientId) return []
    return props.chantiers.filter((c) => c.client_id === f.clientId)
  }, [props.chantiers, f.clientId])

  if (!props.open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!f.clientId.trim()) {
      setFormError('Sélectionne un client.')
      return
    }
    if (htNum < 0 || !Number.isFinite(htNum)) {
      setFormError('Indique un montant HT valide.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    /** Colonnes table `devis` : client_id, chantier_id, description, montant_ht, tva, montant_ttc, date_emission, statut */
    const row = {
      client_id: f.clientId.trim(),
      chantier_id: f.chantierId.trim() || null,
      description: f.description.trim(),
      montant_ht: htNum,
      tva: f.tvaPct,
      montant_ttc: montantTtc,
      date_emission: f.dateEmission.trim() || new Date().toISOString().slice(0, 10),
      statut: normalizeStatut(f.statut),
    }

    const { error } = isEdit
      ? await supabase.from('devis').update(row).eq('id', props.editingDevis!.id)
      : await supabase.from('devis').insert(row)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(
        error.message.includes('relation') || error.message.includes('does not exist')
          ? 'Table « devis » absente : exécute la migration SQL dans Supabase (voir supabase/migrations).'
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
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,calc(100vh-2rem))] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="devis-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le devis' : 'Devis rapide'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {isEdit ? 'Mets à jour les informations du devis.' : 'Crée un devis et enregistre-le dans la base.'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="devis-client" className="block text-xs font-semibold text-text-muted">
              Client
            </label>
            <select
              id="devis-client"
              required
              value={f.clientId}
              onChange={(e) => {
                const v = e.target.value
                setF((prev) => ({ ...prev, clientId: v, chantierId: '' }))
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
          </div>

          <div>
            <label htmlFor="devis-chantier" className="block text-xs font-semibold text-text-muted">
              Chantier
            </label>
            <select
              id="devis-chantier"
              value={f.chantierId}
              onChange={(e) => setF((prev) => ({ ...prev, chantierId: e.target.value }))}
              disabled={!f.clientId || chantiersFiltres.length === 0}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!f.clientId
                  ? '— Sélectionne d’abord un client —'
                  : chantiersFiltres.length === 0
                    ? '— Aucun chantier pour ce client —'
                    : '— Optionnel —'}
              </option>
              {chantiersFiltres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="devis-desc" className="block text-xs font-semibold text-text-muted">
              Description des travaux
            </label>
            <textarea
              id="devis-desc"
              value={f.description}
              onChange={(e) => setF((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              placeholder="Détaillez la prestation…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="devis-ht" className="block text-xs font-semibold text-text-muted">
                Montant HT (€)
              </label>
              <input
                id="devis-ht"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={f.montantHt}
                onChange={(e) => setF((prev) => ({ ...prev, montantHt: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="devis-tva" className="block text-xs font-semibold text-text-muted">
                TVA
              </label>
              <select
                id="devis-tva"
                value={String(f.tvaPct)}
                onChange={(e) =>
                  setF((prev) => ({ ...prev, tvaPct: Number(e.target.value) }))
                }
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              >
                <option value="0">0 %</option>
                <option value="10">10 %</option>
                <option value="20">20 %</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-text-muted">Montant TTC</span>
            <div className="mt-1.5 flex h-11 items-center rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm font-semibold tabular-nums text-text">
              {eurDetailed.format(montantTtc)}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Calcul : HT × (1 + TVA).</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="devis-date" className="block text-xs font-semibold text-text-muted">
                Date d’émission
              </label>
              <input
                id="devis-date"
                type="date"
                value={f.dateEmission}
                onChange={(e) => setF((prev) => ({ ...prev, dateEmission: e.target.value }))}
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
                value={f.statut}
                onChange={(e) => setF((prev) => ({ ...prev, statut: e.target.value }))}
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
