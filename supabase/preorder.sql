-- Jasmine Concept · per-product preorder
-- Run this in the Supabase dashboard → SQL Editor. Safe to re-run (idempotent).

-- 1. Columns on the existing products table -------------------------------
alter table public.products
  add column if not exists is_preorder       boolean not null default false,
  add column if not exists preorder_delivery text;   -- nullable; free text
                                                      -- (exact date OR a range
                                                      --  like '10-15 gün')

-- 2. RLS ------------------------------------------------------------------
-- Postgres RLS is row-level, not column-level, so the two new columns are
-- already covered by the products table's existing policies. This block
-- enables RLS and ensures a full set of policies:
--   • public (anon + authenticated) can SELECT all rows/columns
--   • only authenticated admin can INSERT / UPDATE / DELETE
-- IMPORTANT: `enable row level security` BLOCKS all writes until a matching
-- policy exists. The products table needs INSERT + DELETE policies (not just
-- SELECT/UPDATE) or the admin panel will fail with
-- "new row violates row-level security policy" when adding a product.
-- If your products policies already exist under different names, the guards
-- below simply skip them.

alter table public.products enable row level security;

do $$
begin
  -- public read
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and cmd = 'SELECT'
  ) then
    create policy "products public read"
      on public.products for select
      to anon, authenticated
      using (true);
  end if;

  -- authenticated admin insert
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and cmd = 'INSERT'
  ) then
    create policy "products admin insert"
      on public.products for insert
      to authenticated
      with check (true);
  end if;

  -- authenticated admin update
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and cmd = 'UPDATE'
  ) then
    create policy "products admin update"
      on public.products for update
      to authenticated
      using (true) with check (true);
  end if;

  -- authenticated admin delete
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and cmd = 'DELETE'
  ) then
    create policy "products admin delete"
      on public.products for delete
      to authenticated
      using (true);
  end if;
end $$;

-- 3. Verify ---------------------------------------------------------------
-- Columns:
--   select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema='public' and table_name='products'
--     and column_name in ('is_preorder','preorder_delivery');
--
-- Policies:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname='public' and tablename='products';
