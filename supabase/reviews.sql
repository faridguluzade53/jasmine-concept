-- Jasmine Concept · site-wide experience reviews (with owner approval)
-- Run this in the Supabase dashboard → SQL Editor. Safe to re-run (idempotent).
--
-- Flow: a customer submits NAME + STAR RATING via a private link the owner
-- sends after an order. Reviews arrive hidden (approved = false). The owner
-- approves them in the admin panel; only approved reviews are readable by the
-- public and shown on the homepage. Reviews are about the overall ordering
-- experience (delivery, products, communication) — never a single product.

-- 1. Table -----------------------------------------------------------------
create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  name       text        not null,
  rating     int         not null check (rating between 1 and 5),
  approved   boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Bring an existing reviews table (pre-approval version) up to date.
alter table public.reviews
  add column if not exists approved boolean not null default false;

-- 2. Table privileges ------------------------------------------------------
-- RLS decides WHICH rows a role may touch, but the role still needs the base
-- table privilege first. This project does not auto-grant on new tables.
--   • anon           → INSERT (submit) + SELECT (read; RLS limits to approved)
--   • authenticated  → INSERT + SELECT + UPDATE + DELETE (admin moderation)
grant insert, select on public.reviews to anon;
grant insert, select, update, delete on public.reviews to authenticated;

-- 3. RLS -------------------------------------------------------------------
alter table public.reviews enable row level security;

-- Dropped + recreated so re-running this file stays authoritative.
drop policy if exists "reviews public insert"        on public.reviews;
drop policy if exists "reviews admin read"           on public.reviews;
drop policy if exists "reviews public read approved" on public.reviews;
drop policy if exists "reviews admin read all"       on public.reviews;
drop policy if exists "reviews admin update"         on public.reviews;
drop policy if exists "reviews admin delete"         on public.reviews;

-- Anyone with the link can submit — but only as an UNapproved review.
create policy "reviews public insert"
  on public.reviews for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) > 0
    and rating between 1 and 5
    and approved = false
  );

-- The public (and the homepage) may read ONLY approved reviews.
create policy "reviews public read approved"
  on public.reviews for select
  to anon, authenticated
  using (approved = true);

-- The signed-in admin may read every review (approved or pending).
create policy "reviews admin read all"
  on public.reviews for select
  to authenticated
  using (true);

-- The signed-in admin may approve / unapprove (and any other edits).
create policy "reviews admin update"
  on public.reviews for update
  to authenticated
  using (true) with check (true);

-- The signed-in admin may delete a review.
create policy "reviews admin delete"
  on public.reviews for delete
  to authenticated
  using (true);

-- 4. Verify ----------------------------------------------------------------
-- Policies:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname='public' and tablename='reviews';
--
-- Expected:
--   reviews public insert        | INSERT | {anon,authenticated} | check: name/rating/approved=false
--   reviews public read approved | SELECT | {anon,authenticated} | using: approved = true
--   reviews admin read all       | SELECT | {authenticated}      | using: true
--   reviews admin update         | UPDATE | {authenticated}      | using/check: true
--   reviews admin delete         | DELETE | {authenticated}      | using: true
