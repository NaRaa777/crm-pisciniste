import { useMemo, useState } from 'react'
import {
  Droplets,
  Eye,
  FileText,
  PartyPopper,
  Search,
  Star,
  UserPlus,
  XCircle,
} from 'lucide-react'

type PoolType = 'Coque' | 'Béton' | 'Rénovation'
type ProspectStatus = 'nouveau' | 'qualifie' | 'devis_envoye' | 'gagne' | 'perdu'
type Source = 'web' | 'salon' | 'reco' | 'phone'

type Prospect = {
  id: string
  nom: string
  type: PoolType
  montantEstime: number
  statut: ProspectStatus
  source: Source
}

const MOCK: Prospect[] = [
  { id: '1', nom: 'Jean Martin', type: 'Coque', montantEstime: 45000, statut: 'nouveau', source: 'web' },
  { id: '2', nom: 'Sophie Bernard', type: 'Coque', montantEstime: 38000, statut: 'nouveau', source: 'salon' },
  { id: '3', nom: 'Marie Dubois', type: 'Béton', montantEstime: 65000, statut: 'qualifie', source: 'reco' },
  { id: '4', nom: 'Antoine Moreau', type: 'Rénovation', montantEstime: 22000, statut: 'qualifie', source: 'phone' },
  { id: '5', nom: 'Pierre Durand', type: 'Rénovation', montantEstime: 18000, statut: 'devis_envoye', source: 'web' },
  { id: '6', nom: 'Claire Petit', type: 'Rénovation', montantEstime: 22000, statut: 'devis_envoye', source: 'reco' },
  { id: '7', nom: 'Lucas Garcia', type: 'Coque', montantEstime: 42000, statut: 'gagne', source: 'web' },
  { id: '8', nom: 'Emma Rousseau', type: 'Béton', montantEstime: 58000, statut: 'perdu', source: 'salon' },
]

const eurMono = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const SOURCE_OPTIONS: { value: Source | 'tous'; label: string }[] = [
  { value: 'tous', label: 'Toutes les sources' },
  { value: 'web', label: 'Site web' },
  { value: 'salon', label: 'Salon' },
  { value: 'reco', label: 'Recommandation' },
  { value: 'phone', label: 'Téléphone' },
]

const STATUT_OPTIONS: { value: ProspectStatus | 'tous'; label: string }[] = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'qualifie', label: 'Qualifié' },
  { value: 'devis_envoye', label: 'Devis Envoyé' },
  { value: 'gagne', label: 'Gagné' },
  { value: 'perdu', label: 'Perdu' },
]

type MainTab = 'kanban' | 'inbox' | 'analytics'

const COL_DEF: {
  key: ProspectStatus
  label: string
  Icon: typeof UserPlus
  iconClass: string
  badgeClass: string
}[] = [
  {
    key: 'nouveau',
    label: 'Nouveau',
    Icon: UserPlus,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/35',
  },
  {
    key: 'qualifie',
    label: 'Qualifié',
    Icon: Star,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/35',
  },
  {
    key: 'devis_envoye',
    label: 'Devis Envoyé',
    Icon: FileText,
    iconClass: 'text-purple-500',
    badgeClass: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/35',
  },
  {
    key: 'gagne',
    label: 'Gagné',
    Icon: PartyPopper,
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/35',
  },
  {
    key: 'perdu',
    label: 'Perdu',
    Icon: XCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/35',
  },
]

