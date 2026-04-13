import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatMontantPdf(montant: number): string {
  return montant.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €'
}

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

const FACTURE_STATUT_LABELS: Record<string, string> = {
  'en attente': 'En attente',
  'payée': 'Payée',
  'en retard': 'En retard',
}

function factureStatutLabel(raw: unknown): string {
  const s = String(raw ?? 'En attente').trim()
  const k = s.toLowerCase()
  return FACTURE_STATUT_LABELS[k] ?? s
}

function safeFileSegment(s: string, maxLen = 48): string {
  return s
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, maxLen) || 'fichier'
}

type EntreprisePdf = {
  nom?: string
  adresse?: string
  email?: string
  telephone?: string
  siret?: string
}

type LignePdf = {
  description?: string
  quantite?: number
  prix_unitaire_ht?: number
  tva_pct?: number
  total_ht?: number
}

function parseEntreprisePdf(raw: unknown): EntreprisePdf {
  if (!raw || typeof raw !== 'object') return {}
  return raw as EntreprisePdf
}

function parseLignesPdf(row: Record<string, unknown>): LignePdf[] {
  const raw = row.lignes
  if (raw != null && Array.isArray(raw) && raw.length > 0) {
    return raw as LignePdf[]
  }
  const ht = Number(row.montant_ht)
  const tva = Number(row.tva != null ? row.tva : (row as { tva_pct?: unknown }).tva_pct)
  return [
    {
      description: String(row.description ?? 'Prestation'),
      quantite: 1,
      prix_unitaire_ht: Number.isFinite(ht) ? ht : 0,
      tva_pct: [0, 10, 20].includes(tva) ? tva : 20,
      total_ht: Number.isFinite(ht) ? ht : 0,
    },
  ]
}

function lineHtPdf(l: LignePdf): number {
  if (l.total_ht != null && Number.isFinite(Number(l.total_ht))) return Number(l.total_ht)
  const q = Number(l.quantite)
  const pu = Number(l.prix_unitaire_ht)
  if (Number.isFinite(q) && Number.isFinite(pu)) return Math.round(q * pu * 100) / 100
  return 0
}

function clientBlock(row: Record<string, unknown>): string[] {
  const c = row.clients as {
    nom?: string
    entreprise?: string
    email?: string
    telephone?: string
  } | null
  const lines: string[] = []
  if (c?.nom?.trim()) lines.push(c.nom.trim())
  if (c?.entreprise?.trim()) lines.push(c.entreprise.trim())
  if (c?.email?.trim()) lines.push(`Email : ${c.email.trim()}`)
  if (c?.telephone?.trim()) lines.push(`Tél. : ${c.telephone.trim()}`)
  return lines.length ? lines : ['—']
}

type QuotePdfKind = 'devis' | 'facture'

