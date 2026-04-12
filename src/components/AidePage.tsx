import { useState, type FormEvent } from 'react'
import { ChevronDown, Mail, Send } from 'lucide-react'

type FaqItem = { q: string; a?: string; steps?: string[] }

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Comment ajouter un client ?',
    a: 'Utilisez le raccourci Ctrl+P, le bouton « Ajouter un client » dans la barre latérale, ou ouvrez la page Clients puis créez une fiche.',
  },
  {
    q: 'Comment créer un devis ?',
    steps: [
      'Cliquer sur « Devis rapide » dans la sidebar.',
      'Sélectionner le client et le chantier.',
      'Remplir la description et le montant HT.',
      'La TVA et le montant TTC sont calculés automatiquement.',
      'Cliquer sur « Enregistrer » pour sauvegarder le devis.',
    ],
  },
  {
    q: 'Où suivre les chantiers et les tâches ?',
    a: 'La page Chantiers liste vos projets ; le Planning regroupe les tâches par échéance et statut. Le tableau de bord résume l’activité de la semaine.',
  },
  {
    q: 'Comment enregistrer un encaissement ?',
    a: 'Ouvrez Facturation, sélectionnez la facture puis « Marquer comme payée », ou éditez la facture pour ajuster le statut et les montants.',
  },
  {
    q: 'Les données sont-elles sauvegardées ?',
    a: 'Les informations sont stockées dans votre projet Supabase lié à cette application. Pensez à sauvegardes et accès sécurisés côté compte cloud.',
  },
]

export function AidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleContact(e: FormEvent) {
    e.preventDefault()
    setSent(true)
    window.setTimeout(() => setSent(false), 4000)
    setSubject('')
    setMessage('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Aide & support</h1>
        <p className="mt-1 text-sm text-text-muted">
          Questions fréquentes et formulaire pour nous écrire (démo locale — aucun envoi réel).
        </p>
      </div>

      <section
        className="rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
        aria-labelledby="faq-heading"
      >
        <h2 id="faq-heading" className="text-lg font-semibold text-text">
          FAQ
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i
            return (
              <li key={item.q} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-start justify-between gap-3 rounded-[10px] px-2 py-3 text-left text-sm font-semibold text-text outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={['h-5 w-5 shrink-0 text-text-muted transition', open ? 'rotate-180' : ''].join(' ')}
                    strokeWidth={1.75}
                  />
                </button>
                {open ? (
                  item.steps?.length ? (
                    <ol className="list-decimal space-y-2 px-2 pb-3 pl-7 text-sm leading-relaxed text-text-muted marker:font-medium marker:text-text">
                      {item.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="px-2 pb-3 text-sm leading-relaxed text-text-muted">{item.a}</p>
                  )
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section
        className="rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
        aria-labelledby="contact-heading"
      >
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <h2 id="contact-heading" className="text-lg font-semibold text-text">
            Nous contacter
          </h2>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Décrivez votre problème ou votre suggestion. En production, ce formulaire serait relié à un service
          d’e-mail ou un ticket.
        </p>

        <form onSubmit={handleContact} className="mt-6 space-y-4">
          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-text-muted">
              Votre e-mail
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full max-w-md rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-xs font-semibold text-text-muted">
              Sujet
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1.5 h-11 w-full max-w-lg rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              placeholder="Ex. Export des données"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold text-text-muted">
              Message
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="mt-1.5 w-full max-w-lg rounded-[10px] border border-border bg-black-contrast/25 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              placeholder="Votre message…"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Envoyer
          </button>
          {sent ? (
            <p className="text-sm font-medium text-success" role="status">
              Message enregistré (démo — aucun envoi réel).
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
