import { useEffect } from 'react'
import {
  Camera,
  CheckCircle2,
  Circle,
  Clipboard,
  Droplets,
  Euro,
  MapPin,
  Plus,
  User,
} from 'lucide-react'

export type TimelineStepMock = {
  id: string
  label: string
  description: string
  status: 'done' | 'current' | 'upcoming'
  /** ISO date YYYY-MM-DD si terminé */
  dateDone?: string
  /** Affiché à droite du titre */
  dateRight?: string
}

const MOCK_STEPS: TimelineStepMock[] = [
  {
    id: '1',
    label: 'Terrassement',
    description: 'Préparation du terrain et excavation.',
    status: 'done',
    dateDone: '2024-01-20',
    dateRight: '20 janv. 2024',
  },
  {
    id: '2',
    label: 'Radier',
    description: 'Coulage du béton de propreté.',
    status: 'done',
    dateDone: '2024-01-28',
    dateRight: '28 janv. 2024',
  },
  {
    id: '3',
    label: 'Ferraillage',
    description: 'Armatures et préparation structure.',
    status: 'done',
    dateDone: '2024-02-05',
    dateRight: '5 févr. 2024',
  },
  {
    id: '4',
    label: 'Coulage',
    description: 'Bétonnage des parois et fond.',
    status: 'current',
    dateRight: 'En cours',
  },
  {
    id: '5',
    label: 'Étanchéité',
    description: 'Traitement et contrôle étanchéité.',
    status: 'upcoming',
    dateRight: '—',
  },
  {
    id: '6',
    label: 'Pose liner',
    description: 'Installation et thermosoudure liner PVC.',
    status: 'upcoming',
    dateRight: '—',
  },
  {
    id: '7',
    label: 'Plomberie',
    description: 'Raccordements filtration et traitement.',
    status: 'upcoming',
    dateRight: '—',
  },
  {
    id: '8',
    label: 'Électricité',
    description: 'Projecteurs, électrolyseur, tableau.',
    status: 'upcoming',
    dateRight: '—',
  },
  {
    id: '9',
    label: 'Mise en eau',
    description: 'Remplissage, réglages et réception.',
    status: 'upcoming',
    dateRight: '—',
  },
]

/** 2 photos mock Terrassement */
const MOCK_PHOTOS_TERRASSEMENT = [
  {
    id: 'p1',
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop',
    stepLabel: 'Terrassement',
    date: '20/01/2024',
  },
  {
    id: 'p2',
    src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=600&fit=crop',
    stepLabel: 'Terrassement',
    date: '21/01/2024',
  },
] as const

function cellText(value: unknown): string {
  if (value == null || value === '') return '—'
  return String(value)
}

function clientNom(row: Record<string, unknown>): string {
  const nested = row.clients as { nom?: string } | null | undefined
  if (nested && typeof nested.nom === 'string' && nested.nom.trim()) return nested.nom
  return '—'
}

function formatDoneShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export type TimelineModalProps = {
  open: boolean
  onClose: () => void
  chantier: Record<string, unknown> | null
}

