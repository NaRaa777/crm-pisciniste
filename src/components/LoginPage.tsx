import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const em = email.trim()
    if (!em || !password) {
      setError('Renseigne l’e-mail et le mot de passe.')
      return
    }
    setSubmitting(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: em, password })
      setSubmitting(false)
      if (err) {
        setError(err.message || 'Connexion impossible.')
        return
      }
      return
    }

    const { error: err } = await supabase.auth.signUp({ email: em, password })
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Impossible de créer le compte.')
      return
    }
    setMessage(
      'Compte créé. Si la confirmation par e-mail est activée, vérifie ta boîte de réception.',
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10 text-text">
      <div className="w-full max-w-[400px] rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-hover)]">
        <div className="text-center">
          <div className="text-lg font-semibold tracking-tight">CRM Perso</div>
          <p className="mt-1 text-sm text-text-muted">
            {mode === 'login' ? 'Connecte-toi pour continuer.' : 'Crée un compte pour accéder au CRM.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-text-muted">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-text-muted">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-3 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
            />
          </div>

          {error ? (
            <p className="rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-[10px] border border-primary/35 bg-primary/10 px-3 py-2 text-sm text-text" role="status">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="login-submit-btn"
          >
            {submitting ? 'Patientez…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setMessage(null)
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
