import { useId } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Hammer,
  HelpCircle,
  Image,
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'

type NavItem = {
  key: string
  label: string
  icon: LucideIcon
}

/** Style inline commun : item nav actif (principal, Paramètres, Aide). */
const NAV_ITEM_ACTIVE_STYLE = {
  background: 'rgba(6, 182, 212, 0.08)',
  boxShadow: 'inset 3px 0 0 #06b6d4',
  color: '#06b6d4',
  borderRadius: '10px',
} as const

const items: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'planning', label: 'Planning', icon: CalendarDays },
  { key: 'sites', label: 'Chantiers', icon: Hammer },
  { key: 'prospects', label: 'Prospects', icon: Users },
  { key: 'devis', label: 'Devis & Matériaux', icon: FileSpreadsheet },
  { key: 'ia-visualisation', label: 'IA Visualisation', icon: Sparkles },
  { key: 'paiements', label: 'Paiements', icon: Receipt },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'portfolio', label: 'Portfolio', icon: Image },
]

export type SidebarProps = {
  activeKey: string
  className?: string
  onNavigate?: (key: string) => void
  onQuickQuote?: () => void
  onQuickAddClient?: () => void
}

export function Sidebar(props: SidebarProps) {
  const { online } = useNetworkStatus()
  const quickActionsLabelId = useId()

  return (
    <aside
      className={[
        'sidebar-laser-edge relative flex h-full w-[240px] flex-col border-r border-[rgba(59,130,246,0.15)] bg-transparent backdrop-blur-md',
        'lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen',
        props.className ?? '',
      ].join(' ')}
    >
      <div className="sidebar-brand-header shrink-0 px-5 py-5">
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[12px] ring-1 ring-sky-500/25 shadow-[0_0_14px_rgba(56,189,248,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{
              background: 'linear-gradient(145deg, #1e40af 0%, #0e7490 50%, #0891b2 100%)',
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-transparent"
              aria-hidden
            />
            <svg
              className="relative z-10"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M12 8C12 8 8 13 8 16a4 4 0 0 0 8 0c0-3-4-8-4-8z"
                fill="rgba(6,182,212,0.5)"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-medium text-slate-400">CRM Pisciniste</div>
            <div className="font-['Syne',sans-serif] text-sm font-semibold tracking-tight text-slate-100">
              Template Général
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
        <nav aria-label="Navigation principale">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              const active = item.key === props.activeKey
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => props.onNavigate?.(item.key)}
                    style={active ? NAV_ITEM_ACTIVE_STYLE : {}}
                    className="group flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <Icon
                      style={active ? { color: '#06b6d4' } : undefined}
                      className="h-[18px] w-[18px] shrink-0 text-text-muted group-hover:text-text"
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-[rgba(59,130,246,0.15)] pt-4">
            <p
              id={quickActionsLabelId}
              className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
            >
              Actions rapides
            </p>
            <ul className="space-y-1" aria-labelledby={quickActionsLabelId}>
              <li>
                <button
                  type="button"
                  onClick={props.onQuickQuote}
                  title="Devis rapide (Ctrl+D)"
                  disabled={!online}
                  className="group flex w-full items-center gap-3 rounded-[10px] border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-left text-sm font-semibold text-blue-300 outline-none transition duration-200 ease-out hover:bg-blue-500/15 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)] focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText
                    className="h-[18px] w-[18px] shrink-0 text-blue-300"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">Devis rapide</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => props.onQuickAddClient?.()}
                  title="Ajouter un client (Ctrl+P)"
                  disabled={!online}
                  className="group flex w-full items-center gap-3 rounded-[10px] border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-left text-sm font-semibold text-blue-300 outline-none transition duration-200 ease-out hover:bg-blue-500/15 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)] focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus
                    className="h-[18px] w-[18px] shrink-0 text-blue-300"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">Ajouter un client</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="mt-auto shrink-0 border-t border-[rgba(59,130,246,0.15)] px-3 pb-3 pt-3">
        <nav aria-label="Paramètres et aide">
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => props.onNavigate?.('settings')}
                style={props.activeKey === 'settings' ? NAV_ITEM_ACTIVE_STYLE : {}}
                className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <Settings
                  style={props.activeKey === 'settings' ? { color: '#06b6d4' } : undefined}
                  className="h-[18px] w-[18px] shrink-0 text-text-muted group-hover:text-text"
                  strokeWidth={1.75}
                />
                <span className="truncate">Paramètres</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => props.onNavigate?.('help')}
                style={props.activeKey === 'help' ? NAV_ITEM_ACTIVE_STYLE : {}}
                className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <HelpCircle
                  style={props.activeKey === 'help' ? { color: '#06b6d4' } : undefined}
                  className="h-[18px] w-[18px] shrink-0 text-text-muted group-hover:text-text"
                  strokeWidth={1.75}
                />
                Aide / Support
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}

