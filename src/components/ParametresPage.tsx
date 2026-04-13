import { useState, type FormEvent } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import { Moon, Sun } from 'lucide-react'
import type { ThemeMode } from './types'

export type ParametresPageProps = {
  initialName: string
  initialEmail: string
  theme: ThemeMode
  onSaveProfile: (data: { name: string; email: string }) => void
  onThemeChange: (theme: ThemeMode) => void
  onSignOut?: () => void | Promise<void>
}

export function ParametresPage(props: ParametresPageProps) {
  const { online } = useNetworkStatus()
  const readOnly = !online
  const [name, setName] = useState(() => props.initialName)
  const [email, setEmail] = useState(() => props.initialEmail)
  const [saved, setSaved] = useState(false)

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!online) return
    props.onSaveProfile({ name: name.trim(), email: email.trim() })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Paramètres</h1>
        <p className="mt-1 text-sm text-text-muted">
          Profil affiché dans l’en-tête et préférences d’affichage.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Profil</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-xs font-semibold text-text-muted">
              Nom affiché
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={readOnly}
              className="mt-1.5 h-11 w-full max-w-md rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none ring-primary/30 placeholder:text-text-muted focus:border-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="block text-xs font-semibold text-text-muted">
              E-mail
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={readOnly}
              className="mt-1.5 h-11 w-full max-w-md rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none ring-primary/30 placeholder:text-text-muted focus:border-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="vous@exemple.com"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Apparence</h2>
          <p className="mt-1 text-xs text-text-muted">Thème de l’interface (appliqué immédiatement).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => props.onThemeChange('light')}
              className={[
                'inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                props.theme === 'light'
                  ? 'border-primary bg-primary/15 text-text'
                  : 'border-border bg-black-contrast/20 text-text-muted hover:text-text',
              ].join(' ')}
            >
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
              Clair
            </button>
            <button
              type="button"
              onClick={() => props.onThemeChange('dark')}
              className={[
                'inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                props.theme === 'dark'
                  ? 'border-primary bg-primary/15 text-text'
                  : 'border-border bg-black-contrast/20 text-text-muted hover:text-text',
              ].join(' ')}
            >
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              Sombre
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={readOnly}
            className="h-11 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(91,33,182,0.25)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enregistrer le profil
          </button>
          {saved ? (
            <span className="text-sm font-medium text-success">Modifications enregistrées.</span>
          ) : null}
        </div>
      </form>

      {props.onSignOut ? (
        <div className="rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Session</h2>
          <p className="mt-1 text-xs text-text-muted">Ferme ta session sur cet appareil.</p>
          <button
            type="button"
            onClick={() => void props.onSignOut?.()}
            className="mt-4 h-11 rounded-[10px] border border-border bg-black-contrast/20 px-5 text-sm font-semibold text-text outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  )
}
