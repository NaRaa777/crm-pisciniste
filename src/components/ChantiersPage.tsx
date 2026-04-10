import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ChantierEditPayload } from './ChantierForm'

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

function clientNom(row: Record<string, unknown>): string {
  const nested = row.clients as { nom?: string } | null | undefined
  if (nested && typeof nested.nom === 'string' && nested.nom.trim()) return nested.nom
  return '—'
}

function clientIdFromRow(row: Record<string, unknown>): string {
  const raw = row.client_id ?? row.id_client
  return raw != null ? String(raw) : ''
}

export type ChantiersPageProps = {
  chantiers: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditChantier: (chantier: ChantierEditPayload) => void
  onAddChantier: () => void
}

export function ChantiersPage(props: ChantiersPageProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)

    const { error: errPay } = await supabase.from('paiements').delete().eq('chantier_id', id)
    if (errPay) {
      console.error(errPay)
      setDeletingId(null)
      alert(errPay.message || 'Impossible de supprimer les paiements liés.')
      return
    }

    const { error: errCh } = await supabase.from('chantiers').delete().eq('id', id)
    setDeletingId(null)
    if (errCh) {
      console.error(errCh)
      alert(errCh.message || 'Impossible de supprimer le chantier.')
      return
    }

    props.onRefresh()
  }

  function toEditPayload(row: Record<string, unknown>): ChantierEditPayload | null {
    const id = row.id != null ? String(row.id) : ''
    if (!id) return null
    const cid = clientIdFromRow(row)
    return {
      id,
      titre: String(row.titre ?? row.nom ?? ''),
      client_id: cid,
      statut: row.statut != null && String(row.statut) !== '' ? String(row.statut) : null,
      responsable: row.responsable != null && String(row.responsable) !== '' ? String(row.responsable) : null,
      date_debut: toDateInputValue(row.date_debut ?? row.debut) || null,
      date_fin: toDateInputValue(row.date_fin ?? row.echeance ?? row.fin) || null,
    }
  }

  return (
    <section
      aria-label="Liste des chantiers"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Chantiers</h1>
          <p className="mt-1 text-sm text-text-muted">Projets et chantiers (table Supabase).</p>
        </div>
        <button
          type="button"
          onClick={props.onAddChantier}
          className="h-10 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
        >
          Ajouter un chantier
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-border">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Date début</th>
              <th className="px-4 py-3">Date fin</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {props.loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Chargement…
                </td>
              </tr>
            ) : props.chantiers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Aucun chantier pour le moment.
                </td>
              </tr>
            ) : (
              props.chantiers.map((row, idx) => {
                const id = row.id != null ? String(row.id) : `row-${idx}`
                const editPayload = toEditPayload(row)
                const busy = deletingId === id

                return (
                  <tr key={id} className="bg-surface hover:bg-black-contrast/10">
                    <td className="px-4 py-3 font-medium text-text">{cellText(row.titre ?? row.nom)}</td>
                    <td className="px-4 py-3 text-text-muted">{clientNom(row)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.statut)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.responsable)}</td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">
                      {formatDateDisplay(row.date_debut ?? row.debut)}
                    </td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">
                      {formatDateDisplay(row.date_fin ?? row.echeance ?? row.fin)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editPayload && props.onEditChantier(editPayload)}
                          disabled={!editPayload || busy}
                          className="rounded-[8px] border border-border bg-black-contrast/20 px-3 py-1.5 text-xs font-semibold outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(id)}
                          disabled={busy}
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

export default ChantiersPage
