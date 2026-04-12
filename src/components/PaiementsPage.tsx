import { useState } from 'react'
import { exportPaiementsToExcel } from '../lib/excelExport'
import { isPaymentReminderEligible, sendPaymentReminderEmail } from '../lib/emailReminder'
import { supabase } from '../lib/supabase'
import type { PaiementEditPayload } from './PaiementForm'

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

function formatMontant(raw: unknown): string {
  const n = Number(raw)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function clientNom(row: Record<string, unknown>): string {
  const nested = row.clients as { nom?: string } | null | undefined
  if (nested && typeof nested.nom === 'string' && nested.nom.trim()) return nested.nom
  return '—'
}

function chantierTitre(row: Record<string, unknown>): string {
  const nested = row.chantiers as { titre?: string; nom?: string } | null | undefined
  if (nested) {
    const t = nested.titre ?? nested.nom
    if (typeof t === 'string' && t.trim()) return t
  }
  return '—'
}

function clientEmail(row: Record<string, unknown>): string | null {
  const nested = row.clients as { email?: string } | null | undefined
  const e = nested?.email?.trim()
  return e || null
}

export type PaiementsPageProps = {
  paiements: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditPaiement: (p: PaiementEditPayload) => void
  onAddPaiement: () => void
}

export function PaiementsPage(props: PaiementsPageProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reminderId, setReminderId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from('paiements').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      console.error(error)
      alert(error.message || 'Impossible de supprimer le paiement.')
      return
    }
    props.onRefresh()
  }

  async function handleSendReminder(row: Record<string, unknown>, id: string) {
    const to = clientEmail(row)
    if (!to) {
      alert('Aucune adresse email pour ce client. Ajoute-la dans la fiche client.')
      return
    }
    const montant = Number(row.montant)
    const dateRaw = row.date_paiement ?? row.date
    const dateDisplay = formatDateDisplay(dateRaw)
    const dateFacturation = dateDisplay === '—' ? 'Non renseignée' : dateDisplay

    setReminderId(id)
    const result = await sendPaymentReminderEmail({
      to,
      chantierNom: chantierTitre(row),
      clientNom: clientNom(row),
      montantDu: Number.isFinite(montant) ? montant : 0,
      dateFacturation,
    })
    setReminderId(null)

    if (result.ok) {
      alert('Rappel envoyé.')
    } else {
      alert(result.error)
    }
  }

  function toEditPayload(row: Record<string, unknown>): PaiementEditPayload | null {
    const id = row.id != null ? String(row.id) : ''
    if (!id) return null
    const client_id = row.client_id != null ? String(row.client_id) : ''
    const chantier_id = row.chantier_id != null ? String(row.chantier_id) : ''
    const montant = Number(row.montant)
    return {
      id,
      client_id,
      chantier_id,
      montant: Number.isFinite(montant) ? montant : 0,
      statut: row.statut != null && String(row.statut) !== '' ? String(row.statut) : null,
      date_paiement: toDateInputValue(row.date_paiement ?? row.date) || null,
    }
  }

  return (
    <section
      aria-label="Liste des paiements"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Paiements</h1>
          <p className="mt-1 text-sm text-text-muted">Encaissements liés aux chantiers (table Supabase).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportPaiementsToExcel(props.paiements)}
            disabled={props.loading || props.paiements.length === 0}
            className="h-10 shrink-0 rounded-[10px] border border-primary/35 bg-primary/10 px-4 text-sm font-semibold text-text outline-none transition duration-200 ease-out hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Exporter Excel
          </button>
          <button
            type="button"
            onClick={props.onAddPaiement}
            className="h-10 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
          >
            Ajouter un paiement
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-border">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Chantier</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date paiement</th>
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
            ) : props.paiements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Aucun paiement pour le moment.
                </td>
              </tr>
            ) : (
              props.paiements.map((row, idx) => {
                const id = row.id != null ? String(row.id) : `row-${idx}`
                const editPayload = toEditPayload(row)
                const busy = deletingId === id
                const reminderBusy = reminderId === id
                const showReminder = isPaymentReminderEligible(row.statut)

                return (
                  <tr key={id} className="bg-surface hover:bg-black-contrast/10">
                    <td className="px-4 py-3 font-medium text-text">{clientNom(row)}</td>
                    <td className="px-4 py-3 text-text-muted">{chantierTitre(row)}</td>
                    <td className="px-4 py-3 text-text tabular-nums">{formatMontant(row.montant)}</td>
                    <td className="px-4 py-3 text-text-muted">{cellText(row.statut)}</td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">
                      {formatDateDisplay(row.date_paiement ?? row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {showReminder ? (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(row, id)}
                            disabled={busy || reminderBusy}
                            className="rounded-[8px] border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                          >
                            {reminderBusy ? 'Envoi…' : 'Envoyer un rappel'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => editPayload && props.onEditPaiement(editPayload)}
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

export default PaiementsPage
