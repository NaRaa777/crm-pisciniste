import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { fetchHeaderNotifications, type HeaderNotification } from '../lib/headerNotifications'
import { runGlobalSearch, type GlobalSearchResult } from '../lib/globalSearch'
import { initialsFromEmail } from '../lib/userPrefs'
import { supabase } from '../lib/supabase'
import type { ThemeMode } from './types'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export function TopHeader(props: {
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenMobileNav?: () => void
  onSearchNavigate?: (navKey: 'clients' | 'sites' | 'payments') => void
}) {
  const [userEmail, setUserEmail] = useState<string>('')
  const [userInitials, setUserInitials] = useState<string>('—')

  const searchId = useId()
  const listboxId = `${searchId}-listbox`
  const wrapRef = useRef<HTMLDivElement>(null)
  const notifWrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 280)
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 1) {
      queueMicrotask(() => {
        setResults([])
        setLoading(false)
      })
      return
    }
    let cancelled = false
    queueMicrotask(() => setLoading(true))
    void runGlobalSearch(q).then((rows) => {
      if (!cancelled) {
        setResults(rows)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

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
      if (!wrapRef.current?.contains(t)) setDropdownOpen(false)
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

  const onSearchNavigate = props.onSearchNavigate
  const handleSelect = useCallback(
    (r: GlobalSearchResult) => {
      onSearchNavigate?.(r.navKey)
      setQuery('')
      setResults([])
      setDropdownOpen(false)
      inputRef.current?.blur()
    },
    [onSearchNavigate],
  )

  const showPanel =
    Boolean(props.onSearchNavigate) && dropdownOpen && query.trim().length >= 1

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/70 backdrop-blur-md">
      <h1 className="sr-only">Tableau de bord CRM</h1>
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={props.onOpenMobileNav}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-surface text-text outline-none transition duration-200 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative hidden min-w-0 flex-1 md:block" ref={wrapRef}>
          <label className="relative mx-auto block w-full max-w-[520px]">
            <span className="sr-only">Recherche globale</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted"
              strokeWidth={1.75}
            />
            <input
              ref={inputRef}
              id={searchId}
              role="combobox"
              aria-expanded={Boolean(showPanel)}
              aria-controls={showPanel ? listboxId : undefined}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => {
                if (query.trim().length >= 1) setDropdownOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDropdownOpen(false)
                  inputRef.current?.blur()
                }
              }}
              className="h-11 w-full rounded-[10px] border border-border bg-black-contrast/25 px-10 text-sm text-text outline-none ring-primary/30 placeholder:text-text-muted focus:border-primary/40 focus:ring-2"
              placeholder="Rechercher un client, un chantier, une facture…"
              autoComplete="off"
            />
          </label>

          {showPanel ? (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Résultats de recherche"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(60vh,320px)] overflow-auto rounded-[12px] border border-border bg-surface py-1 shadow-[var(--shadow-hover)]"
            >
              {loading ? (
                <div className="px-3 py-3 text-sm text-text-muted">Recherche…</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-3 text-sm text-text-muted">Aucun résultat</div>
              ) : (
                <ul className="py-1">
                  {results.map((r) => (
                    <li key={`${r.type}-${r.id}`} role="option">
                      <button
                        type="button"
                        className="flex w-full items-baseline gap-2 px-3 py-2.5 text-left text-sm outline-none transition hover:bg-white/5 focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(r)}
                      >
                        <span className="shrink-0 font-semibold text-text-muted">{r.type}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-text">{r.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={props.onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-surface text-text outline-none transition duration-200 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
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

          <div className="relative" ref={notifWrapRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o)
                loadNotifications()
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-surface text-text outline-none transition duration-200 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
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
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-[12px] border border-border bg-surface shadow-[var(--shadow-hover)]"
                role="dialog"
                aria-label="Alertes"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <div className="text-sm font-semibold text-text">Notifications</div>
                  <div className="text-xs text-text-muted">Chantiers, paiements et tâches à traiter</div>
                </div>
                <div className="max-h-[min(60vh,320px)] overflow-auto">
                  {notifLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-text-muted">Chargement…</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-text-muted">Aucune alerte</div>
                  ) : (
                    <ul className="py-1">
                      {notifications.map((n) => (
                        <li key={n.id} className="border-b border-border/60 last:border-b-0">
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

          <div className="hidden items-center gap-3 sm:flex">
            <div
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/35 to-accent/25 text-sm font-semibold text-text ring-1 ring-border transition duration-200 ease-out hover:shadow-[0_0_0_6px_rgba(45,107,255,0.18)]"
              aria-hidden="true"
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{userEmail || '…'}</div>
              <div className="truncate text-xs text-text-muted">Connecté</div>
            </div>
          </div>

          <div className="sm:hidden">
            <div
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/35 to-accent/25 text-sm font-semibold text-text ring-1 ring-border"
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
