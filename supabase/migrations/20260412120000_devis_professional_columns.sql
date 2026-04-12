-- Colonnes pour générateur de devis (lignes, entreprise, conditions, numéro)
alter table public.devis add column if not exists numero text;
alter table public.devis add column if not exists lignes jsonb;
alter table public.devis add column if not exists entreprise_info jsonb;
alter table public.devis add column if not exists conditions text;
alter table public.devis add column if not exists validite_jours int default 30;

comment on column public.devis.numero is 'Ex. DEV-2026-001';
comment on column public.devis.lignes is 'Lignes du devis : description, quantité, prix unitaire HT, TVA, total HT';
comment on column public.devis.entreprise_info is 'Infos vendeur : nom, adresse, email, téléphone, SIRET';
comment on column public.devis.conditions is 'Délais, mentions légales, notes';
comment on column public.devis.validite_jours is 'Durée de validité du devis en jours';

-- TVA globale : avec lignes à taux multiples, autoriser un taux effectif (ex. 13,5 %) ou 0
alter table public.devis drop constraint if exists devis_tva_check;
