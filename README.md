# KonTeksto

> AI Cultural & Geographic Contextualizer for Philippine Classrooms

**Theme:** SDG 4 — Quality Education | "Beyond the Present, Coding the Future"

## The Problem

Philippine classrooms mandate mother-tongue instruction in early grades (MTB-MLE), but the materials pipeline never caught up — classrooms have books in Filipino and English, but almost nothing in most of the 19 officially recognized mother tongues. Beyond language, even existing materials often use culturally foreign examples (subways, Walmart, unfamiliar city landmarks) that don't resonate with a student's actual environment — research shows learners comprehend and engage far better with content that reflects their own cultural and geographic context.

Meanwhile, curriculum implementation itself is uneven: DepEd's MATATAG curriculum is being rolled out grade-by-grade, and teachers — already stretched thin — don't always have time to verify every lesson activity against the exact competency it's meant to target.

## The Solution

LokalSwap lets a teacher upload any lesson plan and instantly:
1. **Contextualizes it** — swapping foreign entities (transport, places, food, names) *and* reframing example scenarios to reflect the target region's actual environment and livelihood (not just noun-swapping)
2. **Translates it** into that region's designated mother tongue, as a separate, editable pass
3. **Grounds it** against real MATATAG/MELC competency data for the selected grade, subject, and quarter — flagging when a lesson's content may have drifted from its intended learning target
4. Presents everything in a **side-by-side diff viewer**, fully editable, so nothing reaches a classroom without teacher review

## Core Modules

### 🧩 KonTeksto — *Fully Working*
The core engine. Supports lesson plan upload via PDF, Word (.docx), or plain text/paste. Performs region-aware cultural contextualization and mother-tongue translation (MTB-MLE aligned), displays a side-by-side diff of every substitution, and allows full inline editing before export.

### 🎮 Tuklas — *Fully Working*
Transforms a contextualized lesson into an interactive quiz. Dynamically generates region-flavored questions via Groq (e.g., volcano, fish port, or city scenarios matching the selected region), then loads an interactive play interface with localized background maps, region-specific NPC sprites, an answer grid, explanation feedback, and scoring.

### 📁 LokalBank — *Partially Working / UI Mocked*
A community library concept for publishing and browsing reviewed, localized lessons. Sidebar-accessible, with mock publishing flows wire-framed inside the export section — not yet backed by a live database in this build.

## Regions Supported

| Region | Mother Tongue | Environment |
|---|---|---|
| National Capital Region (NCR) | Filipino/Tagalog | Urban |
| Bicol Region | Central Bikol | Agricultural-coastal |
| Central Visayas (Cebu) | Cebuano | Island-marine |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | Supabase (Postgres + Auth) |
| Validation | Zod |
| AI Generation | Groq API (Llama) |
| Architecture | Layered — types → validators → services → routes → components |

## What We're Not Building

- Full vector-based RAG — we use structured, curated competency lookups instead, scoped to the grade/subject/quarter combinations we've verified
- Coverage of all 19 mother tongues — scoped to Filipino, Central Bikol, and Cebuano, the languages we could verify generation quality for
- A diagnostic or auto-fixing tool — the app flags potential misalignment; it does not silently rewrite a teacher's pedagogical intent, and does not replace human review
- A fully live LokalBank — publishing flow is currently mocked/UI-only, not backed by a persisted database in this build

## Third-Party Libraries & Assets

- [Next.js](https://nextjs.org/) — MIT License
- [Supabase](https://supabase.com/) — Apache 2.0
- [Tailwind CSS](https://tailwindcss.com/) — MIT License
- [Zustand](https://github.com/pmndrs/zustand) — MIT License
- [Zod](https://zod.dev/) — MIT License
- [Groq API](https://groq.com/) — Llama model inference
- [lucide-react](https://lucide.dev/) (^0.546.0) — MIT License — icons across sidebar navigation, action buttons, and state indicators
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) (^2.4.5) — Node-based PDF text extraction for uploaded lesson plans
- [mammoth](https://www.npmjs.com/package/mammoth) (^1.12.0) — Word (.docx) file parsing
- [jsPDF](https://github.com/parallax/jsPDF) (^4.2.1) — client-side PDF generation for exporting localized lesson plans
- [motion](https://motion.dev/) (^12.23.24) — animation library for page/modal transitions
- **Custom assets** (in `src/utils`): `Bicol.jpg`, `Cebu.jpg`, `Manila.jpg` (regional backgrounds), `Bicol1.png`, `Cebu1.png`, `Manila1.png` (regional NPC sprites), `Ikaw.png`, `Kon.png` (player/mascot sprites) — team-created

## Generative AI Usage Disclosure

Per competition guidelines, all AI-assisted work is documented here:

- **Groq API (Llama models)** is a core, disclosed part of the product itself — used at runtime to generate cultural contextualization, mother-tongue translation, quiz question generation (Tuklas), and competency alignment checks. This is not incidental use; it is the product's primary mechanism, and all AI-generated content is designed to require teacher review before use.
- **Antigravity (Gemini/Claude modes)** was used during development for: layout bug fixes (resolving `min-h-screen` scroll overflow, side margin and header offset issues), mapping/configuring custom regional assets to load dynamically by region selection, integrating the Kon mascot across the sidebar, loaders, and modals, and updating API route schemas to parse region input and enforce NPC gender rules in LLM prompt outputs.
- **ChatGPT/Claude** were used for drafting PRDs, system prompts, template schemas, and early component scaffolding during planning and development.
- No AI-generated content was presented as original human work without disclosure.

## Team

- **Daniel** — Developer (KonTeksto core: text upload, MT translation, and cultural entity-swapping logic)
- **Mark** — Researcher & Presenter
- **Francis** — Developer (Tuklas core: interactive quiz play phase, sprite/battle arenas, and regional asset mapping)
- **Luke** — Marketing & Presenter
- **Julius** — Developer (LokalBank: lesson database schema, saving/loading lessons, and mock publishing modules)

## Setup / Running Locally

```bash
git clone https://github.com/dandadanielll/hackercup.git
cd hackercup
npm install
npm run dev
```

Requires a `.env` file with:
GROQ_API_KEY=
GEMINI_API_KEY=
APP_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Deployment

Not deployed. The app runs locally via `npm run build` / `npm run dev`, and is configured to deploy instantly to Vercel by importing this repository and adding the `GROQ_API_KEY` environment variable (and other env vars listed above).

## Future Roadmap

- Full-curriculum competency grounding (all grades/subjects/quarters)
- Additional regions/languages as LLM generation quality improves for them
- Live, database-backed LokalBank with real publishing and moderation
- DepEd DLL/WLL export formatting
