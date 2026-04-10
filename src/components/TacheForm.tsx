import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export type TacheEditPayload = {
  id: string
  titre: string
  chantier_id: string
  statut: string | null
  responsable: string | null
  date_echeance: string | null
}

type ChantierOption = { id: string; titre: string }

export type TacheFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingTache?: TacheEditPayload | null
  chantiers: ChantierOption[]
}

export function TacheForm(props: TacheFormProps) {
  const [titre, setTitre] = useState(() => props.editingTache?.titre ?? '')
  const [chantierId, setChantierId] = useState(() => props.editingTache?.chantier_id ?? '')
  const [statut, setStatut] = useState(() => props.editingTache?.statut ?? '')
  const [responsable, setResponsable] = useState(() => props.editingTache?.responsable ?? '')
  const [dateEcheance, setDateEcheance] = useState(() => props.editingTache?.date_echeance ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!props.open) return null

  const isEdit = Boolean(props.editingTache)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const t = titre.trim()
    if (!t) {
      setFormError('Le titre est obligatoire.')
      return
    }
    if (!chantierId.trim()) {
      setFormError('Sélectionne un chantier.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const d = dateEcheance.trim() || null
    const payload = {
      titre: t,
      chantier_id: chantierId.trim(),
      statut: statut.trim() || null,
      responsable: responsable.trim() || null,
      date_echeance: d,
    }

    const { error } = isEdit
      ? await supabase.from('taches').update(payload).eq('id', props.editingTache!.id)
      : await supabase.from('taches').insert(payload)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(error.message || 'Impossible d’enregistrer la tâche.')
      return
    }

    props.onSuccess()
    props.onClose()
  }

  const chantierSelectId = isEdit ? `tache-chantier-${props.editingTache?.id}` : 'tache-chantier-new'

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tache-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 max-h-[min(92vh,640px)] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="tache-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {isEdit ? 'Mets à jour le détail de la tâche.' : 'Planifie une nouvelle tâche.'}
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
            <label htmlFor="tache-titre" className="block text-xs font-semibold text-text-muted">
              Titre
            </label>
            <input
              id="tache-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Appel client, livraison…"
              required
              disabled={submitting}
            />
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
            <label htmlFor="tache-statut" className="block text-xs font-semibold text-text-muted">
              Statut
            </label>
            <input
              id="tache-statut"
              type="text"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="À faire, En cours…"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="tache-responsable" className="block text-xs font-semibold text-text-muted">
              Responsable
            </label>
            <input
              id="tache-responsable"
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Nom"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="tache-echeance" className="block text-xs font-semibold text-text-muted">
              Date échéance
            </label>
            <input
              id="tache-echeance"
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
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

export default TacheForm
