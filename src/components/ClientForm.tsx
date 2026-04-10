import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export type ClientEditPayload = {
  id: string
  nom: string
  entreprise: string | null
  email: string | null
  telephone: string | null
}

type ClientFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingClient?: ClientEditPayload | null
}

export function ClientForm(props: ClientFormProps) {
  const [nom, setNom] = useState(() => props.editingClient?.nom ?? '')
  const [entreprise, setEntreprise] = useState(() => props.editingClient?.entreprise ?? '')
  const [email, setEmail] = useState(() => props.editingClient?.email ?? '')
  const [telephone, setTelephone] = useState(() => props.editingClient?.telephone ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!props.open) return null

  const isEdit = Boolean(props.editingClient)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const n = nom.trim()
    if (!n) {
      setFormError('Le nom est obligatoire.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const payload = {
      nom: n,
      entreprise: entreprise.trim() || null,
      email: email.trim() || null,
      telephone: telephone.trim() || null,
    }

    const { error } = isEdit
      ? await supabase.from('clients').update(payload).eq('id', props.editingClient!.id)
      : await supabase.from('clients').insert(payload)

    setSubmitting(false)

    if (error) {
      console.error(error)
      setFormError(error.message || 'Impossible d’enregistrer le client.')
      return
    }

    props.onSuccess()
    props.onClose()
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="client-form-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && props.onClose()}
        aria-label="Fermer"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="client-form-title" className="text-lg font-semibold tracking-tight">
              {isEdit ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {isEdit ? 'Mets à jour les informations du contact.' : 'Renseigne les informations du contact.'}
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
            <label htmlFor="client-nom" className="block text-xs font-semibold text-text-muted">
              Nom
            </label>
            <input
              id="client-nom"
              type="text"
              autoComplete="name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="Jean Dupont"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="client-entreprise" className="block text-xs font-semibold text-text-muted">
              Entreprise
            </label>
            <input
              id="client-entreprise"
              type="text"
              autoComplete="organization"
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="SARL Exemple"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="client-email" className="block text-xs font-semibold text-text-muted">
              Email
            </label>
            <input
              id="client-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="contact@exemple.fr"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="client-telephone" className="block text-xs font-semibold text-text-muted">
              Téléphone
            </label>
            <input
              id="client-telephone"
              type="tel"
              autoComplete="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/15 px-3 text-sm text-text outline-none transition placeholder:text-text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-accent/40"
              placeholder="06 12 34 56 78"
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
