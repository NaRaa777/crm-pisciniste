-- Si la table a été créée avec l’ancienne colonne « tva_pct », la renommer en « tva ».
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'devis'
      and column_name = 'tva_pct'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'devis'
      and column_name = 'tva'
  ) then
    alter table public.devis rename column tva_pct to tva;
  end if;
end $$;
