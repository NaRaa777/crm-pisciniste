import type { PlanningTask } from './mockData'
import { formatShortISODate } from './format'

export function PlanningDetailDrawer(props: { task: PlanningTask | null; onClose: () => void }) {
  if (!props.task) return null

  const t = props.task

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label="Détail de la tâche de production"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={props.onClose}
        aria-label="Fermer le panneau"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-surface shadow-[var(--shadow-hover)]">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text-muted">Détail production</div>
            <div className="mt-2 truncate text-lg font-semibold tracking-tight">{t.client}</div>
            <div className="mt-1 text-sm text-text-muted tabular-nums">{formatShortISODate(t.date)}</div>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="h-10 rounded-[10px] border border-border bg-black-contrast/20 px-3 text-sm font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div>
            <div className="text-xs font-semibold text-text-muted">Tâche</div>
            <div className="mt-2 text-text">{t.title}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted">Responsable</div>
            <div className="mt-2 text-text">{t.owner}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted">Notes</div>
            <div className="mt-2 rounded-[12px] border border-border bg-black-contrast/15 p-4 text-text-muted leading-relaxed">
              {t.notes}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="h-11 flex-1 rounded-[10px] bg-primary text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
            >
              Marquer comme terminé
            </button>
            <button
              type="button"
              className="h-11 flex-1 rounded-[10px] border border-border bg-black-contrast/20 text-sm font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
            >
              Reporter
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
