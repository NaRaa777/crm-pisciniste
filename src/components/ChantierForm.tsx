import { useState, type FormEvent } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export type ChantierEditPayload = {
  id: string
  titre: string
  client_id: string
  statut: string | null
  responsable: string | null
  date_debut: string | null
  date_fin: string | null
}

type ClientOption = { id: string; nom: string }

export type ChantierFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingChantier?: ChantierEditPayload | null
  clients: ClientOption[]
}

export function ChantierForm(props: ChantierFormProps) {
  const { online } = useNetworkStatus()
  const readOnly = !online
  const [titre, setTitre] = useState(() => props.editingChantier?.titre ?? '')
  const [clientId, setClientId] = useState(() => props.editingChantier?.client_id ?? '')
  const [statut, setStatut] = useState(() => props.editingChantier?.statut ?? '')
  const [responsable, setResponsable] = useState(() => props.editingChantier?.responsable ?? '')
  const [dateDebut, setDateDebut] = useState(() => props.editingChantier?.date_debut ?? '')
  const [dateFin, setDateFin] = useState(() => props.editingChantier?.date_fin ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!props.open) return null

  const isEdit = Boolean(props.editingChantier)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (readOnly) return
    const t = titre.trim()
    if (!t) {
      setFormError('Le titre est obligatoire.')
      return
    }
    if (!clientId.trim()) {
      setFormError('Sélectionne un client.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const payload = {
      titre: t,
      client_id: clientId.trim(),
      statut: statut.trim() || null,
      responsable: responsable.trim() || null,
      date_debut: dateDebut.trim() || null,
      date_fin: dateFin.trim() || null,
    }

    const { error } = isEdit
      ? await supabase.from('chantiers').update(payload).eq('id', props.editingChantier!.id)
      : await supabase.from('chantiers').insert(payload)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(error.message || 'Impossible d’enregistrer le chantier.')
      return
    }

    props.onSuccess()
    props.onClose()
  }

  const selectId = isEdit ? `chantier-client-${props.editingChantier?.id}` : 'chantier-client-new'

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="chantier-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,640px)] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="chantier-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le chantier' : 'Nouveau chantier'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {isEdit ? 'Mets à jour les informations du chantier.' : 'Renseigne les informations du chantier.'}
            </p>
            {readOnly ? (
              <p className="mt-2 text-sm text-warning">Reconnectez-vous pour modifier les données.</p>
            ) : null}
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
            <label htmlFor="chantier-titre" className="block text-xs font-semibold text-text-muted">
              Titre
            </label>
            <input
              id="chantier-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Rénovation cuisine"
              required
              disabled={submitting || readOnly}
            />
          </div>
          <div>
            <label htmlFor={selectId} className="block text-xs font-semibold text-text-muted">
              Client
            </label>
            <select
              id={selectId}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              required
              disabled={submitting || readOnly}
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
            <label htmlFor="chantier-statut" className="block text-xs font-semibold text-text-muted">
              Statut
            </label>
            <input
              id="chantier-statut"
              type="text"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="En cours, Terminé…"
              disabled={submitting || readOnly}
            />
          </div>
          <div>
            <label htmlFor="chantier-responsable" className="block text-xs font-semibold text-text-muted">
              Responsable
            </label>
            <input
              id="chantier-responsable"
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Nom du responsable"
              disabled={submitting || readOnly}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="chantier-debut" className="block text-xs font-semibold text-text-muted">
                Date début
              </label>
              <input
                id="chantier-debut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
                disabled={submitting || readOnly}
              />
            </div>
            <div>
              <label htmlFor="chantier-fin" className="block text-xs font-semibold text-text-muted">
                Date fin
              </label>
              <input
                id="chantier-fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
                disabled={submitting || readOnly}
              />
            </div>
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
              disabled={submitting || readOnly}
            >
              {submitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChantierForm
