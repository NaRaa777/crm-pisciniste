import type { PlanningFilter, PlanningStatus } from './types'
import type { PlanningTask } from './mockData'
import { formatShortISODate } from './format'

function statusLabel(status: PlanningStatus) {
  switch (status) {
    case 'planned':
      return 'Planifié'
    case 'in_progress':
      return 'En cours'
    case 'done':
      return 'Terminé'
    case 'late':
      return 'En retard'
  }
}

function statusClasses(status: PlanningStatus) {
  switch (status) {
    case 'planned':
      return 'bg-primary/15 text-text ring-primary/25'
    case 'in_progress':
      return 'bg-accent/15 text-text ring-accent/25'
    case 'done':
      return 'bg-success/15 text-text ring-success/25'
    case 'late':
      return 'bg-danger/15 text-text ring-danger/25'
  }
}

function inFilter(taskDate: string, filter: PlanningFilter) {
  const d = new Date(`${taskDate}T00:00:00`)
  const today = new Date('2026-04-08T00:00:00')

  if (filter === 'today') {
    return d.toDateString() === today.toDateString()
  }

  if (filter === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() + 1) // approx week start (Mon)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return d >= start && d <= end
  }

  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

export function PlanningBoard(props: {
  tasks: PlanningTask[]
  filter: PlanningFilter
  onFilterChange: (f: PlanningFilter) => void
  selectedId?: string | null
  onSelect: (task: PlanningTask) => void
  loading?: boolean
}) {
  const loading = props.loading ?? false
  const rows = props.tasks.filter((t) => inFilter(t.date, props.filter))

  return (
    <section
      aria-label="Planning de productions"
      className="min-h-[380px] rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Planning de productions</h2>
          <p className="mt-1 text-sm text-text-muted">
            Timeline des tâches : date, client, statut, responsable.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'today', label: "Aujourd'hui" },
              { key: 'week', label: 'Semaine' },
              { key: 'month', label: 'Mois' },
            ] as const
          ).map((b) => {
            const active = props.filter === b.key
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => props.onFilterChange(b.key)}
                className={[
                  'h-10 rounded-[10px] border px-3 text-sm font-semibold outline-none transition duration-200 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-accent/60',
                  active
                    ? 'border-primary/40 bg-primary/15 text-text'
                    : 'border-border bg-black-contrast/20 text-text-muted hover:bg-white/5 hover:text-text',
                ].join(' ')}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[12px] border border-border">
        <div className="hidden md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Tâche</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    Chargement du planning…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    Aucune tâche pour ce filtre.
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const selected = t.id === props.selectedId
                  return (
                    <tr
                      key={t.id}
                      className={[
                        'border-t border-border transition duration-200 ease-out',
                        selected ? 'bg-primary/10' : 'hover:bg-white/5',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 tabular-nums text-text-muted">
                        <button
                          type="button"
                          onClick={() => props.onSelect(t)}
                          className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          {formatShortISODate(t.date)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => props.onSelect(t)}
                          className="w-full text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          {t.client}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <button
                          type="button"
                          onClick={() => props.onSelect(t)}
                          className="w-full text-left text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          {t.title}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => props.onSelect(t)}
                          className="outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          <span
                            className={[
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                              statusClasses(t.status),
                            ].join(' ')}
                          >
                            {statusLabel(t.status)}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        <button
                          type="button"
                          onClick={() => props.onSelect(t)}
                          className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          {t.owner}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {loading ? (
            <div className="p-4 text-sm text-text-muted">Chargement du planning…</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-text-muted">Aucune tâche pour ce filtre.</div>
          ) : (
            rows.map((t) => {
              const selected = t.id === props.selectedId
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => props.onSelect(t)}
                  className={[
                    'flex w-full flex-col gap-2 p-4 text-left outline-none transition duration-200 ease-out',
                    'focus-visible:ring-2 focus-visible:ring-accent/60',
                    selected ? 'bg-primary/10' : 'hover:bg-white/5',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{t.client}</div>
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                        statusClasses(t.status),
                      ].join(' ')}
                    >
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <div className="text-sm text-text">{t.title}</div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="tabular-nums">{formatShortISODate(t.date)}</span>
                    <span>{t.owner}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
