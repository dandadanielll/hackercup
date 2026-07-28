-- ============================================================
-- LokalBank Migration — 0002_lokalbank.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- --------------------------------------------------------
-- TABLE: bank_resources
-- Canonical community lesson resource
-- --------------------------------------------------------
create table if not exists public.bank_resources (
  id              uuid        primary key default gen_random_uuid(),
  uploader_id     uuid        not null references auth.users(id) on delete cascade,
  teacher_name    text        not null,
  title           text        not null,
  resource_type   text        not null check (resource_type in ('Module', 'Lesson Plan')),
  subject         text        not null check (subject in ('Numeracy', 'Literacy', 'Science', 'Filipino')),
  grade_level     text        null,  -- reserved, not used for filtering in MVP
  content_text    text        not null,
  is_published    boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint title_length check (char_length(title) between 3 and 200),
  constraint content_length check (char_length(content_text) <= 50000)
);

-- RLS
alter table public.bank_resources enable row level security;

-- Anyone can read published resources
create policy "Published resources are public"
  on public.bank_resources for select
  using (is_published = true);

-- Authenticated users can insert their own resources
create policy "Authenticated users can insert resources"
  on public.bank_resources for insert
  with check (auth.uid() = uploader_id);

-- Users can update only their own resources
create policy "Users can update their own resources"
  on public.bank_resources for update
  using (auth.uid() = uploader_id)
  with check (auth.uid() = uploader_id);

-- Indexes
create index if not exists bank_resources_published_idx on public.bank_resources (is_published, created_at desc);
create index if not exists bank_resources_uploader_idx on public.bank_resources (uploader_id);

-- --------------------------------------------------------
-- TABLE: bank_reviews
-- Peer rating and comment per resource
-- --------------------------------------------------------
create table if not exists public.bank_reviews (
  id          uuid        primary key default gen_random_uuid(),
  resource_id uuid        not null references public.bank_resources(id) on delete cascade,
  author_id   uuid        not null references auth.users(id) on delete cascade,
  author_label text       not null default 'Teacher',  -- display name for the reviewer
  rating      smallint    not null check (rating between 1 and 5),
  comment     text        not null,
  created_at  timestamptz not null default now(),

  constraint comment_length check (char_length(comment) <= 2000)
);

-- RLS
alter table public.bank_reviews enable row level security;

-- Anyone can read reviews for published resources
create policy "Reviews on published resources are public"
  on public.bank_reviews for select
  using (
    exists (
      select 1 from public.bank_resources
      where bank_resources.id = bank_reviews.resource_id
      and bank_resources.is_published = true
    )
  );

-- Authenticated users can insert reviews
create policy "Authenticated users can submit reviews"
  on public.bank_reviews for insert
  with check (auth.uid() = author_id);

-- Index
create index if not exists bank_reviews_resource_idx on public.bank_reviews (resource_id, created_at desc);

-- --------------------------------------------------------
-- TABLE: bank_ai_suggestions
-- On-demand AI drafts (per review or overall)
-- --------------------------------------------------------
create table if not exists public.bank_ai_suggestions (
  id                uuid        primary key default gen_random_uuid(),
  resource_id       uuid        not null references public.bank_resources(id) on delete cascade,
  review_id         uuid        null references public.bank_reviews(id) on delete set null,
  feedback_snapshot text        not null,  -- the review text or "all reviews" snapshot used
  suggestion_json   jsonb       not null,  -- { feedback_addressed, issue, proposed_edit, teacher_action }
  status            text        not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at        timestamptz not null default now()
);

-- RLS
alter table public.bank_ai_suggestions enable row level security;

-- Only the resource owner (uploader) can see suggestions for their resource
create policy "Resource owner can view suggestions"
  on public.bank_ai_suggestions for select
  using (
    exists (
      select 1 from public.bank_resources
      where bank_resources.id = bank_ai_suggestions.resource_id
      and bank_resources.uploader_id = auth.uid()
    )
  );

-- Authenticated users can insert suggestions (server will validate ownership via service role)
create policy "Authenticated users can insert suggestions"
  on public.bank_ai_suggestions for insert
  with check (auth.uid() is not null);

-- Authenticated users can update suggestion status
create policy "Authenticated users can update suggestion status"
  on public.bank_ai_suggestions for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Index
create index if not exists bank_ai_suggestions_resource_idx on public.bank_ai_suggestions (resource_id, created_at desc);

-- ============================================================
-- SEED DATA — Sample resources, reviews, and a demo teacher
-- ============================================================
-- NOTE: Replace 'YOUR_DEMO_TEACHER_USER_ID' below with the actual
-- auth.users UUID of your seeded verified teacher account.
-- You get this from: Supabase → Authentication → Users → copy the UUID.
-- ============================================================

