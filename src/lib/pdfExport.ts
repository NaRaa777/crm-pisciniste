import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

function formatDatePdf(raw: unknown): string {
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

function safeFileSegment(s: string, maxLen = 48): string {
  return s
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, maxLen) || 'fichier'
}

/** PDF d’un devis : client, chantier, description, montants, TVA, dates, statut. */
export function exportDevisToPdf(row: Record<string, unknown>): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Devis', subject: 'Export CRM Perso' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 30, 30)
  doc.text('Devis', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('CRM Perso', 14, 25)
  doc.setTextColor(0, 0, 0)

  const ht = Number(row.montant_ht)
  const tvaRaw = row.tva != null && row.tva !== '' ? row.tva : (row as { tva_pct?: unknown }).tva_pct
  const tva = Number(tvaRaw)
  const ttc = Number(row.montant_ttc)
  const desc = String(row.description ?? '').trim() || '—'

  const body: string[][] = [
    ['Client', clientNom(row)],
    ['Chantier', chantierTitre(row)],
    ['Description', desc],
    ['Montant HT', Number.isFinite(ht) ? eur.format(ht) : '—'],
    ['TVA', Number.isFinite(tva) ? `${tva} %` : '—'],
    ['Montant TTC', Number.isFinite(ttc) ? eur.format(ttc) : '—'],
    ['Date d’émission', formatDatePdf(row.date_emission)],
    ['Statut', statutLabel(row.statut)],
  ]

  autoTable(doc, {
    startY: 32,
    theme: 'striped',
    head: [['Champ', 'Valeur']],
    body,
    styles: {
      fontSize: 10,
      cellPadding: 3.5,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [45, 107, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  })

  const id = row.id != null ? String(row.id) : 'devis'
  const slug = safeFileSegment(clientNom(row))
  doc.save(`devis-${slug}-${id.slice(0, 8)}.pdf`)
}

/** PDF liste clients : nom, entreprise, email, téléphone. */
export function exportClientsListToPdf(clients: Record<string, unknown>[]): void {
  if (clients.length === 0) return

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Liste des clients', subject: 'Export CRM Perso' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Liste des clients', 14, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`CRM Perso — ${clients.length} client${clients.length > 1 ? 's' : ''}`, 14, 23)
  doc.setTextColor(0, 0, 0)

  const body = clients.map((row) => [
    cellText(row.nom),
    cellText(row.entreprise),
    cellText(row.email),
    cellText(row.telephone),
  ])

  autoTable(doc, {
    startY: 28,
    theme: 'striped',
    head: [['Nom', 'Entreprise', 'Email', 'Téléphone']],
    body,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [45, 107, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 48 },
      2: { cellWidth: 72 },
      3: { cellWidth: 38 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(130, 130, 130)
      doc.text(
        `Page ${data.pageNumber}`,
        data.doc.internal.pageSize.getWidth() - 14,
        data.doc.internal.pageSize.getHeight() - 8,
        { align: 'right' },
      )
      doc.setTextColor(0, 0, 0)
    },
  })

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`liste-clients-${stamp}.pdf`)
}
