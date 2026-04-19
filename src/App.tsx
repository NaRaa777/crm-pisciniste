import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { AnalyticsPage } from './components/AnalyticsPage'
import { DashboardHome } from './components/DashboardHome'
import {
  connectedUser,
} from './components/mockData'
import { ChantierForm, type ChantierEditPayload } from './components/ChantierForm'
import { ChantiersPage } from './components/ChantiersPage'
import { ClientForm, type ClientEditPayload } from './components/ClientForm'
import { DevisForm, type DevisEditPayload } from './components/DevisForm'
import { DevisPage } from './components/DevisPage'
import { FactureForm, type FactureEditPayload } from './components/FactureForm'
import { PaiementsPage } from './components/PaiementsPage'
import { AidePage } from './components/AidePage'
import { ProspectsPage } from './components/ProspectsPage'
import { IAVisualisationPage } from './components/IAVisualisationPage'
import { PortfolioPage } from './components/PortfolioPage'
import { ChangePasswordPage } from './components/ChangePasswordPage'
import { LoginPage } from './components/LoginPage'
import { ParametresPage } from './components/ParametresPage'
import { PlanningPage } from './components/PlanningPage'
import { Sidebar } from './components/Sidebar'
import { TacheForm, type TacheEditPayload } from './components/TacheForm'
import { OfflineBanner } from './components/OfflineBanner'
import { TopHeader } from './components/TopHeader'
import type { ThemeMode } from './components/types'
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  Hammer,
  Image,
  LayoutDashboard,
  Receipt,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { loadUserPrefs, saveUserPrefs } from './lib/userPrefs'
import { useNetworkStatus } from './lib/networkStatus'
import { supabase } from './lib/supabase'
import { useChantiers, useClients, useDevis, useFacturation, useTaches } from './lib/useSupabaseData'

function setHtmlTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}