export function ProspectsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('kanban')
  const [q, setQ] = useState('')
  const [source, setSource] = useState<Source | 'tous'>('tous')
  const [statutFiltre, setStatutFiltre] = useState<ProspectStatus | 'tous'>('tous')

  const filtered = useMemo(() => {
    return MOCK.filter((p) => {
      if (source !== 'tous' && p.source !== source) return false
      if (statutFiltre !== 'tous' && p.statut !== statutFiltre) return false
      if (q.trim()) {
        const s = q.trim().toLowerCase()
        if (!p.nom.toLowerCase().includes(s) && !p.type.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [q, source, statutFiltre])

  const byColumn = useMemo(() => {
    const m: Record<ProspectStatus, Prospect[]> = {
      nouveau: [],
      qualifie: [],
      devis_envoye: [],
      gagne: [],
      perdu: [],
    }
    for (const p of filtered) {
      m[p.statut].push(p)
    }
    return m
  }, [filtered])

  const tabBtn = (id: MainTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={mainTab === id}
      onClick={() => setMainTab(id)}
      className={[
        'rounded-[8px] px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
        mainTab === id ? 'bg-black text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-400',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <section aria-label="Gestion des prospects" className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end">
        <button
          type="button"
          className="h-11 shrink-0 rounded-[12px] bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
        >
          + Nouveau Prospect
        </button>
      </div>

      {/* Filtres */}
      <div
        className="flex flex-col gap-3 rounded-[12px] border border-[rgba(59,130,246,0.15)] bg-[#0e1e35] p-3 sm:flex-row sm:items-center sm:gap-3"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Recherche</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted"
            strokeWidth={1.75}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un prospect..."
            className="h-11 w-full rounded-[10px] border border-[rgba(59,130,246,0.12)] bg-black/20 py-2 pl-10 pr-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as Source | 'tous')}
          className="h-11 min-w-[180px] shrink-0 rounded-[10px] border border-[rgba(59,130,246,0.12)] bg-black/20 px-3 text-sm text-text outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/25 sm:min-w-[200px]"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value as ProspectStatus | 'tous')}
          className="h-11 min-w-[180px] shrink-0 rounded-[10px] border border-[rgba(59,130,246,0.12)] bg-black/20 px-3 text-sm text-text outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/25 sm:min-w-[200px]"
        >
          {STATUT_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs principales — même barre que DevisPage */}
      <div
        className="inline-flex max-w-full flex-wrap rounded-[10px] bg-[#0a0a0a] p-1"
        role="tablist"
        aria-label="Vue prospects"
      >
        {tabBtn('kanban', 'Vue Kanban')}
        {tabBtn('inbox', 'Inbox Centralisée')}
        {tabBtn('analytics', 'Analytics')}
      </div>

      {mainTab === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {COL_DEF.map((col) => {
            const ColIcon = col.Icon
            const list = byColumn[col.key]
            return (
              <div
                key={col.key}
                className="flex min-h-[320px] flex-col rounded-[12px] border border-[rgba(59,130,246,0.1)] bg-[#0a1628]/80"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[rgba(59,130,246,0.1)] px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <ColIcon className={`h-4 w-4 shrink-0 ${col.iconClass}`} strokeWidth={2} />
                    <span className="truncate text-xs font-bold uppercase tracking-wide text-text">{col.label}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${col.badgeClass}`}
                  >
                    {list.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-2">
                  {list.map((p) => (
                    <article
                      key={p.id}
                      className="group flex flex-col rounded-[12px] border border-[rgba(59,130,246,0.12)] bg-[#0e1e35] p-4 text-sm shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(59,130,246,0.35)]"
                    >
                      <div className="font-bold text-white">{p.nom}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-text-muted">
                        <Droplets className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} />
                        <span className="text-xs">{p.type}</span>
                      </div>
                      <div className="mt-3 font-mono text-base font-bold text-cyan-400">{eurMono.format(p.montantEstime)}</div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className="rounded-[8px] p-1.5 text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                          aria-label={`Voir ${p.nom}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : mainTab === 'inbox' ? (
        <div className="rounded-[12px] border border-[rgba(59,130,246,0.15)] bg-[#0e1e35] px-6 py-16 text-center text-sm text-text-muted">
          <p className="font-medium text-text">Inbox centralisée</p>
          <p className="mt-2 max-w-md mx-auto">Vue liste unifiée des messages et relances — à connecter à votre flux commercial.</p>
        </div>
      ) : (
        <div className="rounded-[12px] border border-[rgba(59,130,246,0.15)] bg-[#0e1e35] px-6 py-16 text-center text-sm text-text-muted">
          <p className="font-medium text-text">Analytics prospects</p>
          <p className="mt-2 max-w-md mx-auto">Tableaux de conversion et sources — données à brancher sur vos métriques.</p>
        </div>
      )}
    </section>
  )
}
