-- Table des devis rapides (Wevio)
-- Exécuter ce script dans le SQL Editor Supabase si la migration n'est pas appliquée automatiquement.

create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  chantier_id uuid references public.chantiers (id) on delete set null,
  description text not null default '',
  montant_ht numeric(14, 2) not null check (montant_ht >= 0),
  tva numeric(5, 2) not null check (tva in (0, 10, 20)),
  montant_ttc numeric(14, 2) not null check (montant_ttc >= 0),
  date_emission date not null default (current_date),
  statut text not null default 'brouillon',
  created_at timestamptz not null default now()
);

comment on table public.devis is 'Devis rapides créés depuis la sidebar';

create index if not exists devis_client_id_idx on public.devis (client_id);
create index if not exists devis_date_emission_idx on public.devis (date_emission desc);

-- Active RLS et ajoute des politiques adaptées à ton projet si besoin.
-- alter table public.devis enable row level security;
