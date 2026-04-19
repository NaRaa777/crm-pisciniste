import { useState } from 'react'
import { ArrowLeft, Calendar, Clock, Eye, MapPin } from 'lucide-react'
import type { ChantierEditPayload } from './ChantierForm'
import { TimelineModal } from './TimelineModal'

export type ChantiersPageProps = {
  chantiers: Record<string, unknown>[]
  loading: boolean
  onRefresh: () => void
  onEditChantier: (chantier: ChantierEditPayload) => void
  onAddChantier: () => void
  onNavigate?: (key: string) => void
}

type TabKey = 'liste' | 'timeline' | 'photos'

type MockStatut = 'en_cours' | 'planifie'

type MockChantier = {
  id: string
  titre: string
  client: string
  montantEur: number
  statut: MockStatut
  equipe: string
  adresse: string
  dateDebut: string
  dateFin: string
  etapeActuelle: string
  pct: number
  etapesDone: number
  etapesTotal: number
}

const MOCK_CHANTIERS: MockChantier[] = [
  {
    id: 'mock-1',
    titre: 'Piscine coque 8x4m',
    client: 'Famille Martin',
    montantEur: 45_000,
    statut: 'en_cours',
    equipe: 'Équipe 1',
    adresse: '123 Rue de la Paix 75001 Paris',
    dateDebut: '15/01/2024',
    dateFin: '15/03/2024',
    etapeActuelle: 'Étanchéité',
    pct: 65,
    etapesDone: 4,
    etapesTotal: 9,
  },
  {
    id: 'mock-2',
    titre: 'Piscine béton 12x6m',
    client: 'M. Dubois',
    montantEur: 68_500,
    statut: 'planifie',
    equipe: 'Équipe 2',
    adresse: '456 Avenue des Champs 92200 Neuilly',
    dateDebut: '03/07/2024',
    dateFin: '03/09/2024',
    etapeActuelle: 'Terrassement',
    pct: 0,
    etapesDone: 0,
    etapesTotal: 9,
  },
]

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

function mockToTimelineRow(m: MockChantier): Record<string, unknown> {
  return {
    id: m.id,
    titre: `${m.titre} - ${m.client}`,
    nom: m.titre,
    adresse: m.adresse,
    responsable: m.equipe,
    montant_budget: m.montantEur,
    clients: { nom: m.client },
  }
}

export function ChantiersPage(props: ChantiersPageProps) {
  void props.chantiers
  void props.loading
  void props.onRefresh
  void props.onEditChantier

  const [tab, setTab] = useState<TabKey>('liste')
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineChantier, setTimelineChantier] = useState<Record<string, unknown> | null>(null)

  function openTimeline(m: MockChantier) {
    setTimelineChantier(mockToTimelineRow(m))
    setTimelineOpen(true)
  }

  function closeTimeline() {
    setTimelineOpen(false)
    setTimelineChantier(null)
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'liste', label: 'Liste des Chantiers' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'photos', label: 'Photos' },
  ]

  return (
    <section aria-label="Suivi des chantiers" className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => props.onNavigate?.('dashboard')}
            className="flex w-fit items-center gap-2 rounded-[8px] text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            ← Retour Dashboard
          </button>
          <button
            type="button"
            onClick={props.onAddChantier}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#2563eb] to-[#0891b2] px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.98]"
          >
            + Nouveau Chantier
          </button>
        </div>
      </div>

      {/* Tabs — même barre que DevisPage */}
      <div
        className="inline-flex max-w-full flex-wrap rounded-[10px] bg-[#0a0a0a] p-1"
        role="tablist"
        aria-label="Vues chantiers"
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

      {tab === 'liste' ? (
        <div className="grid gap-6 md:grid-cols-2">
          {MOCK_CHANTIERS.map((m) => (
            <article
              key={m.id}
              className="flex flex-col rounded-[16px] border border-[rgba(59,130,246,0.12)] bg-[#0e1e35] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-['Syne',sans-serif] text-[17px] font-semibold leading-snug text-white md:text-lg">
                  {m.titre} — {m.client}
                </h2>
                <div className="shrink-0 text-right">
                  <p className="font-['JetBrains_Mono',monospace] text-[22px] font-bold leading-none text-cyan-400">
                    {eur.format(m.montantEur)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{m.pct}%</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {m.statut === 'en_cours' ? (
                  <span className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/35">
                    En cours
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/35">
                    Planifié
                  </span>
                )}
                <span className="inline-flex rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 ring-1 ring-zinc-500/35">
                  {m.equipe}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-sm text-text-muted">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500/70" strokeWidth={2} />
                  <span>{m.adresse}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-cyan-500/70" strokeWidth={2} />
                  <span className="tabular-nums">
                    {m.dateDebut} – {m.dateFin}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-cyan-500/70" strokeWidth={2} />
                  <span>
                    Étape actuelle: <span className="font-medium text-text">{m.etapeActuelle}</span>
                  </span>
                </p>
              </div>

              <div className="mt-4">
                <div className="h-[5px] overflow-hidden rounded-[99px] bg-black/40">
                  <div
                    className="h-full rounded-[99px] shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    style={{
                      width: `${m.pct}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[rgba(59,130,246,0.08)] pt-5">
                <button
                  type="button"
                  onClick={() => openTimeline(m)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(59,130,246,0.2)] bg-black/20 px-4 py-2.5 text-sm font-semibold text-text outline-none transition hover:border-[rgba(59,130,246,0.45)] hover:shadow-[0_0_16px_rgba(59,130,246,0.25)] focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <Eye className="h-4 w-4 text-cyan-400/90" strokeWidth={2} />
                  Voir Timeline
                </button>
                <span className="text-sm tabular-nums text-text-muted">
                  {m.etapesDone}/{m.etapesTotal} étapes
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'timeline' ? (
        <div className="rounded-[16px] border border-[rgba(59,130,246,0.12)] bg-[#0e1e35] p-8 text-center text-sm text-text-muted">
          Vue <span className="font-medium text-text">Timeline</span> globale — à connecter aux données chantier.
        </div>
      ) : null}

      {tab === 'photos' ? (
        <div className="rounded-[16px] border border-[rgba(59,130,246,0.12)] bg-[#0e1e35] p-8 text-center text-sm text-text-muted">
          Galerie <span className="font-medium text-text">Photos</span> par chantier — bientôt disponible.
        </div>
      ) : null}

      <TimelineModal open={timelineOpen} onClose={closeTimeline} chantier={timelineChantier} />
    </section>
  )
}

export default ChantiersPage
