import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export type PaiementEditPayload = {
  id: string
  client_id: string
  chantier_id: string
  montant: number
  statut: string | null
  date_paiement: string | null
}

type ClientOption = { id: string; nom: string }
type ChantierOption = { id: string; titre: string }

export type PaiementFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingPaiement?: PaiementEditPayload | null
  clients: ClientOption[]
  chantiers: ChantierOption[]
}

export function PaiementForm(props: PaiementFormProps) {
  const [clientId, setClientId] = useState('')
  const [chantierId, setChantierId] = useState('')
  const [montant, setMontant] = useState('')
  const [statut, setStatut] = useState('')
  const [datePaiement, setDatePaiement] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!props.open) return
    const ed = props.editingPaiement
    if (ed) {
      setClientId(ed.client_id ?? '')
      setChantierId(ed.chantier_id ?? '')
      setMontant(Number.isFinite(ed.montant) ? String(ed.montant) : '')
      setStatut(ed.statut ?? '')
      setDatePaiement(ed.date_paiement ?? '')
    } else {
      setClientId('')
      setChantierId('')
      setMontant('')
      setStatut('')
      setDatePaiement('')
    }
    setFormError(null)
  }, [props.open, props.editingPaiement])

  if (!props.open) return null

  const isEdit = Boolean(props.editingPaiement)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!clientId.trim()) {
      setFormError('Sélectionne un client.')
      return
    }
    if (!chantierId.trim()) {
      setFormError('Sélectionne un chantier.')
      return
    }
    const m = parseFloat(String(montant).replace(',', '.'))
    if (!Number.isFinite(m)) {
      setFormError('Indique un montant valide.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const payload = {
      client_id: clientId.trim(),
      chantier_id: chantierId.trim(),
      montant: m,
      statut: statut.trim() || null,
      date_paiement: datePaiement.trim() || null,
    }

    const { error } = isEdit
      ? await supabase.from('paiements').update(payload).eq('id', props.editingPaiement!.id)
      : await supabase.from('paiements').insert(payload)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(error.message || 'Impossible d’enregistrer le paiement.')
      return
    }

    props.onSuccess()
    props.onClose()
  }

  const clientSelectId = isEdit ? `paiement-client-${props.editingPaiement?.id}` : 'paiement-client-new'
  const chantierSelectId = isEdit ? `paiement-chantier-${props.editingPaiement?.id}` : 'paiement-chantier-new'

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="paiement-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,640px)] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="paiement-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {isEdit ? 'Mets à jour les informations du paiement.' : 'Enregistre un nouveau paiement.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && props.onClose()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-black-contrast/20 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
            aria-label="Fermer"
            disabled={submitting}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor={clientSelectId} className="block text-xs font-semibold text-text-muted">
              Client
            </label>
            <select
              id={clientSelectId}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              required
              disabled={submitting}
            >
              <option value="">— Choisir un client —</option>
              {props.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={chantierSelectId} className="block text-xs font-semibold text-text-muted">
              Chantier
            </label>
            <select
              id={chantierSelectId}
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              required
              disabled={submitting}
            >
              <option value="">— Choisir un chantier —</option>
              {props.chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paiement-montant" className="block text-xs font-semibold text-text-muted">
              Montant (€)
            </label>
            <input
              id="paiement-montant"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="0,00"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="paiement-statut" className="block text-xs font-semibold text-text-muted">
              Statut
            </label>
            <input
              id="paiement-statut"
              type="text"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Payé, En attente…"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="paiement-date" className="block text-xs font-semibold text-text-muted">
              Date paiement
            </label>
            <input
              id="paiement-date"
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              disabled={submitting}
            />
          </div>

          {formError ? (
            <div className="rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-text" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => !submitting && props.onClose()}
              className="h-11 rounded-[10px] border border-border bg-black-contrast/20 px-4 text-sm font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-11 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaiementForm
