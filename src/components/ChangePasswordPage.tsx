import { useMemo, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export type ChangePasswordPageProps = {
  onSuccess: () => void
}

function passwordRules(password: string) {
  return {
    min8: password.length >= 8,
    hasUpper: /[A-ZÀ-Ü]/.test(password),
    hasDigit: /\d/.test(password),
  }
}

function allRulesOk(rules: ReturnType<typeof passwordRules>) {
  return rules.min8 && rules.hasUpper && rules.hasDigit
}

export function ChangePasswordPage(props: ChangePasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const rules = useMemo(() => passwordRules(password), [password])
  const rulesMet = allRulesOk(rules)
  const match = confirm.length > 0 && password === confirm
  const canSubmit = rulesMet && match && !submitting && !success

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { error: err } = await supabase.auth.updateUser({ password })

    setSubmitting(false)
    if (err) {
      setError(err.message || 'Impossible de mettre à jour le mot de passe.')
      return
    }

    setSuccess(true)
    window.setTimeout(() => {
      props.onSuccess()
    }, 1200)
  }

  return (
    <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center bg-transparent px-4 py-10 text-text">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[16px] border border-[rgba(59,130,246,0.22)] bg-[#0e1e35]/72 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl ring-1 ring-white/[0.06]">
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
            <h1 className="font-['Syne',sans-serif] text-2xl font-bold tracking-tight text-white">
              Bienvenue !
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Pour sécuriser votre compte, veuillez créer votre mot de passe personnel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-text-muted">
                Nouveau mot de passe
              </label>
              <div className="relative mt-1.5">
                <input
                  id="new-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 py-2 pl-3 pr-11 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                  aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-text-muted">
                Confirmer le mot de passe
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 py-2 pl-3 pr-11 text-sm text-text outline-none focus:border-primary/40 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                  aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <ul className="space-y-1.5 rounded-[10px] border border-[rgba(59,130,246,0.12)] bg-black/20 px-3 py-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="tabular-nums" aria-hidden>
                  {rules.min8 ? '✅' : '❌'}
                </span>
                <span>Au moins 8 caractères</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>{rules.hasUpper ? '✅' : '❌'}</span>
                <span>Au moins une majuscule</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>{rules.hasDigit ? '✅' : '❌'}</span>
                <span>Au moins un chiffre</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>
                  {confirm.length === 0 ? '·' : match ? '✅' : '❌'}
                </span>
                <span>Les deux champs identiques</span>
              </li>
            </ul>

            {error ? (
              <p className="rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-[10px] border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" role="status">
                Mot de passe enregistré — redirection…
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-[#2563eb] to-[#0891b2] text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:brightness-100"
            >
              {submitting ? 'Enregistrement…' : 'Définir mon mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
