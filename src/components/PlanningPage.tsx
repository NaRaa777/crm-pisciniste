import { useMemo, useState } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import { supabase } from '../lib/supabase'
import type { TacheEditPayload } from './TacheForm'

export type PlanningDateFilter = 'today' | 'week' | 'month'

function cellText(value: unknown): string {
  if (value == null || value === '') return '—'
  return String(value)
}

function toDateInputValue(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const s = String(raw)
  const d = s.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return ''
}

function formatDateDisplay(raw: unknown): string {
  const v = toDateInputValue(raw)
  if (!v) return '—'
  const d = new Date(`${v}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d)
}

function clientViaChantier(row: Record<string, unknown>): string {
  const ch = row.chantiers as { clients?: { nom?: string }; titre?: string } | null | undefined
  const nom = ch?.clients?.nom
  if (typeof nom === 'string' && nom.trim()) return nom
  return '—'
}

function parseTaskDate(row: Record<string, unknown>): Date | null {
  const s = toDateInputValue(row.date_echeance ?? row.deadline)
  if (!s) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfWeekMonday(ref: Date): Date {
  const x = new Date(ref)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfWeekSunday(ref: Date): Date {
  const start = startOfWeekMonday(ref)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function matchesDateFilter(taskDate: Date | null, filter: PlanningDateFilter): boolean {
  if (!taskDate) return true
  const now = new Date()
  if (filter === 'today') {
    return taskDate.toDateString() === now.toDateString()
  }
  if (filter === 'week') {
    const a = startOfWeekMonday(now)
    const b = endOfWeekSunday(now)
    return taskDate >= a && taskDate <= b
  }
  return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear()
}

export type PlanningPageProps = {
  taches: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditTache: (t: TacheEditPayload) => void
  onAddTache: () => void
}

export function PlanningPage(props: PlanningPageProps) {
  const { online } = useNetworkStatus()
  const readOnly = !online
  const [filter, setFilter] = useState<PlanningDateFilter>('week')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const rows = useMemo(() => {
    return (props.taches ?? []).filter((row) => {
      const td = parseTaskDate(row)
      return matchesDateFilter(td, filter)
    })
  }, [props.taches, filter])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from('taches').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      console.error(error)
      alert(error.message || 'Impossible de supprimer la tâche.')
      return
    }
    props.onRefresh()
  }

  function chantierIdFromRow(row: Record<string, unknown>): string {
    const raw = row.chantier_id ?? row.id_chantier
    return raw != null ? String(raw) : ''
  }

  function toEditPayload(row: Record<string, unknown>): TacheEditPayload | null {
    const id = row.id != null ? String(row.id) : ''
    if (!id) return null
    return {
      id,
      titre: String(row.titre ?? row.title ?? row.nom ?? ''),
      chantier_id: chantierIdFromRow(row),
      statut: row.statut != null && String(row.statut) !== '' ? String(row.statut) : null,
      responsable: row.responsable != null && String(row.responsable) !== '' ? String(row.responsable) : null,
      date_echeance: toDateInputValue(row.date_echeance ?? row.deadline) || null,
    }
  }

  const filterBtn = (key: PlanningDateFilter, label: string) => {
    const active = filter === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => setFilter(key)}
        className={[
          'rounded-[10px] px-4 py-2 text-sm font-semibold outline-none transition',
          'focus-visible:ring-2 focus-visible:ring-accent/60',
          active
            ? 'bg-primary text-white'
            : 'border border-border bg-black-contrast/20 text-text hover:bg-white/5',
        ].join(' ')}
      >
        {label}
      </button>
    )
  }

  return (
    <section
      aria-label="Planning des tâches"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={props.onAddTache}
            disabled={readOnly}
            className="h-10 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ajouter une tâche
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Période">
          {filterBtn('today', "Aujourd'hui")}
          {filterBtn('week', 'Semaine')}
          {filterBtn('month', 'Mois')}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-border">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3">Date échéance</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {props.loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Aucune tâche pour cette période.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const id = row.id != null ? String(row.id) : `row-${idx}`
                const editPayload = toEditPayload(row)
                const busy = deletingId === id

                return (
                  <tr key={id} className="bg-surface hover:bg-black-contrast/10">
                    <td className="px-4 py-3 text-text-muted tabular-nums">
                      {formatDateDisplay(row.date_echeance ?? row.deadline)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{clientViaChantier(row)}</td>
                    <td className="px-4 py-3 font-medium text-text">{cellText(row.titre ?? row.nom)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.statut)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.responsable)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editPayload && props.onEditTache(editPayload)}
                          disabled={!editPayload || busy || readOnly}
                          className="rounded-[8px] border border-border bg-black-contrast/20 px-3 py-1.5 text-xs font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(id)}
                          disabled={busy || readOnly}
                          className="rounded-[8px] border border-danger/35 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-danger/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                        >
                          {busy ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PlanningPage
