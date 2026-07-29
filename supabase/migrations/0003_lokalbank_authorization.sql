-- Migration 0003: LokalBank Authorization Hardening
-- Restricts write policies for bank_resources, bank_reviews, and bank_ai_suggestions to verified demo teacher accounts.

-- 1. Create bank_verified_teachers table
create table if not exists public.bank_verified_teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS on bank_verified_teachers
alter table public.bank_verified_teachers enable row level security;

-- Public can read verified teachers list
create policy "Allow public read on bank_verified_teachers"
  on public.bank_verified_teachers for select
  using (true);

-- 2. Populate the seeded teacher ID into bank_verified_teachers if the auth user exists
insert into public.bank_verified_teachers (user_id)
select id from auth.users where id = 'd7b7e51c-c049-4f7f-8461-a08092db2c96'
on conflict (user_id) do nothing;

-- 3. Hardened write policies requiring membership in bank_verified_teachers

-- bank_resources write policies
drop policy if exists "Authenticated insert resources" on public.bank_resources;
drop policy if exists "Owner update resources" on public.bank_resources;

create policy "Verified teacher insert resources"
  on public.bank_resources for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.bank_verified_teachers
      where user_id = auth.uid()
    )
  );

create policy "Verified teacher owner update resources"
  on public.bank_resources for update
  using (
    auth.role() = 'authenticated' and
    uploader_id = auth.uid() and
    exists (
      select 1 from public.bank_verified_teachers
      where user_id = auth.uid()
    )
  );

-- bank_reviews write policies
drop policy if exists "Authenticated insert reviews" on public.bank_reviews;

create policy "Verified teacher insert reviews"
  on public.bank_reviews for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.bank_verified_teachers
      where user_id = auth.uid()
    )
  );

-- bank_ai_suggestions write policies
drop policy if exists "Authenticated insert suggestions" on public.bank_ai_suggestions;
drop policy if exists "Authenticated update suggestions" on public.bank_ai_suggestions;

create policy "Verified teacher insert suggestions"
  on public.bank_ai_suggestions for insert
  with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.bank_verified_teachers
      where user_id = auth.uid()
    )
  );

create policy "Verified teacher update suggestions"
  on public.bank_ai_suggestions for update
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.bank_verified_teachers
      where user_id = auth.uid()
    )
  );
