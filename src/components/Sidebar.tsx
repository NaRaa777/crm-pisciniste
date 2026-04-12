import { useId } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Contact,
  FileSpreadsheet,
  FileText,
  Hammer,
  Receipt,
  HelpCircle,
  LayoutDashboard,
  Settings,
  UserPlus,
} from 'lucide-react'

type NavItem = {
  key: string
  label: string
  icon: LucideIcon
}

const items: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'planning', label: 'Planning', icon: CalendarDays },
  { key: 'sites', label: 'Chantiers', icon: Hammer },
  { key: 'facturation', label: 'Facturation', icon: Receipt },
  { key: 'devis', label: 'Devis', icon: FileSpreadsheet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'clients', label: 'Clients', icon: Contact },
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
        'relative flex h-full w-[240px] flex-col border-r border-border bg-surface-2',
        'lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen',
        props.className ?? '',
      ].join(' ')}
    >
      <div className="shrink-0 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-black-contrast/40 ring-1 ring-border">
            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_0_6px_rgba(45,107,255,0.18)]" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight">CRM Perso</div>
            <div className="text-xs text-text-muted">Opérations</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
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
                    className={[
                      'group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out',
                      'hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60',
                      active
                        ? 'translate-x-[2px] border-l-[3px] border-primary bg-[rgba(45,107,255,0.18)] text-text'
                        : 'border-l-[3px] border-transparent text-text-muted hover:text-text',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-[18px] w-[18px] shrink-0',
                        active ? 'text-primary' : 'text-text-muted group-hover:text-text',
                      ].join(' ')}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-border pt-4">
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
                  className="group flex w-full items-center gap-3 rounded-[10px] border border-primary/30 bg-primary/15 px-3 py-2 text-left text-sm font-semibold text-text outline-none transition duration-200 ease-out hover:bg-primary/25 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText
                    className="h-[18px] w-[18px] shrink-0 text-primary"
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
                  className="group flex w-full items-center gap-3 rounded-[10px] border border-accent/40 bg-gradient-to-br from-accent/10 to-primary/5 px-3 py-2 text-left text-sm font-semibold text-text outline-none transition duration-200 ease-out hover:border-accent/60 hover:from-accent/15 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus
                    className="h-[18px] w-[18px] shrink-0 text-accent"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">Ajouter un client</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="mt-auto shrink-0 border-t border-border px-3 pb-3 pt-3">
        <nav aria-label="Paramètres et aide">
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => props.onNavigate?.('settings')}
                className={[
                  'group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out',
                  'hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60',
                  props.activeKey === 'settings'
                    ? 'translate-x-[2px] border-l-[3px] border-primary bg-[rgba(45,107,255,0.18)] text-text'
                    : 'border-l-[3px] border-transparent text-text-muted hover:text-text',
                ].join(' ')}
              >
                <Settings
                  className={[
                    'h-[18px] w-[18px] shrink-0',
                    props.activeKey === 'settings'
                      ? 'text-primary'
                      : 'text-text-muted group-hover:text-text',
                  ].join(' ')}
                  strokeWidth={1.75}
                />
                <span className="truncate">Paramètres</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => props.onNavigate?.('help')}
                className={[
                  'flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-medium outline-none transition duration-200 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60',
                  props.activeKey === 'help'
                    ? 'translate-x-[2px] border-l-[3px] border-primary bg-[rgba(45,107,255,0.18)] text-text'
                    : 'border-l-[3px] border-transparent text-text-muted hover:text-text',
                ].join(' ')}
              >
                <HelpCircle
                  className={[
                    'h-[18px] w-[18px] shrink-0',
                    props.activeKey === 'help' ? 'text-primary' : 'text-text-muted group-hover:text-text',
                  ].join(' ')}
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
