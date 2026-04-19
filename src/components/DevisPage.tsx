/**
 * Données chargées via `useDevis()` (lib/useSupabaseData) avec jointures clients / chantiers.
 */
import { useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Plus, Search, Trash2, Wand2 } from 'lucide-react'
import { useNetworkStatus } from '../lib/networkStatus'
import { exportDevisToPdf } from '../lib/pdfExport'
import { supabase } from '../lib/supabase'
import { createFactureFromDevisRow } from './FactureForm'
import { devisRowToEditPayload, type DevisEditPayload } from './DevisForm'

/** Devis prêts à être facturés : Envoyé, Signé, ou Accepté (équivalent « signé »). */
function canConvertDevisStatut(raw: unknown): boolean {
  const k = String(raw ?? '')
    .trim()
    .toLowerCase()
  return k === 'envoye' || k === 'signe' || k === 'accepte'
}

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

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

/** Date fin de validité = date_emission + validite_jours */
function dateExpiration(row: Record<string, unknown>): string {
  const em = String(row.date_emission ?? '').slice(0, 10)
  const j = Number(row.validite_jours)
  const days = Number.isFinite(j) && j > 0 ? Math.floor(j) : 30
  if (!/^\d{4}-\d{2}-\d{2}$/.test(em)) return '—'
  const d = new Date(`${em}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function isExpired(row: Record<string, unknown>): boolean {
  const exp = dateExpiration(row)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp)) return false
  const today = new Date().toISOString().slice(0, 10)
  return exp < today
}

type StatutBadge = { label: string; className: string }

function statutBadgeForRow(row: Record<string, unknown>): StatutBadge {
  const raw = String(row.statut ?? 'brouillon').trim().toLowerCase()
  const st = raw.normalize('NFD').replace(/\p{M}/gu, '')

  if (st === 'refuse') {
    return { label: 'Refusé', className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/35' }
  }
  if (st === 'signe' || st === 'accepte') {
    return { label: st === 'signe' ? 'Signé' : 'Accepté', className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35' }
  }
  if (st === 'envoye' && isExpired(row)) {
    return { label: 'Expiré', className: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/35' }
  }
  if (st === 'envoye') {
    return { label: 'Envoyé', className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/35' }
  }
  if (st === 'brouillon') {
    return { label: 'Brouillon', className: 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/35' }
  }
  if (st === 'annule') {
    return { label: 'Annulé', className: 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/35' }
  }
  return { label: cellText(row.statut), className: 'bg-zinc-500/20 text-zinc-300 ring-1 ring-zinc-500/35' }
}

type Materiau = {
  ref: string
  nom: string
  categorie: 'Structure' | 'Filtration' | 'Finition' | 'Électricité'
  unite: string
  prixHt: number
  fournisseur: string
}

const MOCK_MATERIAUX: Materiau[] = [
  {
    ref: 'LIN-ARM-150',
    nom: 'Liner PVC armé 150/100 bleu',
    categorie: 'Finition',
    unite: 'm²',
    prixHt: 42.5,
    fournisseur: 'Renolit Aquatic',
  },
  {
    ref: 'POM-FIL-1CV',
    nom: 'Pompe filtration vitesse variable 1 CV',
    categorie: 'Filtration',
    unite: 'u',
    prixHt: 890,
    fournisseur: 'Hayward',
  },
  {
    ref: 'STR-BET-8',
    nom: 'Structure béton armé 8×4 m',
    categorie: 'Structure',
    unite: 'forfait',
    prixHt: 12400,
    fournisseur: 'Béton Pro Sud',
  },
  {
    ref: 'ELEC-LED-RGB',
    nom: 'Projecteur LED RGB 35W + niche',
    categorie: 'Électricité',
    unite: 'u',
    prixHt: 285,
    fournisseur: 'Astral',
  },
  {
    ref: 'FIL-SABLE-24',
    nom: 'Filtre à sable 24 m³/h + vanne',
    categorie: 'Filtration',
    unite: 'u',
    prixHt: 1120,
    fournisseur: 'Pentair',
  },
  {
    ref: 'FIN-MARG-PRC',
    nom: 'Margelle pierre reconstituée 50 cm',
    categorie: 'Finition',
    unite: 'ml',
    prixHt: 78,
    fournisseur: 'StonePool',
  },
  {
    ref: 'STR-COQ-8',
    nom: 'Coque polyester 8×4 fond plat',
    categorie: 'Structure',
    unite: 'u',
    prixHt: 8900,
    fournisseur: 'Waterair',
  },
  {
    ref: 'ELEC-ELEC-50',
    nom: 'Électrolyseur sel 50 m³',
    categorie: 'Électricité',
    unite: 'u',
    prixHt: 1890,
    fournisseur: 'Zodiac',
  },
]

const CAT_BADGE: Record<Materiau['categorie'], string> = {
  Structure: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/35',
  Filtration: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/35',
  Finition: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/35',
  Électricité: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/35',
}

type TabKey = 'ia' | 'catalogue' | 'mesdevis'

export function DevisPage(props: {
  devis: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditDevis: (d: DevisEditPayload) => void
  onNouveauDevis: () => void
  onApresConversionFacture?: () => void
  /** Navigation (ex. retour dashboard). */
  onNavigate?: (key: string) => void
}) {
  const { online } = useNetworkStatus()
  const readOnly = !online
  const [tab, setTab] = useState<TabKey>('ia')
  const [catQuery, setCatQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const materiauxFiltres = useMemo(() => {
    const q = catQuery.trim().toLowerCase()
    if (!q) return MOCK_MATERIAUX
    return MOCK_MATERIAUX.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.ref.toLowerCase().includes(q) ||
        m.categorie.toLowerCase().includes(q) ||
        m.fournisseur.toLowerCase().includes(q),
    )
  }, [catQuery])

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

  async function handleConvertirEnFacture(row: Record<string, unknown>) {
    const id = row.id != null ? String(row.id) : ''
    if (!id) return
    setConvertingId(id)
    const result = await createFactureFromDevisRow(row)
    setConvertingId(null)
    if (!result.ok) {
      alert(result.message)
      return
    }
    props.onRefresh()
    props.onApresConversionFacture?.()
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'ia', label: 'Faire un Devis IA' },
    { key: 'catalogue', label: 'Catalogue Matériaux' },
    { key: 'mesdevis', label: 'Mes Devis' },
  ]

  return (
    <section aria-label="Devis et matériaux piscines" className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => props.onNavigate?.('dashboard')}
          className="flex w-fit items-center gap-2 rounded-[8px] text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          ← Retour Dashboard
        </button>
      </div>

      {/* Tabs pill */}
      <div
        className="inline-flex max-w-full flex-wrap rounded-[10px] bg-[#0a0a0a] p-1"
        role="tablist"
        aria-label="Sections devis"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={[
              'rounded-[8px] px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
              tab === key ? 'bg-black text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-400',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab IA */}
      {tab === 'ia' ? (
        <div className="rounded-[16px] border border-[rgba(59,130,246,0.12)] bg-[#0e1e35] p-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-purple-600/30 to-blue-600/25">
              <Wand2 className="h-6 w-6 text-violet-300" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-['Syne',sans-serif] text-lg font-bold text-white">Générateur de Devis IA</h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Décrivez le projet en langage naturel : l’assistant structure les lignes, applique votre catalogue
                matériaux et propose un montant cohérent avec vos marges habituelles.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center py-6 text-center">
            <div
              className="grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] shadow-[0_0_30px_rgba(124,58,237,0.4)]"
              aria-hidden
            >
              <Wand2 className="h-9 w-9 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="mt-8 font-['Syne',sans-serif] text-xl font-semibold text-white">Créer un devis intelligent</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
              Importez un plan ou dictez les dimensions : génération des postes, TVA et validité en quelques secondes.
            </p>
            <button
              type="button"
              className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.45)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-violet-400/60 active:scale-[0.98]"
            >
              <Wand2 className="h-4 w-4" strokeWidth={2} />
              Commencer le devis IA
            </button>
          </div>
        </div>
      ) : null}

      {/* Tab Catalogue */}
      {tab === 'catalogue' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
              <input
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Rechercher un matériau, une référence…"
                className="h-11 w-full rounded-[10px] border border-[rgba(59,130,246,0.15)] bg-[#0e1e35] py-2 pl-10 pr-3 text-sm text-text outline-none placeholder:text-zinc-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/25"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-primary/40 bg-primary/15 px-4 text-sm font-semibold text-text outline-none transition hover:bg-primary/25 focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              + Ajouter matériau
            </button>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[rgba(59,130,246,0.12)]">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead className="bg-black/40 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Référence</th>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Catégorie</th>
                  <th className="px-3 py-3">Unité</th>
                  <th className="px-3 py-3 text-right">Prix unitaire HT</th>
                  <th className="px-3 py-3">Fournisseur</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materiauxFiltres.map((m, i) => (
                  <tr
                    key={m.ref}
                    className={[
                      'border-t border-[rgba(59,130,246,0.08)] transition hover:bg-white/[0.03]',
                      i % 2 === 0 ? 'bg-[#0a1628]/50' : 'bg-[#0e1e35]/40',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-zinc-400">{m.ref}</td>
                    <td className="px-3 py-3 font-medium text-text">{m.nom}</td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          CAT_BADGE[m.categorie],
                        ].join(' ')}
                      >
                        {m.categorie}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{m.unite}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-text">{eur.format(m.prixHt)}</td>
                    <td className="px-3 py-3 text-zinc-500">{m.fournisseur}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-[8px] p-2 text-zinc-500 outline-none hover:bg-white/5 hover:text-text"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-[8px] p-2 text-zinc-500 outline-none hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Tab Mes Devis — données Supabase */}
      {tab === 'mesdevis' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={props.onNouveauDevis}
              disabled={readOnly}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              + Nouveau Devis
            </button>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[rgba(59,130,246,0.12)]">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-black/40 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-3">N° Devis</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Type projet</th>
                  <th className="px-3 py-3 text-right">Montant TTC</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Date envoi</th>
                  <th className="px-3 py-3">Date expiration</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {props.loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                      Chargement…
                    </td>
                  </tr>
                ) : props.devis.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                      Aucun devis pour le moment. Créez-en un avec « + Nouveau Devis ».
                    </td>
                  </tr>
                ) : (
                  props.devis.map((row, idx) => {
                    const id = row.id != null ? String(row.id) : `row-${idx}`
                    const editPayload = toEditPayload(row)
                    const busy = deletingId === id || convertingId === id
                    const ttc = Number(row.montant_ttc)
                    const num = String(row.numero ?? '').trim()
                    const showConvert = canConvertDevisStatut(row.statut)
                    const badge = statutBadgeForRow(row)
                    const typeProjet = chantierTitre(row) !== '—' ? chantierTitre(row) : 'Projet piscine'

                    return (
                      <tr
                        key={id}
                        className={[
                          'border-t border-[rgba(59,130,246,0.08)] hover:bg-white/[0.03]',
                          idx % 2 === 0 ? 'bg-[#0a1628]/40' : 'bg-[#0e1e35]/30',
                        ].join(' ')}
                      >
                        <td className="px-3 py-3 align-top font-mono text-xs text-zinc-300">{num || '—'}</td>
                        <td className="px-3 py-3 align-top font-medium text-text">{clientNom(row)}</td>
                        <td className="px-3 py-3 align-top text-zinc-400">{typeProjet}</td>
                        <td className="px-3 py-3 align-top text-right tabular-nums text-text">
                          {Number.isFinite(ttc) ? eur.format(ttc) : '—'}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top tabular-nums text-zinc-400">{formatDate(row.date_emission)}</td>
                        <td className="px-3 py-3 align-top tabular-nums text-zinc-400">{formatDate(dateExpiration(row))}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            {showConvert ? (
                              <button
                                type="button"
                                onClick={() => void handleConvertirEnFacture(row)}
                                disabled={busy || readOnly}
                                className="rounded-[8px] border border-accent/35 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                              >
                                {convertingId === id ? 'Conversion…' : 'Convertir en facture'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => exportDevisToPdf(row)}
                              disabled={busy}
                              className="rounded-[8px] border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => editPayload && props.onEditDevis(editPayload)}
                              disabled={!editPayload || busy || readOnly}
                              className="rounded-[8px] border border-[rgba(59,130,246,0.2)] bg-black/30 px-3 py-1.5 text-xs font-semibold text-text outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
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
        </div>
      ) : null}
    </section>
  )
}
