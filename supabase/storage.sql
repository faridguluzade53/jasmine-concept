-- Jasmine Concept · storage RLS for the product-images bucket
-- Run in Supabase → SQL Editor. Storage has its OWN row-level security,
-- separate from the products table — without these, admin image uploads fail
-- with "new row violates row-level security policy".
--
-- Prereq: a Storage bucket named `product-images` must exist
-- (Dashboard → Storage → New bucket).
--
-- Note: CREATE POLICY has no IF NOT EXISTS, so we drop-then-create to stay
-- idempotent (safe to re-run).

-- Admin (signed-in) can upload new images.
drop policy if exists "product-images admin upload" on storage.objects;
create policy "product-images admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

-- Admin can overwrite existing images.
drop policy if exists "product-images admin update" on storage.objects;
create policy "product-images admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- Public (site visitors) can read images so they display on the storefront.
-- Alternatively, mark the bucket "Public" in the dashboard and skip this.
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
