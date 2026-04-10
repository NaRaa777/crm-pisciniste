-- Statut des devis (à exécuter si la table existe déjà sans cette colonne)
alter table public.devis
  add column if not exists statut text not null default 'brouillon';

comment on column public.devis.statut is 'Ex. brouillon, envoye, accepte, refuse, annule';
