import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { fetchHeaderNotifications, type HeaderNotification } from '../lib/headerNotifications'
import { getPageHeader } from '../lib/pageHeaderMeta'
import { initialsFromEmail } from '../lib/userPrefs'
import { supabase } from '../lib/supabase'
import type { ThemeMode } from './types'

export function TopHeader(props: {
  navKey: string
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMobileNav?: () => void
}) {
  const [userEmail, setUserEmail] = useState<string>('')
  const [userInitials, setUserInitials] = useState<string>('—')

  const notifWrapRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { title, subtitle } = getPageHeader(props.navKey)

  const loadNotifications = useCallback(() => {
    setNotifLoading(true)
    void fetchHeaderNotifications().then((rows) => {
      setNotifications(rows)
      setNotifLoading(false)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function syncUser() {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      const email = data.user?.email?.trim() ?? ''
      setUserEmail(email)
      setUserInitials(initialsFromEmail(email))
    }
    void syncUser()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void syncUser()
      loadNotifications()
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [loadNotifications])

  useEffect(() => {
    queueMicrotask(() => loadNotifications())
    const t = window.setInterval(() => queueMicrotask(() => loadNotifications()), 120_000)
    return () => window.clearInterval(t)
  }, [loadNotifications])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const t = e.target as Node
      if (!notifWrapRef.current?.contains(t)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNotifOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 overflow-visible border-b border-[rgba(59,130,246,0.15)] bg-transparent backdrop-blur-md">
      <div className="mx-auto flex h-[81px] w-full max-w-[1440px] items-center gap-4 overflow-visible px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={props.onOpenMobileNav}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(59,130,246,0.15)] bg-black-contrast/20 text-text outline-none transition duration-200 ease-out hover:bg-black/25 focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-2">
          <h1 className="font-['Syne',sans-serif] text-lg font-bold leading-tight tracking-tight text-white md:text-xl">
            {title}
          </h1>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-400 md:text-sm">{subtitle}</p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 overflow-visible sm:gap-3">
          <button
            type="button"
            onClick={props.onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(59,130,246,0.15)] bg-black-contrast/20 text-text outline-none transition duration-200 ease-out hover:bg-black/25 focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label={
              props.theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
            title={
              props.theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
          >
            {props.theme === 'dark' ? (
              <Sun className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <div ref={notifWrapRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o)
                loadNotifications()
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(59,130,246,0.15)] bg-black-contrast/20 text-text outline-none transition duration-200 ease-out hover:bg-black/25 focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="Notifications"
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
              {notifications.length > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--color-surface)]">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <div
                className="overflow-hidden rounded-[12px] border border-[rgba(59,130,246,0.15)] bg-[#0e1e35] shadow-[var(--shadow-hover)]"
                style={{
                  position: 'fixed',
                  top: '88px',
                  right: '8px',
                  left: 'auto',
                  width: 'min(320px, calc(100vw - 16px))',
                  zIndex: 9999,
                }}
                role="dialog"
                aria-label="Alertes"
              >
                <div className="border-b border-[rgba(59,130,246,0.15)] px-3 py-2.5">
                  <div className="text-sm font-semibold text-text">Notifications</div>
                  <div className="text-xs text-text-muted">Chantiers, facturation et tâches à traiter</div>
                </div>
                <div className="max-h-[min(60vh,320px)] overflow-auto">
                  {notifLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-text-muted">Chargement…</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-text-muted">Aucune alerte</div>
                  ) : (
                    <ul className="py-1">
                      {notifications.map((n) => (
                        <li key={n.id} className="border-b border-[rgba(59,130,246,0.1)] last:border-b-0">
                          <div className="px-3 py-2.5">
                            <div className="text-xs font-semibold uppercase tracking-wide text-danger">
                              {n.typeLabel}
                            </div>
                            <div className="mt-0.5 text-sm font-medium leading-snug text-text">{n.detail}</div>
                            <div className="mt-1 text-xs text-text-muted">{n.dateDisplay}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden sm:flex">
            <div
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/35 to-accent/25 text-sm font-semibold text-text ring-1 ring-[rgba(59,130,246,0.15)] transition duration-200 ease-out hover:shadow-[0_0_0_6px_rgba(91,33,182,0.18)]"
              aria-hidden="true"
            >
              {userInitials}
            </div>
          </div>

          <div className="sm:hidden">
            <div
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/35 to-accent/25 text-sm font-semibold text-text ring-1 ring-[rgba(59,130,246,0.15)]"
              aria-label={userEmail || 'Compte'}
              title={userEmail || undefined}
            >
              {userInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