function exportQuoteLikePdf(
  row: Record<string, unknown>,
  kind: QuotePdfKind,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const ent = parseEntreprisePdf(row.entreprise_info)
  const numero = String(row.numero ?? '').trim() || '—'
  const dateEmis = formatDatePdf(row.date_emission)
  const lignes = parseLignesPdf(row)

  const headline = kind === 'facture' ? 'FACTURE' : 'DEVIS'
  const docWord = kind === 'facture' ? 'Facture' : 'Devis'
  const statutFn = kind === 'facture' ? factureStatutLabel : statutLabel

  doc.setProperties({
    title: `${docWord} ${numero}`,
    subject: 'Export Wevio',
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(25, 25, 25)
  const companyName = ent.nom?.trim() || 'Votre entreprise'
  doc.text(companyName, margin, 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(35, 35, 35)
  doc.text(headline, pageW - margin, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`N° ${numero}`, pageW - margin, 26, { align: 'right' })

  const entLines = [ent.adresse, ent.email ? `Email : ${ent.email}` : '', ent.telephone ? `Tél. : ${ent.telephone}` : '', ent.siret ? `SIRET : ${ent.siret}` : '']
    .map((s) => s?.trim())
    .filter(Boolean) as string[]

  const blockTop = 36
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  const colW = (pageW - 2 * margin - 10) / 2
  doc.setFont('helvetica', 'bold')
  doc.text('Émetteur', margin, blockTop)
  doc.text('Client', margin + colW + 10, blockTop)
  doc.setFont('helvetica', 'normal')
  let yL = blockTop + 5
  const emitLines = [companyName, ...entLines]
  const clientLines = clientBlock(row)
  const maxRows = Math.max(emitLines.length, clientLines.length)
  for (let i = 0; i < maxRows; i++) {
    const left = emitLines[i] ?? ''
    const right = clientLines[i] ?? ''
    doc.setFontSize(8.5)
    doc.setTextColor(45, 45, 45)
    if (left) doc.text(left, margin, yL)
    if (right) doc.text(right, margin + colW + 10, yL)
    yL += 4.5
  }

  const chant = chantierTitre(row)
  if (chant && chant !== '—') {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Chantier / réf. : ${chant}`, margin, yL + 2)
    yL += 6
  } else {
    yL += 4
  }

  const tableBody = lignes.map((l) => {
    const th = lineHtPdf(l)
    const q = Number(l.quantite) || 0
    const pu = Number(l.prix_unitaire_ht) || 0
    const tva = Number(l.tva_pct)
    const tvaStr = [0, 10, 20].includes(tva) ? `${tva} %` : `${cellText(l.tva_pct)} %`
    return [
      cellText(l.description),
      String(q),
      formatMontantPdf(Number.isFinite(pu) ? pu : 0),
      tvaStr,
      formatMontantPdf(th),
    ]
  })

  autoTable(doc, {
    startY: yL + 4,
    head: [['Description', 'Qté', 'Prix HT', 'TVA', 'Total HT']],
    body: tableBody,
    theme: 'striped',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [45, 90, 200],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yL + 40

  const ht = Number(row.montant_ht)
  const ttc = Number(row.montant_ttc)
  const tvaMontant = Number.isFinite(ht) && Number.isFinite(ttc) ? Math.round((ttc - ht) * 100) / 100 : 0

  const totauxX = pageW - margin - 72
  let ty = finalY + 8
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)
  doc.text('Sous-total HT', totauxX, ty)
  doc.text(Number.isFinite(ht) ? formatMontantPdf(ht) : '—', pageW - margin, ty, { align: 'right' })
  ty += 6
  doc.text('TVA', totauxX, ty)
  doc.text(Number.isFinite(tvaMontant) ? formatMontantPdf(tvaMontant) : '—', pageW - margin, ty, { align: 'right' })
  ty += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Total TTC', totauxX, ty)
  doc.text(Number.isFinite(ttc) ? formatMontantPdf(ttc) : '—', pageW - margin, ty, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  ty += 12
  const validite = row.validite_jours != null && row.validite_jours !== '' ? Number(row.validite_jours) : 30
  const dateEcheance = formatDatePdf(row.date_echeance)
  const conditions = String(row.conditions ?? '').trim()
  doc.setFontSize(8.5)
  doc.setTextColor(40, 40, 40)
  doc.setFont('helvetica', 'bold')
  doc.text('Conditions', margin, ty)
  doc.setFont('helvetica', 'normal')
  ty += 5
  const condParts =
    kind === 'devis'
      ? [
          Number.isFinite(validite) && validite > 0
            ? `Validité du devis : ${validite} jour(s) à compter de la date d’émission.`
            : '',
          conditions,
          `Statut : ${statutFn(row.statut)}`,
        ]
      : [
          dateEcheance !== '—' ? `Date d’échéance : ${dateEcheance}` : '',
          conditions,
          `Statut : ${statutFn(row.statut)}`,
        ]
  const condLines = doc.splitTextToSize(condParts.filter(Boolean).join('\n\n'), pageW - 2 * margin)
  doc.text(condLines, margin, ty)
  ty += condLines.length * 4 + 8

  const footY = Math.min(ty + 6, doc.internal.pageSize.getHeight() - 12)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(`${docWord} ${numero} · émis le ${dateEmis}`, margin, footY)
  doc.text('Wevio', pageW - margin, footY, { align: 'right' })

  const id = row.id != null ? String(row.id) : kind
  const slug = safeFileSegment(clientNom(row))
  const prefix = kind === 'facture' ? 'facture' : 'devis'
  doc.save(`${prefix}-${slug}-${numero.replace(/[^a-zA-Z0-9-]/g, '') || id.slice(0, 8)}.pdf`)
}

/** PDF devis professionnel : en-tête, lignes, totaux, conditions, pied de page. */
export function exportDevisToPdf(row: Record<string, unknown>): void {
  exportQuoteLikePdf(row, 'devis')
}

/** PDF facture : même mise en page que le devis, titre FACTURE. */
export function exportFactureToPdf(row: Record<string, unknown>): void {
  exportQuoteLikePdf(row, 'facture')
}

/** PDF liste clients : nom, entreprise, email, téléphone. */
export function exportClientsListToPdf(clients: Record<string, unknown>[]): void {
  if (clients.length === 0) return

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Liste des clients', subject: 'Export Wevio' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Liste des clients', 14, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`Wevio — ${clients.length} client${clients.length > 1 ? 's' : ''}`, 14, 23)
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
