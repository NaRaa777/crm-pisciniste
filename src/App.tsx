import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { AlertsBar } from './components/AlertsBar'
import { AnalyticsPage } from './components/AnalyticsPage'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { KpiCards } from './components/KpiCards'
import {
  connectedUser,
} from './components/mockData'
import { PaymentsPanel } from './components/PaymentsPanel'
import { PlanningBoard } from './components/PlanningBoard'
import { PlanningDetailDrawer } from './components/PlanningDetailDrawer'
import { ChantierForm, type ChantierEditPayload } from './components/ChantierForm'
import { ChantiersPage } from './components/ChantiersPage'
import { ClientForm, type ClientEditPayload } from './components/ClientForm'
import { DevisForm, type DevisEditPayload } from './components/DevisForm'
import { DevisPage } from './components/DevisPage'
import { FactureForm, type FactureEditPayload } from './components/FactureForm'
import { FacturationPage } from './components/FacturationPage'
import { AidePage } from './components/AidePage'
import { ClientsPage } from './components/ClientsPage'
import { LoginPage } from './components/LoginPage'
import { ParametresPage } from './components/ParametresPage'
import { PlanningPage } from './components/PlanningPage'
import { Sidebar } from './components/Sidebar'
import { TacheForm, type TacheEditPayload } from './components/TacheForm'
import { SiteTable } from './components/SiteTable'
import { OfflineBanner } from './components/OfflineBanner'
import { TopHeader } from './components/TopHeader'
import type { AnalyticsPeriod, PaymentStatus, PlanningFilter, PlanningStatus, Priority, ThemeMode } from './components/types'
import type { PlanningTask, SiteRow, TransactionRow } from './components/mockData'
import {
  BarChart3,
  CalendarDays,
  Contact,
  FileSpreadsheet,
  Hammer,
  LayoutDashboard,
  Receipt,
  X,
} from 'lucide-react'
import {
  addDays,
  firstDayOfMonth,
  firstDayOfPreviousMonth,
  inCalendarMonth,
  inTimeRange,
  mondayStartOfWeek,
  parseTimestamp,
  pctChange,
} from './lib/kpiMetrics'
import { loadUserPrefs, saveUserPrefs } from './lib/userPrefs'
import { useNetworkStatus } from './lib/networkStatus'
import { supabase } from './lib/supabase'
import { useChantiers, useClients, useDevis, useFacturation, useTaches } from './lib/useSupabaseData'

function setHtmlTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}

function rowStr(v: unknown, fallback: string): string {
  if (v == null || v === '') return fallback
  return String(v)
}

function tacheClientLabel(t: Record<string, unknown>): string {
  const ch = t.chantiers as Record<string, unknown> | undefined
  const nested = ch?.clients as Record<string, unknown> | undefined
  const client = t.client as Record<string, unknown> | undefined
  return rowStr(nested?.nom ?? client?.nom ?? t.client_nom, 'Client inconnu')
}

function chantierSiteClientName(c: Record<string, unknown>): string {
  const cl = c.clients as Record<string, unknown> | undefined
  return rowStr(cl?.nom ?? c.client_nom, 'Client inconnu')
}

