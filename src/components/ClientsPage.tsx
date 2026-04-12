import { useState } from 'react'
import { useNetworkStatus } from '../lib/networkStatus'
import { exportClientsToExcel } from '../lib/excelExport'
import { exportClientsListToPdf } from '../lib/pdfExport'
import { supabase } from '../lib/supabase'
import type { ClientEditPayload } from './ClientForm'

function formatCreatedAt(raw: unknown): string {
  if (raw == null || raw === '') return '—'
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function cellText(value: unknown): string {
  if (value == null || value === '') return '—'
  return String(value)
}

export function ClientsPage(props: {
  clients: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditClient: (client: ClientEditPayload) => void
}) {
  const { online } = useNetworkStatus()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const readOnly = !online

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('facturation').delete().eq('client_id', id)
    await supabase.from('chantiers').delete().eq('client_id', id)
    const { error } = await supabase.from('clients').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      console.error(error)
      alert(error.message || 'Impossible de supprimer le client.')
      return
    }
    props.onRefresh()
  }

  function toEditPayload(row: Record<string, unknown>): ClientEditPayload | null {
    const id = row.id != null ? String(row.id) : ''
    if (!id) return null
    return {
      id,
      nom: String(row.nom ?? ''),
      entreprise: row.entreprise != null && row.entreprise !== '' ? String(row.entreprise) : null,
      email: row.email != null && row.email !== '' ? String(row.email) : null,
      telephone: row.telephone != null && row.telephone !== '' ? String(row.telephone) : null,
    }
  }

  return (
    <section
      aria-label="Liste des clients"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-text-muted">Tous les contacts enregistrés dans Supabase.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportClientsListToPdf(props.clients)}
            disabled={props.loading || props.clients.length === 0}
            className="h-10 shrink-0 rounded-[10px] border border-primary/35 bg-primary/10 px-4 text-sm font-semibold text-text outline-none transition duration-200 ease-out hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Exporter la liste
          </button>
          <button
            type="button"
            onClick={() => exportClientsToExcel(props.clients)}
            disabled={props.loading || props.clients.length === 0}
            className="h-10 shrink-0 rounded-[10px] border border-primary/35 bg-primary/10 px-4 text-sm font-semibold text-text outline-none transition duration-200 ease-out hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Exporter Excel
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Date de création</th>
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
            ) : props.clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Aucun client pour le moment.
                </td>
              </tr>
            ) : (
              props.clients.map((row, idx) => {
                const id = row.id != null ? String(row.id) : `row-${idx}`
                const editPayload = toEditPayload(row)
                const busy = deletingId === id

                return (
                  <tr key={id} className="bg-surface hover:bg-black-contrast/10">
                    <td className="px-4 py-3 font-medium text-text">{cellText(row.nom)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.entreprise)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.email)}</td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">{cellText(row.telephone)}</td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">{formatCreatedAt(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editPayload && props.onEditClient(editPayload)}
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
