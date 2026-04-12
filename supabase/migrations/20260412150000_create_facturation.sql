create table if not exists public.facturation (
  id uuid default gen_random_uuid() primary key,
  numero text,
  devis_id uuid references public.devis (id) on delete set null,
  client_id uuid not null references public.clients (id) on delete restrict,
  chantier_id uuid references public.chantiers (id) on delete set null,
  lignes jsonb,
  entreprise_info jsonb,
  montant_ht numeric,
  tva numeric,
  montant_ttc numeric,
  conditions text,
  statut text default 'En attente',
  type text default 'facture',
  date_emission date default (current_date),
  date_echeance date,
  date_paiement date,
  created_at timestamptz default now()
);

create index if not exists facturation_client_id_idx on public.facturation (client_id);
create index if not exists facturation_date_emission_idx on public.facturation (date_emission desc);
create index if not exists facturation_devis_id_idx on public.facturation (devis_id);

comment on table public.facturation is 'Facturation unifiée (factures) — numérotation FAC-AAAA-NNN';
