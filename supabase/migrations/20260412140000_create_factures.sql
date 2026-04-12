create table if not exists public.factures (
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
  date_emission date default (current_date),
  date_echeance date,
  created_at timestamptz default now()
);

create index if not exists factures_client_id_idx on public.factures (client_id);
create index if not exists factures_date_emission_idx on public.factures (date_emission desc);
create index if not exists factures_devis_id_idx on public.factures (devis_id);

comment on table public.factures is 'Factures CRM — numérotation FAC-AAAA-NNN';
