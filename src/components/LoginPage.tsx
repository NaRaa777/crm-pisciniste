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
    <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center bg-transparent px-4 py-10 text-text">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[16px] border border-[rgba(59,130,246,0.22)] bg-[#0e1e35]/72 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl ring-1 ring-white/[0.06]">
        <div
          className="h-1 w-full bg-gradient-to-r from-[#1e40af] via-[#06b6d4] to-[#3b82f6] opacity-90"
          aria-hidden
        />
        <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-3 grid h-11 w-11 place-items-center rounded-[12px] ring-1 ring-sky-500/30 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
            style={{
              background: 'linear-gradient(145deg, #1e40af 0%, #0e7490 50%, #0891b2 100%)',
            }}
            aria-hidden
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"
                fill="white"
                opacity="0.92"
              />
              <path
                d="M12 8C12 8 8 13 8 16a4 4 0 0 0 8 0c0-3-4-8-4-8z"
                fill="rgba(6,182,212,0.45)"
              />
            </svg>
          </div>
          <div className="font-['Syne',sans-serif] text-xl font-bold tracking-tight text-white">Wevio</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
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
    </div>
  )
}