function AuthenticatedApp() {
  const { online } = useNetworkStatus()
  const { clients, loading: clientsLoading, refetch: refetchClients } = useClients()
  const { chantiers, loading: chantiersLoading, refetch: refetchChantiers } = useChantiers()
  const { taches, loading: tachesLoading, refetch: refetchTaches } = useTaches()
  const { devis, loading: devisLoading, refetch: refetchDevis } = useDevis()
  const { facturation, loading: facturationLoading, refetch: refetchFacturation } = useFacturation()

  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [userProfile, setUserProfile] = useState<{ name: string; email: string }>(() =>
    loadUserPrefs(connectedUser.name),
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [clientBeingEdited, setClientBeingEdited] = useState<ClientEditPayload | null>(null)
  const [navKey, setNavKey] = useState<string>('dashboard')
  const [chantierFormOpen, setChantierFormOpen] = useState(false)
  const [chantierBeingEdited, setChantierBeingEdited] = useState<ChantierEditPayload | null>(null)
  const [tacheFormOpen, setTacheFormOpen] = useState(false)
  const [tacheBeingEdited, setTacheBeingEdited] = useState<TacheEditPayload | null>(null)
  const [devisFormOpen, setDevisFormOpen] = useState(false)
  const [devisBeingEdited, setDevisBeingEdited] = useState<DevisEditPayload | null>(null)
  const [factureFormOpen, setFactureFormOpen] = useState(false)
  const [factureBeingEdited, setFactureBeingEdited] = useState<FactureEditPayload | null>(null)

  useEffect(() => {
    setHtmlTheme(theme)
  }, [theme])

  const handleQuickQuote = useCallback(() => {
    setDevisBeingEdited(null)
    setDevisFormOpen(true)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      if (!mod || !online) return
      const k = e.key.toLowerCase()
      if (k === 'd') {
        e.preventDefault()
        handleQuickQuote()
      }
      if (k === 'p') {
        e.preventDefault()
        setClientBeingEdited(null)
        setClientFormOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleQuickQuote, online])

  const clientOptions = useMemo(
    () =>
      (clients ?? [])
        .map((c: { id?: unknown; nom?: unknown }) => ({
          id: String(c.id ?? ''),
          nom: String(c.nom ?? ''),
        }))
        .filter((c) => c.id !== ''),
    [clients],
  )

  const chantierOptions = useMemo(
    () =>
      (chantiers ?? [])
        .map((c: { id?: unknown; titre?: unknown; nom?: unknown }) => ({
          id: String(c.id ?? ''),
          titre: String(c.titre ?? c.nom ?? 'Sans titre'),
        }))
        .filter((c) => c.id !== ''),
    [chantiers],
  )

  const chantierOptionsForFacture = useMemo(
    () =>
      (chantiers ?? [])
        .map(
          (c: {
            id?: unknown
            titre?: unknown
            nom?: unknown
            client_id?: unknown
          }) => ({
            id: String(c.id ?? ''),
            titre: String(c.titre ?? c.nom ?? 'Sans titre'),
            client_id: String(c.client_id ?? ''),
          }),
        )
        .filter((c) => c.id !== '' && c.client_id !== ''),
    [chantiers],
  )

  const refreshChantiersAndFacturation = useCallback(() => {
    refetchChantiers()
    refetchFacturation()
  }, [refetchChantiers, refetchFacturation])

  return (
    <div className="min-h-full bg-transparent text-text">
      {!online ? <OfflineBanner /> : null}
      <div className="flex min-h-full">
        <div className="hidden lg:block">
          <Sidebar
            activeKey={navKey}
            onNavigate={setNavKey}
            onQuickQuote={handleQuickQuote}
            onQuickAddClient={() => {
              setClientBeingEdited(null)
              setClientFormOpen(true)
            }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[240px]">
          <TopHeader
            navKey={navKey}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
            {navKey === 'prospects' ? (
              <ProspectsPage />
            ) : navKey === 'sites' ? (
              <ChantiersPage
                chantiers={chantiers as Record<string, unknown>[]}
                loading={chantiersLoading}
                onNavigate={setNavKey}
                onRefresh={refreshChantiersAndFacturation}
                onEditChantier={(c) => {
                  setChantierBeingEdited(c)
                  setChantierFormOpen(true)
                }}
                onAddChantier={() => {
                  setChantierBeingEdited(null)
                  setChantierFormOpen(true)
                }}
              />
            ) : navKey === 'paiements' ? (
              <PaiementsPage
                facturation={facturation as Record<string, unknown>[]}
                loading={facturationLoading}
                onRefresh={refetchFacturation}
                onEditFacture={(f) => {
                  setFactureBeingEdited(f)
                  setFactureFormOpen(true)
                }}
                onNouvelleFacture={() => {
                  setFactureBeingEdited(null)
                  setFactureFormOpen(true)
                }}
              />
            ) : navKey === 'ia-visualisation' ? (
              <IAVisualisationPage />
            ) : navKey === 'portfolio' ? (
              <PortfolioPage />
            ) : navKey === 'planning' ? (
              <PlanningPage
                taches={taches as Record<string, unknown>[]}
                loading={tachesLoading}
                onRefresh={refetchTaches}
                onEditTache={(t) => {
                  setTacheBeingEdited(t)
                  setTacheFormOpen(true)
                }}
                onAddTache={() => {
                  setTacheBeingEdited(null)
                  setTacheFormOpen(true)
                }}
              />
            ) : navKey === 'devis' ? (
              <DevisPage
                devis={devis as Record<string, unknown>[]}
                loading={devisLoading}
                onNavigate={setNavKey}
                onRefresh={refetchDevis}
                onEditDevis={(d) => {
                  setDevisBeingEdited(d)
                  setDevisFormOpen(true)
                }}
                onNouveauDevis={() => {
                  setDevisBeingEdited(null)
                  setDevisFormOpen(true)
                }}
                onApresConversionFacture={() => {
                  void refetchFacturation()
                  setNavKey('paiements')
                }}
              />
            ) : navKey === 'analytics' ? (
              <AnalyticsPage
                chantiers={chantiers as Record<string, unknown>[]}
                facturation={facturation as Record<string, unknown>[]}
                devis={devis as Record<string, unknown>[]}
                loading={clientsLoading || chantiersLoading || facturationLoading}
              />
            ) : navKey === 'settings' ? (
              <ParametresPage
                key={`${userProfile.name}\u0000${userProfile.email}`}
                initialName={userProfile.name}
                initialEmail={userProfile.email}
                theme={theme}
                onSaveProfile={(data) => {
                  const name = data.name.trim() || connectedUser.name
                  const email = data.email.trim()
                  const next = { name, email }
                  setUserProfile(next)
                  saveUserPrefs(next)
                }}
                onThemeChange={setTheme}
                onSignOut={() => void supabase.auth.signOut()}
              />
            ) : navKey === 'help' ? (
              <AidePage />
            ) : (
              <DashboardHome onVoirToutPiscines={() => setNavKey('sites')} />
            )}
          </main>

          <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-black/25 backdrop-blur-md lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto overscroll-x-contain px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <MobileTab
                icon={LayoutDashboard}
                label="Accueil"
                active={navKey === 'dashboard'}
                onClick={() => setNavKey('dashboard')}
              />
              <MobileTab
                icon={CalendarDays}
                label="Planning"
                active={navKey === 'planning'}
                onClick={() => setNavKey('planning')}
              />
              <MobileTab
                icon={Hammer}
                label="Chantiers"
                active={navKey === 'sites'}
                onClick={() => setNavKey('sites')}
              />
              <MobileTab
                icon={Users}
                label="Prospects"
                active={navKey === 'prospects'}
                onClick={() => setNavKey('prospects')}
              />
              <MobileTab
                icon={FileSpreadsheet}
                label="Devis"
                active={navKey === 'devis'}
                onClick={() => setNavKey('devis')}
              />
              <MobileTab
                icon={Sparkles}
                label="IA Viz"
                active={navKey === 'ia-visualisation'}
                onClick={() => setNavKey('ia-visualisation')}
              />
              <MobileTab
                icon={Receipt}
                label="Paiements"
                active={navKey === 'paiements'}
                onClick={() => setNavKey('paiements')}
              />
              <MobileTab
                icon={BarChart3}
                label="Analytics"
                active={navKey === 'analytics'}
                onClick={() => setNavKey('analytics')}
              />
              <MobileTab
                icon={Image}
                label="Portfolio"
                active={navKey === 'portfolio'}
                onClick={() => setNavKey('portfolio')}
              />
            </div>
          </nav>

          <div className="h-[4.5rem] lg:hidden" />
        </div>
      </div>

      <ClientForm
        key={clientFormOpen ? (clientBeingEdited?.id ?? 'new') : 'closed'}
        open={clientFormOpen}
        editingClient={clientBeingEdited}
        onClose={() => {
          setClientFormOpen(false)
          setClientBeingEdited(null)
        }}
        onSuccess={refetchClients}
      />

      <ChantierForm
        key={chantierFormOpen ? (chantierBeingEdited?.id ?? 'new') : 'closed'}
        open={chantierFormOpen}
        editingChantier={chantierBeingEdited}
        clients={clientOptions}
        onClose={() => {
          setChantierFormOpen(false)
          setChantierBeingEdited(null)
        }}
        onSuccess={refreshChantiersAndFacturation}
      />

      <TacheForm
        key={tacheFormOpen ? (tacheBeingEdited?.id ?? 'new') : 'closed'}
        open={tacheFormOpen}
        editingTache={tacheBeingEdited}
        chantiers={chantierOptions}
        onClose={() => {
          setTacheFormOpen(false)
          setTacheBeingEdited(null)
        }}
        onSuccess={refetchTaches}
      />

      <DevisForm
        key={devisFormOpen ? (devisBeingEdited?.id ?? 'new') : 'closed'}
        open={devisFormOpen}
        editingDevis={devisBeingEdited}
        onClose={() => {
          setDevisFormOpen(false)
          setDevisBeingEdited(null)
        }}
        onSuccess={refetchDevis}
        clients={clientOptions}
      />

      <FactureForm
        key={
          factureFormOpen
            ? `${factureBeingEdited?.id ?? 'new'}-${factureBeingEdited?.devis_id ?? 'x'}-${factureBeingEdited?.numero ?? ''}`
            : 'closed'
        }
        open={factureFormOpen}
        editingFacture={factureBeingEdited}
        onClose={() => {
          setFactureFormOpen(false)
          setFactureBeingEdited(null)
        }}
        onSuccess={refetchFacturation}
        clients={clientOptions}
        chantiers={chantierOptionsForFacture}
      />

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fermer le menu"
          />
          <div className="absolute left-0 top-0 h-full w-[min(92vw,320px)] border-r border-border bg-black/35 backdrop-blur-xl shadow-[var(--shadow-hover)]">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="text-sm font-semibold">Navigation</div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-black-contrast/20 outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-2">
              <Sidebar
                activeKey={navKey}
                className="w-full border-0 bg-transparent"
                onNavigate={(key) => {
                  setNavKey(key)
                  setMobileNavOpen(false)
                }}
                onQuickQuote={() => {
                  handleQuickQuote()
                  setMobileNavOpen(false)
                }}
                onQuickAddClient={() => {
                  setClientBeingEdited(null)
                  setClientFormOpen(true)
                  setMobileNavOpen(false)
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  /** Incrémenté après changement de mot de passe pour relire localStorage et afficher l’app. */
  const [, setPasswordGateVersion] = useState(0)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent text-text text-sm">
        Chargement…
      </div>
    )
  }
  if (!session) return <LoginPage />

  const passwordChanged =
    typeof window !== 'undefined' && localStorage.getItem('password_changed') === 'true'

  if (!passwordChanged) {
    return (
      <ChangePasswordPage
        onSuccess={() => {
          localStorage.setItem('password_changed', 'true')
          setPasswordGateVersion((v) => v + 1)
        }}
      />
    )
  }

  return <AuthenticatedApp />
}

function MobileTab(props: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  const Icon = props.icon
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-current={props.active ? 'page' : undefined}
      className={[
        'flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] px-2 py-2 text-[11px] font-semibold outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-accent/60',
        props.active ? 'text-primary' : 'text-text-muted hover:text-text',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
      <span className="max-w-[4.25rem] truncate text-center">{props.label}</span>
    </button>
  )
}
