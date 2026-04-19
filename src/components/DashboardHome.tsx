import {
  Calendar,
  Droplets,
  FileText,
  Star,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CA_MENSUEL = [
  { mois: 'Jan', ca: 62_000 },
  { mois: 'Fév', ca: 71_000 },
  { mois: 'Mar', ca: 88_000 },
  { mois: 'Avr', ca: 79_000 },
  { mois: 'Mai', ca: 95_000 },
  { mois: 'Jun', ca: 91_000 },
]

const cardClass =
  'rounded-[16px] border border-[rgba(59,130,246,0.10)] bg-[#0e1e35] p-5'

export type DashboardHomeProps = {
  onVoirToutPiscines?: () => void
}

export function DashboardHome(props: DashboardHomeProps) {
  const { onVoirToutPiscines } = props

  return (
    <div className="space-y-6">
      {/* 3 colonnes haut */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card 1 — À signer */}
        <div className={`${cardClass} relative`}>
          <span className="absolute right-4 top-4 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-md">
            5
          </span>
          <div className="flex gap-3 pr-10">
            <div
              className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[10px] text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
            >
              <FileText className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-['Syne',sans-serif] text-base font-semibold text-white">À signer</h2>
              <p className="mt-0.5 text-[12px] text-text-muted">Devis en attente de signature</p>
            </div>
          </div>
          <ul className="mt-4 space-y-0 divide-y divide-white/[0.06] border-t border-white/[0.06] pt-3">
            <li className="flex items-start justify-between gap-2 py-2.5 first:pt-0">
              <div>
                <p className="text-sm font-bold text-text">Piscine 8×4m - Martin</p>
                <p className="mt-0.5 text-xs text-text-muted">€45,000</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                3j
              </span>
            </li>
            <li className="flex items-start justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-bold text-text">Rénovation - Dubois</p>
                <p className="mt-0.5 text-xs text-text-muted">€28,500</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                7j
              </span>
            </li>
            <li className="flex items-start justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-bold text-text">Coque 6×3m - Leclerc</p>
                <p className="mt-0.5 text-xs text-text-muted">€32,000</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                2j
              </span>
            </li>
          </ul>
        </div>

        {/* Card 2 — Chantiers du jour */}
        <div className={`${cardClass} relative`}>
          <span className="absolute right-4 top-4 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-md">
            3
          </span>
          <div className="flex gap-3 pr-10">
            <div
              className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[10px] text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #0369a1, #3b82f6)' }}
            >
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-['Syne',sans-serif] text-base font-semibold text-white">Chantiers du jour</h2>
            </div>
          </div>
          <ul className="mt-4 space-y-0 divide-y divide-white/[0.06] border-t border-white/[0.06] pt-3">
            <li className="space-y-2 py-2.5 first:pt-0">
              <p className="text-sm">
                <span className="font-bold text-text">Terrassement</span>{' '}
                <span className="text-text-muted">— Villa Martin</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/35">
                  09h00
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                  Équipe A
                </span>
              </div>
            </li>
            <li className="space-y-2 py-2.5">
              <p className="text-sm">
                <span className="font-bold text-text">Coulage béton</span>{' '}
                <span className="text-text-muted">— Dubois</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/35">
                  14h00
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                  Équipe B
                </span>
              </div>
            </li>
            <li className="space-y-2 py-2.5">
              <p className="text-sm">
                <span className="font-bold text-text">Mise en eau</span>{' '}
                <span className="text-text-muted">— Leclerc</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/35">
                  16h00
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                  Équipe C
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Card 3 — Relances */}
        <div className={`${cardClass} relative`}>
          <span className="absolute right-4 top-4 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-md">
            7
          </span>
          <div className="flex gap-3 pr-10">
            <div
              className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[10px] text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #b45309, #dc2626)' }}
            >
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-['Syne',sans-serif] text-base font-semibold text-white">Relances à faire</h2>
            </div>
          </div>
          <ul className="mt-4 space-y-0 divide-y divide-white/[0.06] border-t border-white/[0.06] pt-3">
            <li className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0">
              <span className="text-sm font-semibold text-text">Facture #2024-045</span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-300 ring-1 ring-red-500/35">
                Impayée
              </span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                15j
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="text-sm font-semibold text-text">Prospect Durand</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/35">
                Devis
              </span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                5j
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="text-sm font-semibold text-text">Facture #2024-042</span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-300 ring-1 ring-red-500/35">
                Impayée
              </span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/30">
                12j
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bas : 2/3 + 1/3 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Piscines Récents */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-400" strokeWidth={2} />
              <h2 className="font-['Syne',sans-serif] text-lg font-bold text-white">Piscines Récents</h2>
            </div>
            <button
              type="button"
              onClick={onVoirToutPiscines}
              className="rounded-[8px] px-3 py-1.5 text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-[12px] border border-[rgba(59,130,246,0.08)] bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="font-semibold text-text">Piscine 8×4m - Famille Martin</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/35">
                  En cours
                </span>
                <span className="text-text-muted">Neuilly</span>
                <span className="text-text-muted">15 mai</span>
                <span className="font-['JetBrains_Mono',monospace] font-bold text-cyan-400">€45,000</span>
                <span className="text-text-muted">
                  Martin <span className="font-semibold text-text">65%</span>
                </span>
              </div>
              <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-[99px] bg-gradient-to-r from-primary to-accent"
                  style={{ width: '65%', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }}
                />
              </div>
            </div>

            <div className="rounded-[12px] border border-[rgba(59,130,246,0.08)] bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="font-semibold text-text">Aménagement Paysager Complet</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/35">
                  Planifié
                </span>
                <span className="text-text-muted">Vincennes</span>
                <span className="text-text-muted">3 juillet</span>
                <span className="font-['JetBrains_Mono',monospace] font-bold text-cyan-400">€28,500</span>
                <span className="text-text-muted">Dubois</span>
              </div>
            </div>

            <div className="rounded-[12px] border border-[rgba(59,130,246,0.08)] bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="font-semibold text-text">Menuiserie Cuisine Sur-Mesure</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                  Terminé
                </span>
                <span className="text-text-muted">Boulogne</span>
                <span className="text-text-muted">12 juin</span>
                <span className="font-['JetBrains_Mono',monospace] font-bold text-cyan-400">€15,800</span>
                <span className="text-text-muted">Leclerc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-cyan-400" strokeWidth={2} />
            <h2 className="font-['Syne',sans-serif] text-lg font-bold text-white">Performance</h2>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CA_MENSUEL} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="mois"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(59,130,246,0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0e1e35',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => {
                    const n = typeof value === 'number' ? value : Number(value)
                    if (!Number.isFinite(n)) return ['—', 'CA']
                    return [
                      new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      }).format(n),
                      'CA',
                    ]
                  }}
                />
                <Bar dataKey="ca" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 space-y-3 border-t border-[rgba(59,130,246,0.1)] pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">CA mois</span>
              <span className="font-['JetBrains_Mono',monospace] text-lg font-bold text-white">€91 000</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Chantiers actifs</span>
              <span className="font-['JetBrains_Mono',monospace] text-lg font-bold text-white">12</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Taux conversion</span>
              <span className="font-['JetBrains_Mono',monospace] text-lg font-bold text-emerald-400">68%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