function facturationLabelParts(f: Record<string, unknown>): { client: string; site: string } {
  const cl = f.clients as Record<string, unknown> | undefined
  const ch = f.chantiers as Record<string, unknown> | undefined
  return {
    client: rowStr(cl?.nom ?? f.client_nom, 'Client'),
    site: rowStr(ch?.titre ?? f.chantier_titre, 'Projet'),
  }
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

  const [planningFilter, setPlanningFilter] = useState<PlanningFilter>('week')
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null)

  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('30d')

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

  const planningTasks = useMemo<PlanningTask[]>(() => {
    const mapStatus = (rawStatus: unknown): PlanningStatus => {
      const value = String(rawStatus ?? '').toLowerCase().trim()
      if (value.includes('retard') || value === 'late') return 'late'
      if (value.includes('term') || value === 'done' || value === 'completed') return 'done'
      if (value.includes('cours') || value === 'in_progress' || value === 'in progress') return 'in_progress'
      return 'planned'
    }

    return (taches ?? []).map((t: Record<string, unknown>, idx: number) => ({
      id: String(t.id ?? t.uuid ?? `task-${idx + 1}`),
      date: String(t.date ?? t.deadline ?? t.created_at ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
      client: tacheClientLabel(t),
      title: String(t.titre ?? t.title ?? t.nom ?? 'Tâche'),
      status: mapStatus(t.statut ?? t.status),
      owner: String(t.responsable ?? t.owner ?? connectedUser.name),
      notes: String(t.notes ?? t.description ?? 'Aucune note disponible.'),
    }))
  }, [taches])

  const sites = useMemo<SiteRow[]>(() => {
    const mapPriority = (rawPriority: unknown): Priority => {
      const value = String(rawPriority ?? '').toLowerCase().trim()
      if (value.includes('haut') || value === 'high') return 'high'
      if (value.includes('bas') || value === 'low') return 'low'
      return 'medium'
    }

    return (chantiers ?? []).map((c: Record<string, unknown>, idx: number) => ({
      id: String(c.id ?? c.uuid ?? `site-${idx + 1}`),
      name: String(c.titre ?? c.nom ?? c.title ?? `Chantier ${idx + 1}`),
      client: chantierSiteClientName(c),
      progress: Number.isFinite(Number(c.avancement)) ? Number(c.avancement) : 0,
      dueDate: String(c.echeance ?? c.due_date ?? c.created_at ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
      priority: mapPriority(c.priorite ?? c.priority),
      owner: String(c.responsable ?? c.owner ?? connectedUser.name),
    }))
  }, [chantiers])

  const transactions = useMemo<TransactionRow[]>(() => {
    const mapPaymentStatus = (rawStatus: unknown): PaymentStatus => {
      const value = String(rawStatus ?? '').trim()
      if (value === 'Payée') return 'paid'
      return 'unpaid'
    }

    return (facturation ?? []).map((f: Record<string, unknown>, idx: number) => {
      const { client: clientName, site: siteName } = facturationLabelParts(f)
      const num = String(f.numero ?? '').trim()
      const paid = String(f.statut ?? '').trim() === 'Payée'
      return {
        id: String(f.id ?? `fac-${idx + 1}`),
        label: num ? `Facture ${num} — ${clientName} (${siteName})` : `Facture — ${clientName}`,
        amount: Number.isFinite(Number(f.montant_ttc)) ? Number(f.montant_ttc) : 0,
        status: mapPaymentStatus(f.statut),
        date: String(
          paid ? f.date_paiement ?? f.date_emission : f.date_emission ?? f.created_at ?? new Date().toISOString(),
        ).slice(0, 10),
      }
    })
  }, [facturation])

  const paymentSummary = useMemo(() => {
    const now = new Date()
    const collectedThisMonth = (facturation ?? [])
      .filter((f) => String(f.statut ?? '').trim() === 'Payée')
      .filter((f) => {
        const d = String(f.date_paiement ?? f.date_emission ?? '').slice(0, 10)
        return inCalendarMonth(d, now)
      })
      .reduce((sum, f) => sum + (Number.isFinite(Number(f.montant_ttc)) ? Number(f.montant_ttc) : 0), 0)
    const pending = (facturation ?? [])
      .filter((f) => String(f.statut ?? '').trim() !== 'Payée')
      .reduce((sum, f) => sum + (Number.isFinite(Number(f.montant_ttc)) ? Number(f.montant_ttc) : 0), 0)

    return { collectedThisMonth, pending }
  }, [facturation])

  const paymentStatusBreakdown = useMemo<Record<PaymentStatus, number>>(() => {
    const counts = transactions.reduce(
      (acc, tx) => {
        acc[tx.status] += 1
        return acc
      },
      { paid: 0, partial: 0, unpaid: 0 } as Record<PaymentStatus, number>,
    )
    const total = Math.max(transactions.length, 1)
    return {
      paid: Math.round((counts.paid / total) * 100),
      partial: Math.round((counts.partial / total) * 100),
      unpaid: Math.round((counts.unpaid / total) * 100),
    }
  }, [transactions])

  const kpis = useMemo(() => {
    const now = new Date()
    const thisWeekStart = mondayStartOfWeek(now)
    const thisWeekEndEx = addDays(thisWeekStart, 7)
    const lastWeekStart = addDays(thisWeekStart, -7)
    const lastWeekEndEx = thisWeekStart

    const countCreatedInWeek = (rows: Record<string, unknown>[] | undefined, key: string) =>
      (rows ?? []).filter((row) => {
        const ts = parseTimestamp(row[key])
        return ts != null && inTimeRange(ts, thisWeekStart, thisWeekEndEx)
      }).length

    const countCreatedLastWeek = (rows: Record<string, unknown>[] | undefined, key: string) =>
      (rows ?? []).filter((row) => {
        const ts = parseTimestamp(row[key])
        return ts != null && inTimeRange(ts, lastWeekStart, lastWeekEndEx)
      }).length

    const productionsWeek = countCreatedInWeek(taches as Record<string, unknown>[], 'created_at')
    const productionsLastWeek = countCreatedLastWeek(taches as Record<string, unknown>[], 'created_at')

    const chantiersActifsThisWeek = countCreatedInWeek(chantiers as Record<string, unknown>[], 'created_at')
    const chantiersActifsLastWeek = countCreatedLastWeek(chantiers as Record<string, unknown>[], 'created_at')

    const activeChantiersCount = (chantiers ?? []).filter((c: { statut?: unknown; status?: unknown }) => {
      const s = String(c.statut ?? c.status ?? '').toLowerCase()
      return !(s.includes('termin') || s === 'done' || s === 'completed')
    }).length

    const pendingSumForMonth = (monthAnchor: Date) =>
      (facturation ?? []).reduce((sum, f: Record<string, unknown>) => {
        if (String(f.statut ?? '').trim() === 'Payée') return sum
        const ts = parseTimestamp(f.date_emission ?? f.created_at)
        if (ts == null) return sum
        const d = new Date(ts)
        if (d.getFullYear() !== monthAnchor.getFullYear() || d.getMonth() !== monthAnchor.getMonth()) return sum
        const amt = Number(f.montant_ttc)
        return sum + (Number.isFinite(amt) ? amt : 0)
      }, 0)

    const startThisMonth = firstDayOfMonth(now)
    const startLastMonth = firstDayOfPreviousMonth(now)

    const totalPaymentsInMonth = (monthAnchor: Date) =>
      (facturation ?? []).reduce((sum, f: Record<string, unknown>) => {
        if (String(f.statut ?? '').trim() !== 'Payée') return sum
        const dStr = String(f.date_paiement ?? f.date_emission ?? '').slice(0, 10)
        const d = new Date(`${dStr}T12:00:00`)
        if (Number.isNaN(d.getTime())) return sum
        if (d.getFullYear() !== monthAnchor.getFullYear() || d.getMonth() !== monthAnchor.getMonth()) return sum
        const amt = Number(f.montant_ttc)
        return sum + (Number.isFinite(amt) ? amt : 0)
      }, 0)

    const caThisMonth = totalPaymentsInMonth(startThisMonth)
    const caLastMonth = totalPaymentsInMonth(startLastMonth)

    const pendingThisMonth = pendingSumForMonth(startThisMonth)
    const pendingLastMonth = pendingSumForMonth(startLastMonth)

    return [
      {
        id: 'prod-week',
        title: 'Productions cette semaine',
        value: productionsWeek,
        deltaPct: pctChange(productionsWeek, productionsLastWeek),
        format: 'number' as const,
      },
      {
        id: 'sites-active',
        title: 'Chantiers actifs',
        value: activeChantiersCount,
        deltaPct: pctChange(chantiersActifsThisWeek, chantiersActifsLastWeek),
        format: 'number' as const,
      },
      {
        id: 'payments-pending',
        title: 'Montants en attente',
        value: paymentSummary.pending,
        deltaPct: pctChange(pendingThisMonth, pendingLastMonth),
        format: 'currency' as const,
      },
      {
        id: 'mrr-est',
        title: 'CA mensuel estimé',
        value: caThisMonth,
        deltaPct: pctChange(caThisMonth, caLastMonth),
        format: 'currency' as const,
      },
    ]
  }, [chantiers, facturation, paymentSummary.pending, taches])

  const loading =
    clientsLoading || chantiersLoading || tachesLoading || devisLoading || facturationLoading
  const lateTasks = useMemo(() => planningTasks.filter((t) => t.status === 'late').length, [planningTasks])

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
    <div className="min-h-full bg-bg text-text">
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
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onSearchNavigate={setNavKey}
          />

          <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
            {navKey === 'clients' ? (
              <ClientsPage
                clients={clients as Record<string, unknown>[]}
                loading={clientsLoading}
                onRefresh={refetchClients}
                onEditClient={(c) => {
                  setClientBeingEdited(c)
                  setClientFormOpen(true)
                }}
              />
            ) : navKey === 'sites' ? (
              <ChantiersPage
                chantiers={chantiers as Record<string, unknown>[]}
                loading={chantiersLoading}
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
            ) : navKey === 'facturation' ? (
              <FacturationPage
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
                  setNavKey('facturation')
                }}
              />
            ) : navKey === 'analytics' ? (
              <AnalyticsPage
                clients={clients as Record<string, unknown>[]}
                chantiers={chantiers as Record<string, unknown>[]}
                facturation={facturation as Record<string, unknown>[]}
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
              <>
                <div className="mb-5">
                  <AlertsBar lateTasks={lateTasks} pendingAmount={paymentSummary.pending} />
                </div>

                <div className="space-y-5">
                  <KpiCards items={kpis} loading={loading} />

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
                    <div className="space-y-5 lg:col-span-8">
                      <PlanningBoard
                        tasks={planningTasks}
                        filter={planningFilter}
                        onFilterChange={setPlanningFilter}
                        selectedId={selectedTask?.id}
                        onSelect={setSelectedTask}
                        loading={loading}
                      />

                      <SiteTable sites={sites} loading={loading} />
                    </div>

                    <div className="space-y-5 lg:col-span-4">
                      <div className="hidden lg:block lg:sticky lg:top-[92px] lg:space-y-5">
                        <PaymentsPanel
                          collectedThisMonth={paymentSummary.collectedThisMonth}
                          pending={paymentSummary.pending}
                          breakdown={paymentStatusBreakdown}
                          transactions={transactions}
                          loading={loading}
                        />
                      </div>

                      <div className="lg:hidden space-y-5">
                        <PaymentsPanel
                          collectedThisMonth={paymentSummary.collectedThisMonth}
                          pending={paymentSummary.pending}
                          breakdown={paymentStatusBreakdown}
                          transactions={transactions}
                          loading={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <AnalyticsPanel period={analyticsPeriod} onPeriodChange={setAnalyticsPeriod} loading={loading} />
                </div>
              </>
            )}
          </main>

          <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface/85 backdrop-blur-md lg:hidden"
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
                icon={Receipt}
                label="Facturation"
                active={navKey === 'facturation'}
                onClick={() => setNavKey('facturation')}
              />
              <MobileTab
                icon={Contact}
                label="Clients"
                active={navKey === 'clients'}
                onClick={() => setNavKey('clients')}
              />
              <MobileTab
                icon={FileSpreadsheet}
                label="Devis"
                active={navKey === 'devis'}
                onClick={() => setNavKey('devis')}
              />
              <MobileTab
                icon={BarChart3}
                label="Analytics"
                active={navKey === 'analytics'}
                onClick={() => setNavKey('analytics')}
              />
            </div>
          </nav>

          <div className="h-[4.5rem] lg:hidden" />
        </div>
      </div>

      <PlanningDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />

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
          <div className="absolute left-0 top-0 h-full w-[min(92vw,320px)] border-r border-border bg-surface-2 shadow-[var(--shadow-hover)]">
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
      <div className="flex min-h-screen items-center justify-center bg-bg text-text text-sm">
        Chargement…
      </div>
    )
  }
  if (!session) return <LoginPage />
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
