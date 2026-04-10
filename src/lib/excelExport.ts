import * as XLSX from 'xlsx'

function cellText(value: unknown): string {
  if (value == null || value === '') return ''
  return String(value)
}

function formatCreatedAt(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function toDateValue(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const s = String(raw)
  const d = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return ''
  const dt = new Date(`${d}T12:00:00`)
  if (Number.isNaN(dt.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt)
}

function clientNomNested(row: Record<string, unknown>): string {
  const nested = row.clients as { nom?: string } | null | undefined
  if (nested && typeof nested.nom === 'string' && nested.nom.trim()) return nested.nom
  return ''
}

function chantierTitreNested(row: Record<string, unknown>): string {
  const nested = row.chantiers as { titre?: string; nom?: string } | null | undefined
  if (nested) {
    const t = nested.titre ?? nested.nom
    if (typeof t === 'string' && t.trim()) return t
  }
  return ''
}

const stamp = () => new Date().toISOString().slice(0, 10)

/** Colonnes : nom, entreprise, email, téléphone, date création */
export function exportClientsToExcel(clients: Record<string, unknown>[]): void {
  if (clients.length === 0) return
  const rows = clients.map((row) => ({
    Nom: cellText(row.nom),
    Entreprise: cellText(row.entreprise),
    Email: cellText(row.email),
    Téléphone: cellText(row.telephone),
    'Date création': formatCreatedAt(row.created_at),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clients')
  XLSX.writeFile(wb, `clients-${stamp()}.xlsx`)
}

/** Colonnes : titre, client, statut, responsable, date début, date fin */
export function exportChantiersToExcel(chantiers: Record<string, unknown>[]): void {
  if (chantiers.length === 0) return
  const rows = chantiers.map((row) => ({
    Titre: cellText(row.titre ?? row.nom),
    Client: clientNomNested(row),
    Statut: cellText(row.statut),
    Responsable: cellText(row.responsable),
    'Date début': toDateValue(row.date_debut ?? row.debut),
    'Date fin': toDateValue(row.date_fin ?? row.echeance ?? row.fin),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Chantiers')
  XLSX.writeFile(wb, `chantiers-${stamp()}.xlsx`)
}

/** Colonnes : client, chantier, montant, statut, date */
export function exportPaiementsToExcel(paiements: Record<string, unknown>[]): void {
  if (paiements.length === 0) return
  const rows = paiements.map((row) => {
    const m = Number(row.montant)
    return {
      Client: clientNomNested(row),
      Chantier: chantierTitreNested(row),
      Montant: Number.isFinite(m) ? m : '',
      Statut: cellText(row.statut),
      Date: toDateValue(row.date_paiement ?? row.date),
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Paiements')
  XLSX.writeFile(wb, `paiements-${stamp()}.xlsx`)
}
