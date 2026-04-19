/** Titres / sous-titres affichés dans le bandeau supérieur (aligné sur la hauteur du bandeau sidebar). */
export const PAGE_HEADER_BY_KEY: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Vue d’ensemble de votre activité et indicateurs clés.',
  },
  planning: {
    title: 'Planning',
    subtitle: 'Tâches liées aux chantiers (table Supabase).',
  },
  sites: {
    title: 'Suivi des Chantiers',
    subtitle: 'Gérez vos projets piscines avec checklist et photos.',
  },
  prospects: {
    title: 'Gestion des Prospects',
    subtitle: 'CRM intégré pour suivre vos leads piscines.',
  },
  devis: {
    title: 'Devis & Matériaux Piscines',
    subtitle: 'Catalogue matériaux, devis IA et suivi des offres.',
  },
  'ia-visualisation': {
    title: 'IA Visualisation',
    subtitle: 'Importez une photo de jardin, puis suivez les étapes pour générer une visualisation.',
  },
  paiements: {
    title: 'Paiements',
    subtitle: 'Factures et encaissements (table Supabase « facturation »).',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Indicateurs calculés à partir des tables Supabase (clients, chantiers, facturation).',
  },
  portfolio: {
    title: 'Portfolio',
    subtitle: 'Réalisations (images de démonstration).',
  },
  settings: {
    title: 'Paramètres',
    subtitle: 'Profil affiché dans l’en-tête et préférences d’affichage.',
  },
  help: {
    title: 'Aide & support',
    subtitle:
      'FAQ pour utiliser l’application au quotidien, même si vous n’êtes pas à l’aise avec l’informatique.',
  },
}

export function getPageHeader(navKey: string) {
  return (
    PAGE_HEADER_BY_KEY[navKey] ?? {
      title: 'Wevio',
      subtitle: 'Espace CRM pisciniste.',
    }
  )
}
