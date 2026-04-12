/**
 * Données chargées via `useDevis()` (lib/useSupabaseData) avec jointures clients / chantiers.
 */
import { useState } from 'react'
import { exportDevisToPdf } from '../lib/pdfExport'
import { supabase } from '../lib/supabase'
import { devisRowToEditPayload, type DevisEditPayload } from './DevisForm'

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  annule: 'Annulé',
}

function cellText(value: unknown): string {
  if (value == null || value === '') return '—'
  return String(value)
}

function formatDate(raw: unknown): string {
  const s = String(raw ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—'
  const d = new Date(`${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d)
}

function clientNom(row: Record<string, unknown>): string {
  const nested = row.clients as { nom?: string } | null | undefined
  if (nested && typeof nested.nom === 'string' && nested.nom.trim()) return nested.nom
  return '—'
}

function chantierTitre(row: Record<string, unknown>): string {
  const nested = row.chantiers as { titre?: string } | null | undefined
  if (nested && typeof nested.titre === 'string' && nested.titre.trim()) return nested.titre
  return '—'
}

function statutLabel(raw: unknown): string {
  const k = String(raw ?? 'brouillon').trim().toLowerCase()
  return STATUT_LABELS[k] ?? cellText(raw)
}

export function DevisPage(props: {
  devis: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditDevis: (d: DevisEditPayload) => void
  onNouveauDevis: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function toEditPayload(row: Record<string, unknown>): DevisEditPayload | null {
    return devisRowToEditPayload(row)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce devis ?')) return
    setDeletingId(id)
    const { error } = await supabase.from('devis').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      console.error(error)
      alert(error.message || 'Impossible de supprimer le devis.')
      return
    }
    props.onRefresh()
  }

  return (
    <section
      aria-label="Liste des devis"
      className="rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Devis</h1>
          <p className="mt-1 text-sm text-text-muted">Devis enregistrés (table Supabase « devis »).</p>
        </div>
        <button
          type="button"
          onClick={props.onNouveauDevis}
          className="h-10 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition duration-200 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
        >
          Nouveau devis
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-border">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-black-contrast/25 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-3 py-3">N°</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Chantier</th>
              <th className="px-3 py-3">Montant HT</th>
              <th className="px-3 py-3">Montant TTC</th>
              <th className="px-3 py-3">Date d’émission</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {props.loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  Chargement…
                </td>
              </tr>
            ) : props.devis.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  Aucun devis pour le moment.
                </td>
              </tr>
            ) : (
              props.devis.map((row, idx) => {
                const id = row.id != null ? String(row.id) : `row-${idx}`
                const editPayload = toEditPayload(row)
                const busy = deletingId === id
                const ht = Number(row.montant_ht)
                const ttc = Number(row.montant_ttc)
                const num = String(row.numero ?? '').trim()

                return (
                  <tr key={id} className="bg-surface hover:bg-black-contrast/10">
                    <td className="px-3 py-3 align-top font-mono text-xs text-text">{num || '—'}</td>
                    <td className="px-3 py-3 align-top font-medium text-text">{clientNom(row)}</td>
                    <td className="px-3 py-3 align-top text-text-muted">{chantierTitre(row)}</td>
                    <td className="px-3 py-3 align-top tabular-nums text-text">
                      {Number.isFinite(ht) ? eur.format(ht) : '—'}
                    </td>
                    <td className="px-3 py-3 align-top tabular-nums text-text">
                      {Number.isFinite(ttc) ? eur.format(ttc) : '—'}
                    </td>
                    <td className="px-3 py-3 align-top text-text-muted tabular-nums">{formatDate(row.date_emission)}</td>
                    <td className="px-3 py-3 align-top text-text-muted">{statutLabel(row.statut)}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => exportDevisToPdf(row)}
                          disabled={busy}
                          className="rounded-[8px] border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                        >
                          Exporter en PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => editPayload && props.onEditDevis(editPayload)}
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
