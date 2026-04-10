import { useMemo, useState } from 'react'
import type { Priority } from './types'
import type { SiteRow } from './mockData'
import { formatShortISODate, hoursUntilDueDate } from './format'
import { ArrowDownUp } from 'lucide-react'

type SortKey = keyof Pick<SiteRow, 'name' | 'client' | 'progress' | 'dueDate' | 'priority' | 'owner'>

function priorityLabel(p: Priority) {
  switch (p) {
    case 'high':
      return 'Haute'
    case 'medium':
      return 'Moyenne'
    case 'low':
      return 'Basse'
  }
}

function priorityClasses(p: Priority) {
  switch (p) {
    case 'high':
      return 'bg-danger/15 text-text ring-danger/25'
    case 'medium':
      return 'bg-warning/15 text-text ring-warning/25'
    case 'low':
      return 'bg-primary/15 text-text ring-primary/25'
  }
}

function compare(a: SiteRow, b: SiteRow, key: SortKey, dir: 'asc' | 'desc') {
  const mul = dir === 'asc' ? 1 : -1
  if (key === 'progress') return (a.progress - b.progress) * mul
  if (key === 'dueDate') return (a.dueDate.localeCompare(b.dueDate) * mul) as number
  return (String(a[key]).localeCompare(String(b[key]), 'fr') * mul) as number
}

export function SiteTable(props: { sites: SiteRow[]; loading?: boolean }) {
  const loading = props.loading ?? false
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(() => {
    const copy = [...props.sites]
    copy.sort((a, b) => compare(a, b, sortKey, sortDir))
    return copy
  }, [props.sites, sortDir, sortKey])

  function toggleSort(next: SortKey) {
    if (next === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(next)
      setSortDir('asc')
    }
  }

  return (
    <section
      aria-label="Chantiers en cours"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Chantiers en cours</h2>
          <p className="mt-1 text-sm text-text-muted">
            Suivi d’avancement, échéances, priorités et responsables.
          </p>
        </div>
        <div className="text-xs text-text-muted">
          Tri actif :{' '}
          <span className="font-semibold text-text">
            {sortKey} ({sortDir})
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[12px] border border-border">
        <div className="hidden lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Nom chantier <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('client')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Client <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('progress')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Avancement <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('dueDate')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Échéance <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('priority')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Priorité <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('owner')}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    Responsable <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={6}>
                    Chargement des chantiers…
                  </td>
                </tr>
              ) : (
                rows.map((s) => {
                  const urgent = hoursUntilDueDate(s.dueDate) > 0 && hoursUntilDueDate(s.dueDate) < 48
                  return (
                    <tr key={s.id} className="border-t border-border transition duration-200 ease-out hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-text-muted">{s.client}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black-contrast/35 ring-1 ring-border">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${s.progress}%` }}
                            />
                          </div>
                          <div className="w-12 text-right text-xs font-semibold tabular-nums text-text-muted">
                            {s.progress}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tabular-nums text-text-muted">{formatShortISODate(s.dueDate)}</span>
                          {urgent ? (
                            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-text ring-1 ring-danger/25">
                              Urgent
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                            priorityClasses(s.priority),
                          ].join(' ')}
                        >
                          {priorityLabel(s.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{s.owner}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border lg:hidden">
          {loading ? (
            <div className="p-4 text-sm text-text-muted">Chargement des chantiers…</div>
          ) : (
            rows.map((s) => {
              const urgent = hoursUntilDueDate(s.dueDate) > 0 && hoursUntilDueDate(s.dueDate) < 48
              return (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="mt-1 text-xs text-text-muted">{s.client}</div>
                    </div>
                    <span
                      className={[
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                        priorityClasses(s.priority),
                      ].join(' ')}
                    >
                      {priorityLabel(s.priority)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
                    <div className="tabular-nums">{formatShortISODate(s.dueDate)}</div>
                    {urgent ? (
                      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-text ring-1 ring-danger/25">
                        Urgent
                      </span>
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black-contrast/35 ring-1 ring-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-xs font-semibold tabular-nums text-text-muted">
                      {s.progress}%
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-text-muted">
                    Responsable : <span className="font-semibold text-text">{s.owner}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