-- Step 1: Create the demo teacher user in Supabase Auth first
-- (Sign up via the app's sign-in modal, then find the UUID in the Auth panel)
-- Then run Step 2 below:

-- Step 2: Seed sample resources (replace the uploader_id with your actual UUID)
/*
INSERT INTO public.bank_resources (uploader_id, teacher_name, title, resource_type, subject, grade_level, content_text, is_published)
VALUES
  (
    'YOUR_DEMO_TEACHER_USER_ID',
    'Ma. Clara Reyes',
    'Pagbibilang ng Piso: Grade 3 Numeracy Module',
    'Module',
    'Numeracy',
    'Grade 3',
    'LEARNING MODULE: GRADE 3 NUMERACY
Topic: Counting Philippine Coins and Bills
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Identify Philippine coins (1-, 5-, 10-, 25-centavo and 1-, 5-, 10-peso coins).
2. Count and add coins to reach a target amount.
3. Make change using the fewest coins possible.

MOTIVATION (10 minutes):
Mang Cardo sells bibingka near the church every Sunday. He collected these coins today:
- Three 10-peso coins
- Five 5-peso coins
- Two 1-peso coins

Ask: "Ilan lahat ang pera ni Mang Cardo?"

LESSON PROPER (20 minutes):
Show actual coins or coin cut-outs. Demonstrate counting by groups:
- Group the 10-peso coins: 10 + 10 + 10 = 30
- Add the 5-peso coins: 5 × 5 = 25
- Add the 1-peso coins: 1 + 1 = 2
- Total: 30 + 25 + 2 = ₱57.00

ACTIVITY (10 minutes):
Word Problem: Aling Nena has ₱20. She buys a saging na saba for ₱8.
How much change does she receive?

ASSESSMENT (5 minutes):
1. Pedro has two 5-peso coins and three 1-peso coins. How much does he have?
2. A fishball stick costs ₱5. If you pay ₱20, how much change do you get?',
    true
  ),
  (
    'YOUR_DEMO_TEACHER_USER_ID',
    'Jose Rizal Santos',
    'Ang Panahon: Grade 2 Science Lesson Plan',
    'Lesson Plan',
    'Science',
    'Grade 2',
    'LESSON PLAN: GRADE 2 SCIENCE
Topic: Weather and Its Effects on Daily Life
Duration: 45 Minutes

LEARNING OBJECTIVES:
Students will be able to:
1. Describe different types of weather (sunny, cloudy, rainy, windy).
2. Identify appropriate clothing and activities for each weather type.
3. Record simple weather observations.

INTRODUCTION (8 minutes):
Show pictures of Naga City during different weather conditions:
- A sunny day at the Peñafrancia Shrine
- Typhoon Reming aftermath (for context and safety discussion)
- Cloudy morning at the public market

Discussion: "Paano nakakaapekto ang panahon sa inyong pang-araw-araw na buhay?"

LESSON PROPER (20 minutes):
Types of Weather:
1. SUNNY (Mainit) — Good for: playing outdoors, fishing, drying palay
   Clothing: light clothes, salakot hat
2. RAINY (Maulan) — Good for: farming, rice planting
   Clothing: raincoat, rubber boots, payong
3. WINDY (Mahangin) — Be careful: keep windows closed, secure fishing boats
4. CLOUDY (Maulap) — May rain soon: bring payong just in case

ACTIVITY (12 minutes):
Weather Journal: Students draw and label the weather for 5 consecutive school days.

ASSESSMENT (5 minutes):
Complete the sentence: "Ngayong _______ ang panahon, dapat akong magdala ng _______."',
    true
  );

-- Step 3: Seed reviews for the first resource
INSERT INTO public.bank_reviews (resource_id, author_id, author_label, rating, comment)
VALUES
  (
    (SELECT id FROM public.bank_resources WHERE title = 'Pagbibilang ng Piso: Grade 3 Numeracy Module' LIMIT 1),
    'YOUR_DEMO_TEACHER_USER_ID',
    'Teacher Liza M.',
    5,
    'Napakaganda ng module na ito! Ang paggamit ng tunay na halimbawa tulad ni Mang Cardo at ang pagbibilang ng piso ay lubhang nakakatulong sa mga bata. Ginamit ko ito sa aking klase at masaya ang lahat ng estudyante.'
  ),
  (
    (SELECT id FROM public.bank_resources WHERE title = 'Pagbibilang ng Piso: Grade 3 Numeracy Module' LIMIT 1),
    'YOUR_DEMO_TEACHER_USER_ID',
    'Teacher Romar D.',
    4,
    'Very practical and culturally relevant. The word problems using local vendors and local food items make math relatable. I suggest adding more practice problems involving market scenarios — my Grade 3 students love market-themed activities.'
  ),
  (
    (SELECT id FROM public.bank_resources WHERE title = 'Ang Panahon: Grade 2 Science Lesson Plan' LIMIT 1),
    'YOUR_DEMO_TEACHER_USER_ID',
    'Teacher Ana G.',
    5,
    'Excellent use of local weather examples specific to Bicol region. The reference to Typhoon Reming is sensitive but age-appropriate — it opens a great discussion on safety. The weather journal activity is simple and highly effective.'
  );
*/
