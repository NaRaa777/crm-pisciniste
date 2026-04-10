import type {
  AnalyticsPeriod,
  PaymentStatus,
  PlanningStatus,
  Priority,
} from './types'

export const connectedUser = {
  name: 'Naraa Diallo',
  initials: 'ND',
}

export const kpis = [
  {
    id: 'prod-week',
    title: 'Productions cette semaine',
    value: 18,
    deltaPct: 6.3,
    format: 'number' as const,
  },
  {
    id: 'sites-active',
    title: 'Chantiers actifs',
    value: 7,
    deltaPct: 2.1,
    format: 'number' as const,
  },
  {
    id: 'payments-pending',
    title: 'Paiements en attente',
    value: 12400,
    deltaPct: -3.4,
    format: 'currency' as const,
  },
  {
    id: 'mrr-est',
    title: 'CA mensuel estimé',
    value: 48700,
    deltaPct: 8.9,
    format: 'currency' as const,
  },
]

export type PlanningTask = {
  id: string
  date: string // ISO date
  client: string
  title: string
  status: PlanningStatus
  owner: string
  notes: string
}

export const planningTasks: PlanningTask[] = [
  {
    id: 'pt-001',
    date: '2026-04-07',
    client: 'Studio Atlas',
    title: 'Pré-production vidéo (storyboard + tournage)',
    status: 'in_progress',
    owner: 'M. Traoré',
    notes:
      'Livrables attendus : planning tournage, liste matériel, brief équipe. Prochain point demain 10h.',
  },
  {
    id: 'pt-002',
    date: '2026-04-08',
    client: 'BTP Nova',
    title: 'Visite chantier + validation planning',
    status: 'planned',
    owner: 'Naraa Diallo',
    notes:
      'Préparer checklist sécurité + photos avant/après. Confirmer accès et contact sur place.',
  },
  {
    id: 'pt-003',
    date: '2026-04-06',
    client: 'Retail Zen',
    title: 'Livraison assets signalétique',
    status: 'late',
    owner: 'A. Camara',
    notes:
      'Blocage : validation client en attente. Relancer par email + proposer version alternative.',
  },
  {
    id: 'pt-004',
    date: '2026-04-05',
    client: 'ImmoWest',
    title: 'Montage dossier technique',
    status: 'done',
    owner: 'Naraa Diallo',
    notes: 'Dossier validé. Archiver sur drive + notifier le client.',
  },
  {
    id: 'pt-005',
    date: '2026-04-09',
    client: 'Atelier Lumen',
    title: 'Fabrication pièces sur-mesure (lot 2)',
    status: 'planned',
    owner: 'M. Traoré',
    notes: 'Contrôler dimensions finales avant découpe. Prévoir marge de tolérance +2mm.',
  },
]

export type SiteRow = {
  id: string
  name: string
  client: string
  progress: number
  dueDate: string // ISO date
  priority: Priority
  owner: string
}

export const sites: SiteRow[] = [
  {
    id: 'st-001',
    name: 'Rénovation Plateau A',
    client: 'BTP Nova',
    progress: 72,
    dueDate: '2026-04-07',
    priority: 'high',
    owner: 'Naraa Diallo',
  },
  {
    id: 'st-002',
    name: 'Signalétique Site B',
    client: 'ImmoWest',
    progress: 45,
    dueDate: '2026-04-20',
    priority: 'medium',
    owner: 'M. Traoré',
  },
  {
    id: 'st-003',
    name: 'Aménagement open-space',
    client: 'Retail Zen',
    progress: 88,
    dueDate: '2026-04-12',
    priority: 'low',
    owner: 'A. Camara',
  },
  {
    id: 'st-004',
    name: 'Cuisine pro — phase 2',
    client: 'Atelier Lumen',
    progress: 33,
    dueDate: '2026-04-18',
    priority: 'medium',
    owner: 'Naraa Diallo',
  },
]

export type TransactionRow = {
  id: string
  label: string
  amount: number
  status: PaymentStatus
  date: string // ISO date
}

export const transactions: TransactionRow[] = [
  {
    id: 'F-2401',
    label: 'Facture #F-2401 — Studio Atlas',
    amount: 5200,
    status: 'paid',
    date: '2026-04-02',
  },
  {
    id: 'F-2402',
    label: 'Facture #F-2402 — BTP Nova',
    amount: 3800,
    status: 'partial',
    date: '2026-04-03',
  },
  {
    id: 'F-2403',
    label: 'Facture #F-2403 — Retail Zen',
    amount: 2100,
    status: 'unpaid',
    date: '2026-04-04',
  },
  {
    id: 'F-2404',
    label: 'Facture #F-2404 — ImmoWest',
    amount: 7400,
    status: 'paid',
    date: '2026-04-05',
  },
  {
    id: 'F-2405',
    label: 'Facture #F-2405 — Atelier Lumen',
    amount: 1900,
    status: 'partial',
    date: '2026-04-06',
  },
]

export const paymentSummary = {
  collectedThisMonth: 36300,
  pending: 12400,
}

export const paymentStatusBreakdown: Record<PaymentStatus, number> = {
  paid: 58,
  partial: 24,
  unpaid: 18,
}

export type ProspectRow = {
  id: string
  name: string
  company: string
  source: string
  createdAt: string // ISO date
}

export const prospects: ProspectRow[] = [
  {
    id: 'pr-001',
    name: 'Lina Benali',
    company: 'Nova Logistics',
    source: 'Site web',
    createdAt: '2026-04-06',
  },
  {
    id: 'pr-002',
    name: 'Hugo Martin',
    company: 'Atelier 14',
    source: 'Recommandation',
    createdAt: '2026-04-05',
  },
  {
    id: 'pr-003',
    name: 'Sofia K.',
    company: 'Retail Zen',
    source: 'LinkedIn',
    createdAt: '2026-04-04',
  },
  {
    id: 'pr-004',
    name: 'Idriss N.',
    company: 'BTP Nova',
    source: 'Appel entrant',
    createdAt: '2026-04-03',
  },
  {
    id: 'pr-005',
    name: 'Camille R.',
    company: 'ImmoWest',
    source: 'Salon pro',
    createdAt: '2026-04-02',
  },
]

export const revenueByMonth = [
  { month: 'Nov', revenue: 31200 },
  { month: 'Déc', revenue: 33650 },
  { month: 'Jan', revenue: 36120 },
  { month: 'Fév', revenue: 40210 },
  { month: 'Mar', revenue: 44180 },
  { month: 'Avr', revenue: 48700 },
]

export const deliveriesVsLate = [
  { month: 'Nov', delivered: 6, late: 1 },
  { month: 'Déc', delivered: 7, late: 0 },
  { month: 'Jan', delivered: 8, late: 1 },
  { month: 'Fév', delivered: 9, late: 2 },
  { month: 'Mar', delivered: 10, late: 1 },
  { month: 'Avr', delivered: 5, late: 1 },
]

export const conversionByPeriod: Record<AnalyticsPeriod, number> = {
  '7d': 18.4,
  '30d': 22.7,
  '90d': 24.1,
  '1y': 26.3,
}