export function TimelineModal(props: TimelineModalProps) {
  const { open, onClose, chantier } = props

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !chantier) return null

  const titre = cellText(chantier.titre ?? chantier.nom) || 'Chantier'
  const client = clientNom(chantier)
  const adresse = cellText(chantier.adresse ?? chantier.ville ?? chantier.lieu)
  const montantRaw = chantier.montant_budget ?? chantier.budget ?? chantier.montant
  const montant =
    montantRaw != null && montantRaw !== ''
      ? typeof montantRaw === 'number'
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
            montantRaw,
          )
        : cellText(montantRaw)
      : '45 000 €'
  const equipe = cellText(chantier.responsable) !== '—' ? cellText(chantier.responsable) : 'Équipe terrain Sud'

  const progressionPct = 44

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation">
      <button
        type="button"
        aria-label="Fermer la modale"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-modal-title"
        className="relative z-[1] flex max-h-[90vh] w-full max-w-[90vw] flex-col overflow-hidden rounded-[20px] border border-[rgba(59,130,246,0.15)] bg-[#0a1628] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-[10px] text-zinc-400 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label="Fermer"
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div
            className="border-b border-[rgba(59,130,246,0.12)] px-6 pb-6 pt-6"
            style={{
              background: 'linear-gradient(180deg, #0d1f3c 0%, #0a1628 100%)',
            }}
          >
            <div className="flex flex-wrap items-start gap-3 pr-12">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-cyan-500/15">
                <Droplets className="h-7 w-7 text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="timeline-modal-title" className="font-['Syne',sans-serif] text-[20px] font-bold leading-tight text-white">
                  {titre}
                </h2>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
                  <span className="inline-flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0 text-cyan-500/80" strokeWidth={2} />
                    <span className="text-text">{client}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-cyan-500/80" strokeWidth={2} />
                    <span>{adresse}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Euro className="h-4 w-4 shrink-0 text-cyan-500/80" strokeWidth={2} />
                    <span className="tabular-nums text-text">{montant}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clipboard className="h-4 w-4 shrink-0 text-cyan-500/80" strokeWidth={2} />
                    <span>{equipe}</span>
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/35">
                    En cours
                  </span>
                  <span className="inline-flex rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 ring-1 ring-zinc-500/35">
                    {progressionPct}% terminé
                  </span>
                  <span className="inline-flex rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 ring-1 ring-zinc-500/35">
                    Coque 8×4m
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-text">Progression globale</span>
                    <span className="text-sm font-semibold tabular-nums text-cyan-400">{progressionPct}%</span>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${progressionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corps — 2 colonnes */}
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            {/* Colonne gauche — Timeline */}
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Timeline des étapes ({MOCK_STEPS.length})
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#059669] to-[#0d9488] px-4 py-2 text-xs font-semibold text-white shadow-md outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  + Ajouter une étape
                </button>
              </div>

              <ul className="space-y-3">
                {MOCK_STEPS.map((step) => {
                  const borderClass =
                    step.status === 'done'
                      ? 'border-l-[3px] border-l-emerald-500'
                      : step.status === 'current'
                        ? 'border-l-[3px] border-l-blue-500'
                        : 'border-l-[3px] border-l-zinc-600'

                  return (
                    <li
                      key={step.id}
                      className={`rounded-[10px] border border-[rgba(59,130,246,0.08)] bg-[rgba(255,255,255,0.02)] p-3 pl-3 ${borderClass}`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 pt-0.5">
                          {step.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                          ) : step.status === 'current' ? (
                            <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
                              <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-blue-500/50" />
                              <span className="relative h-3.5 w-3.5 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]" />
                            </span>
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-600" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-bold text-text">{step.label}</p>
                            <span className="shrink-0 text-xs tabular-nums text-zinc-500">{step.dateRight}</span>
                          </div>
                          <p className="mt-1 text-[12px] leading-snug text-text-muted">{step.description}</p>
                          {step.status === 'done' && step.dateDone ? (
                            <p className="mt-2 text-[11px] font-medium text-emerald-400/95">
                              Terminé le {formatDoneShort(step.dateDone)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Colonne droite — Photos */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Photos des étapes</h3>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_PHOTOS_TERRASSEMENT.map((ph) => (
                  <div
                    key={ph.id}
                    className="group relative aspect-square overflow-hidden rounded-[10px] border border-[rgba(59,130,246,0.12)] bg-black/30"
                  >
                    <img src={ph.src} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-8">
                      <p className="text-xs font-semibold text-white">{ph.stepLabel}</p>
                      <p className="text-[11px] tabular-nums text-zinc-300">{ph.date}</p>
                    </div>
                  </div>
                ))}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex aspect-square flex-col items-center justify-center rounded-[10px] border border-dashed border-[rgba(59,130,246,0.25)] bg-[rgba(255,255,255,0.03)]"
                  >
                    <Camera className="h-8 w-8 text-zinc-600" strokeWidth={1.25} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
