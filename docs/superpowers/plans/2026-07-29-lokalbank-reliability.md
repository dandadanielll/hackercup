# LokalBank Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LokalBank file uploads reliable, require every resource metadata field to be explicitly selected or typed, and produce grounded Groq review suggestions that distinguish praise from an actionable issue.

**Architecture:** Keep LokalBank as the existing third in-page workspace. Add small shared server helpers for demo-teacher authorization, resource-file validation, and deterministic suggestion validation/application. The browser submits only identifiers for AI generation; the server loads the canonical resource/review data, calls Groq, validates its structured response, and returns either a specific applicable edit or an explicit no-change result.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, Groq SDK (`llama-3.3-70b-versatile`), Mammoth, pdfjs-dist/pdf-parse, Vitest.

## Global Constraints

- Keep LokalSwap behavior and components unchanged.
- Keep LokalBank on the current page; do not add a route.
- Accept PDF, DOCX, and TXT; canonical content remains extracted text and downloads remain PDF/TXT.
- Do not infer or prefill Teacher Name, Title, Type, Subject, or Grade Level from the file or defaults.
- Keep browsing and downloads public; only the seeded verified demo teacher may create resources, reviews, suggestions, or accepted edits.
- Use Groq for all AI suggestions; never substitute invented fallback feedback when Groq is unavailable or invalid.
- A positive/non-actionable review must state that no edit is needed and must not expose an Accept Edit control.
- Do not expose `GROQ_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- Preserve existing unrelated changes in `src/app/api/extract/route.ts` and `tsconfig.tsbuildinfo`.

---

## Current defects and evidence

- `AddResourceModal.tsx` automatically derives the title from the uploaded filename and initializes Type, Subject, and Grade to guessed values.
- The upload has two opaque network stages (`/api/extract`, then `/api/bank/resources`), so an extraction, session, authorization, database, or environment failure appears as the same generic upload failure.
- `POST /api/bank/suggest` trusts browser-supplied resource text/feedback and emits a generic fallback suggestion when Groq fails. That fallback invents an issue even when a review is positive, producing the irrelevant result in the supplied screenshot.
- `tsc --noEmit --incremental false` currently reaches example TypeScript inside `skills/`; `.gitignore` does not exclude files from TypeScript compilation.

## File structure

| File | Responsibility |
|---|---|
| `src/lib/bank/resourceInput.ts` | Shared allowed-file constants and validation for UI/API use. |
| `src/lib/bank/demoTeacher.ts` | Server-only seeded-teacher authorization helper. |
| `src/lib/bank/suggestion.ts` | Groq result parser, actionable/no-change schema guard, and deterministic edit application. |
| `src/app/api/extract/route.ts` | Explicit multipart validation and extraction-stage errors. |
| `src/app/api/bank/resources/route.ts` | Demo-teacher authorization and manual resource metadata validation. |
| `src/app/api/bank/reviews/route.ts` | Demo-teacher authorization and resource-aware review validation. |
| `src/app/api/bank/suggest/route.ts` | Canonical-data lookup, Groq-only generation, structured validation, and safe persistence. |
| `src/app/api/bank/resources/[id]/accept/route.ts` | Apply only a validated persisted actionable suggestion. |
| `src/components/bank/AddResourceModal.tsx` | Blank manual metadata fields and phase-specific upload feedback. |
| `src/components/bank/ReviewPanel.tsx` | Clear review submission behavior and actionable/no-change suggestion rendering. |
| `src/components/bank/OverallImprovementPanel.tsx` | Identifier-only overall request; no browser-built feedback prompt. |
| `src/components/bank/SuggestedEditDiff.tsx` | Disable edits for no-change suggestions; render exact target/replacement preview. |
| `src/components/bank/types.ts` | Client types for valid actionable and no-change AI outcomes. |
| `supabase/migrations/0003_lokalbank_authorization.sql` | One-row seeded-writer authorization table and RLS policy hardening. |
| `.env.example` | Document required server-only demo-teacher ID and Groq variables without values. |
| `tsconfig.json` | Exclude ignored skill examples from application type-checking. |
| `vitest.config.ts`, `tests/setup.ts` | Test runner configuration. |
| `tests/unit/bank/*.test.ts` | Unit coverage for validation and suggestion safety. |
| `tests/api/bank/*.test.ts` | Route behavior with mocked Supabase/Groq clients. |

## Task 1: Establish a clean verification baseline

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces the commands `npm run typecheck` and `npm test` for every later task.
- Documents `LOKALBANK_DEMO_TEACHER_ID` as a server-only configuration value.

- [ ] **Step 1: Add the failing typecheck script and run it.**

Add this script to `package.json`:

```json
"typecheck": "tsc --noEmit --incremental false"
```

Run: `npm run typecheck`

Expected: FAIL because `skills/superpowers/skills/systematic-debugging/condition-based-waiting-example.ts` imports unavailable `~/threads/*` files.

- [ ] **Step 2: Exclude non-application skill material.**

Extend `tsconfig.json` `exclude` with:

```json
["node_modules", "skills", "hackerCup-Vault"]
```

Do not remove application files from `include`.

- [ ] **Step 3: Add the test runner.**

Install `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom` as development dependencies. Create:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
});
```

```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
```

Add `"test": "vitest run"` to `package.json`.

- [ ] **Step 4: Document required non-secret configuration.**

Add blank keys and comments to `.env.example`:

```dotenv
# UUID of the one seeded Supabase Auth user allowed to write LokalBank demo data.
LOKALBANK_DEMO_TEACHER_ID=
# Server-only Groq API key used to generate grounded review suggestions.
GROQ_API_KEY=
```

- [ ] **Step 5: Verify the baseline.**

Run: `npm run typecheck && npm test`

Expected: PASS with no tests yet, and no errors from `skills/`.

- [ ] **Step 6: Commit.**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts tests/setup.ts .env.example
git commit -m "test: establish LokalBank verification baseline"
```

## Task 2: Enforce manual metadata and make upload failures diagnosable

**Files:**
- Create: `src/lib/bank/resourceInput.ts`
- Modify: `src/components/bank/AddResourceModal.tsx`
- Modify: `src/app/api/extract/route.ts`
- Modify: `src/app/api/bank/resources/route.ts`
- Create: `tests/unit/bank/resourceInput.test.ts`
- Create: `tests/api/bank/extract.test.ts`

**Interfaces:**
- Produces `validateResourceFile(file: File): string | null` and canonical `RESOURCE_TYPES`, `SUBJECTS`, `GRADES` constants.
- `POST /api/extract` returns either `{ extractedText, fileName, charCount }` or a specific 400/413 error.
- `POST /api/bank/resources` accepts only explicit, valid metadata and canonical extracted text.

- [ ] **Step 1: Write failing validation tests.**

```ts
import { describe, expect, it } from 'vitest';
import { validateResourceFile } from '@/src/lib/bank/resourceInput';

describe('validateResourceFile', () => {
  it('accepts a 5 MB-or-smaller PDF, DOCX, or TXT file', () => {
    expect(validateResourceFile(new File(['lesson'], 'lesson.txt', { type: 'text/plain' }))).toBeNull();
  });

  it('rejects an unsupported extension and files larger than 5 MB', () => {
    expect(validateResourceFile(new File(['x'], 'lesson.exe', { type: 'application/octet-stream' }))).toMatch(/PDF, DOCX, or TXT/);
    expect(validateResourceFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.txt', { type: 'text/plain' }))).toMatch(/5 MB/);
  });
});
```

- [ ] **Step 2: Implement a shared input contract.**

Create `resourceInput.ts` with exactly these values and no inferred value:

```ts
export const RESOURCE_TYPES = ['Module', 'Lesson Plan'] as const;
export const SUBJECTS = ['Numeracy', 'Literacy', 'Science', 'Filipino'] as const;
export const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] as const;
export const MAX_RESOURCE_FILE_BYTES = 5 * 1024 * 1024;
```

Validate extension and MIME type together; return an explanatory string instead of throwing from the browser helper.

- [ ] **Step 3: Make every metadata value manual.**

In `AddResourceModal.tsx`:

- Delete `handleFileChange` title autofill.
- Initialize `resourceType`, `subject`, and `gradeLevel` to `''`, not a valid option.
- Add a disabled placeholder option such as `<option value="" disabled>Select a subject</option>` to every select.
- Mark all metadata fields required and block submit with exact field-specific messages.
- Keep the Grade selector present; its manually selected value is saved but the table remains reserved/blank as agreed.
- Replace one `loading` label with explicit phases: `Extracting file…` then `Publishing resource…`.
- Preserve typed metadata and selected file when either request fails.

- [ ] **Step 4: Harden the extraction route.**

Before calling `arrayBuffer()` in the multipart path:

```ts
if (!file) return NextResponse.json({ error: 'Choose a PDF, DOCX, or TXT file.' }, { status: 400 });
if (file.size > MAX_RESOURCE_FILE_BYTES) return NextResponse.json({ error: 'File exceeds the 5 MB limit.' }, { status: 413 });
const validationError = validateResourceFile(file);
if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
```

Keep the current PDF fallback strategies intact. Return extraction errors with a stable `stage: 'extraction'` field so the UI can say the file was accepted but could not be read.

- [ ] **Step 5: Make resource-save errors distinguishable.**

In `POST /api/bank/resources`, validate every value against `resourceInput.ts`, reject empty Grade values, and return structured errors:

```ts
{ error: 'A manually selected subject is required.', stage: 'metadata' }
{ error: 'LokalBank writer account is not configured.', stage: 'configuration' }
{ error: 'Resource could not be saved. Try again.', stage: 'persistence' }
```

Do not log file text, tokens, or secrets.

- [ ] **Step 6: Add API tests.**

Mock the PDF/DOCX parsers and assert:

```ts
it('returns 400 when multipart data does not contain a file', async () => {
  const response = await POST(requestWithEmptyFormData());
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ stage: 'extraction' });
});

it('returns 413 before parsing a file larger than 5 MB', async () => {
  const response = await POST(requestWithLargeTxtFile());
  expect(response.status).toBe(413);
});
```

- [ ] **Step 7: Verify upload behavior.**

Run: `npm test -- tests/unit/bank/resourceInput.test.ts tests/api/bank/extract.test.ts && npm run typecheck`

Expected: PASS. Manually test TXT, DOCX, and text-based PDF selection; confirm title/type/subject/grade remain blank until the teacher enters/selects them.

- [ ] **Step 8: Commit.**

```bash
git add src/lib/bank/resourceInput.ts src/components/bank/AddResourceModal.tsx src/app/api/extract/route.ts src/app/api/bank/resources/route.ts tests
git commit -m "fix: make LokalBank upload explicit and diagnosable"
```

## Task 3: Restrict protected writes to the seeded demo teacher

**Files:**
- Create: `src/lib/bank/demoTeacher.ts`
- Modify: `src/app/api/bank/resources/route.ts`
- Modify: `src/app/api/bank/reviews/route.ts`
- Modify: `src/app/api/bank/suggest/route.ts`
- Modify: `src/app/api/bank/resources/[id]/accept/route.ts`
- Create: `supabase/migrations/0003_lokalbank_authorization.sql`
- Create: `tests/unit/bank/demoTeacher.test.ts`
- Create: `tests/api/bank/authorization.test.ts`

**Interfaces:**
- Produces `requireDemoTeacher(request): Promise<{ userId: string } | NextResponse>`.
- All protected LokalBank routes return 401 for a missing/invalid session and 403 for a valid non-seeded user.

- [ ] **Step 1: Write failing authorization tests.**

```ts
it('rejects an authenticated user whose ID is not LOKALBANK_DEMO_TEACHER_ID', async () => {
  mockAuthenticatedUser('other-user-id');
  const response = await createResource(validRequest);
  expect(response.status).toBe(403);
});

it('allows the configured seeded teacher ID', async () => {
  mockAuthenticatedUser('demo-user-id');
  process.env.LOKALBANK_DEMO_TEACHER_ID = 'demo-user-id';
  expect(await requireDemoTeacher(validRequest)).toEqual({ userId: 'demo-user-id' });
});
```

- [ ] **Step 2: Implement one server-only authorization helper.**

`demoTeacher.ts` must:

1. Read the bearer token.
2. Resolve it using Supabase Auth.
3. Fail with a configuration error if `LOKALBANK_DEMO_TEACHER_ID` is absent.
4. Compare the resolved `user.id` to that configured ID.
5. Return a JSON 401 or 403 response without revealing a token or user details.

- [ ] **Step 3: Apply the helper to every protected route.**

Use the same helper in resource creation, review creation, Groq suggestion generation, and suggestion acceptance. Remove duplicated `getUserClient()` implementations from those routes.

- [ ] **Step 4: Add migration-level defense in depth.**

Create a migration that adds a `bank_verified_teachers(user_id uuid primary key references auth.users(id))` table, enables RLS, and changes write policies for resources/reviews/suggestions to require:

```sql
exists (
  select 1 from public.bank_verified_teachers
  where user_id = auth.uid()
)
```

The migration instructions must insert only the seeded teacher UUID after that Auth user exists. Public select policies remain unchanged.

- [ ] **Step 5: Verify protected actions.**

Run: `npm test -- tests/unit/bank/demoTeacher.test.ts tests/api/bank/authorization.test.ts && npm run typecheck`

Expected: PASS. Manually confirm a guest sees the sign-in modal and a signed-in non-seeded account receives the specific authorization error rather than an upload success.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/bank/demoTeacher.ts src/app/api/bank supabase/migrations/0003_lokalbank_authorization.sql tests
git commit -m "fix: restrict LokalBank writes to seeded teacher"
```

## Task 4: Replace generic AI fallback with grounded Groq issue analysis

**Files:**
- Create: `src/lib/bank/suggestion.ts`
- Modify: `src/app/api/bank/suggest/route.ts`
- Modify: `src/components/bank/types.ts`
- Modify: `src/components/bank/ReviewPanel.tsx`
- Modify: `src/components/bank/OverallImprovementPanel.tsx`
- Modify: `src/components/bank/SuggestedEditDiff.tsx`
- Create: `tests/unit/bank/suggestion.test.ts`
- Create: `tests/api/bank/suggest.test.ts`

**Interfaces:**
- `POST /api/bank/suggest` accepts `{ resource_id, mode: 'review' | 'overall', review_id?: string }` only.
- `SuggestionJson` is a discriminated union: a no-change result or an actionable result with one exact, applicable edit.

- [ ] **Step 1: Write the failing suggestion-safety tests.**

```ts
it('classifies praise without a requested change as non-actionable', () => {
  const result = parseSuggestion({
    outcome: 'no_change',
    feedback_summary: 'The reviewer found the local examples effective.',
    reason_no_change: 'No specific improvement was requested.',
  }, 'Lesson text');
  expect(result.outcome).toBe('no_change');
});

it('rejects a replacement whose target does not occur exactly once', () => {
  expect(() => applySuggestion('Repeat. Repeat.', actionableReplacement('Repeat.', 'Better.'))).toThrow(/exactly once/);
});
```

- [ ] **Step 2: Define a safe result schema and deterministic edit application.**

Implement these exact shapes:

```ts
type NoChangeSuggestion = {
  outcome: 'no_change';
  feedback_summary: string;
  reason_no_change: string;
  teacher_action: string;
};

type ActionableSuggestion = {
  outcome: 'actionable';
  feedback_summary: string;
  issue_identified: string;
  evidence_from_review: string;
  edit_kind: 'replace' | 'append';
  target_excerpt: string | null;
  replacement_text: string;
  teacher_action: string;
};
```

For `replace`, require a non-empty `target_excerpt` that occurs exactly once in canonical content. For `append`, append only `replacement_text`. Reject any invalid model result with a 502 response; never fabricate a generic suggestion.

- [ ] **Step 3: Make the server source of truth.**

Change `/api/bank/suggest` so the client cannot send `resource_text` or `feedback`. The route must:

1. Authorize the seeded teacher.
2. Fetch `content_text` for `resource_id`.
3. Fetch exactly `review_id` for review mode, or all persisted reviews for overall mode.
4. Return 400 when no reviews exist for overall mode or the requested review does not belong to the resource.
5. Build the Groq prompt from those database records only.

- [ ] **Step 4: Replace the Groq prompt and error policy.**

Use `llama-3.3-70b-versatile`, `response_format: { type: 'json_object' }`, and this behavioral contract:

```text
If feedback is praise, vague, or does not request an improvement, return outcome=no_change.
Never infer an issue that the review did not raise.
For outcome=actionable, quote the exact feedback evidence and create one content-only replacement or append.
The replacement must solve the stated issue and must not introduce standards, facts, or claims absent from the resource/review.
```

If `GROQ_API_KEY` is absent, the Groq request fails, JSON is invalid, or the structured response cannot be applied, return an explicit unavailable/invalid-draft error. Remove the current generic fallback block entirely.

- [ ] **Step 5: Update the UI contract.**

- `ReviewPanel` and `OverallImprovementPanel` send identifiers/mode only.
- For `outcome: 'no_change'`, render feedback summary, reason, and teacher action; do not render a diff, editable textarea, Accept, or Reject controls.
- For `outcome: 'actionable'`, render review evidence, issue, target/replacement preview, and a diff generated from the deterministic helper.
- `SuggestedEditDiff` sends only `suggestion_id`; the accept API re-fetches the persisted suggestion and derives the new content server-side.

- [ ] **Step 6: Test Groq and UI outcomes.**

Mock Groq responses and assert:

```ts
it('returns no_change for a positive review without a requested improvement', async () => {
  mockGroqJson(noChangeJson);
  const response = await POST(suggestionRequest({ resource_id: resource.id, review_id: praiseReview.id, mode: 'review' }));
  expect(await response.json()).toMatchObject({ suggestion: { suggestion_json: { outcome: 'no_change' } } });
});

it('returns 503 instead of an invented fallback when Groq is unavailable', async () => {
  mockGroqFailure(new Error('network unavailable'));
  expect((await POST(validSuggestionRequest)).status).toBe(503);
});
```

Render `SuggestedEditDiff` with both outcomes and assert that only actionable output exposes `Accept edit`.

- [ ] **Step 7: Verify suggestion correctness manually.**

Use the positive Filipino review from the supplied screenshot. Expected: no-change result, never an invented lesson adaptation. Then use a review explicitly requesting additional market-scenario practice problems. Expected: one specific append or replacement tied to that request.

- [ ] **Step 8: Commit.**

```bash
git add src/lib/bank/suggestion.ts src/app/api/bank/suggest/route.ts src/components/bank tests
git commit -m "fix: ground LokalBank suggestions in reviewer issues"
```

## Task 5: Protect accepted edits and complete the end-to-end regression pass

**Files:**
- Modify: `src/app/api/bank/resources/[id]/accept/route.ts`
- Modify: `src/components/bank/ExpandedResourceRow.tsx`
- Modify: `src/components/bank/ResourceTable.tsx`
- Create: `tests/api/bank/accept.test.ts`
- Create: `tests/manual/lokalbank-regression.md`

**Interfaces:**
- `POST /api/bank/resources/:id/accept` accepts `{ suggestion_id }` only.
- The server applies a previously validated persisted actionable edit, updates resource text/timestamp, marks the suggestion accepted, and rejects no-change/foreign/invalid suggestions.

- [ ] **Step 1: Write failing acceptance tests.**

```ts
it('accepts a persisted actionable suggestion and updates canonical content', async () => {
  mockPersistedActionableSuggestion(resource.id, exactReplace('Old activity', 'New activity'));
  const response = await POST(acceptRequest({ suggestion_id: suggestion.id }));
  expect(response.status).toBe(200);
  expect(mockResourceUpdate).toHaveBeenCalledWith(expect.objectContaining({ content_text: 'New activity' }));
});

it('refuses a no-change suggestion', async () => {
  mockPersistedNoChangeSuggestion(resource.id);
  expect((await POST(acceptRequest({ suggestion_id: suggestion.id }))).status).toBe(400);
});
```

- [ ] **Step 2: Make acceptance server-derived.**

Remove `new_content` from the accept request. Fetch the suggestion/resource server-side, re-run deterministic `applySuggestion`, update only the current resource text, then mark only that suggestion `accepted`. Return the updated resource summary.

- [ ] **Step 3: Refresh UI state after each write.**

After upload, review submission, accepted edit, or failed action, refresh the expanded resource data and table aggregates. Keep the latest successful preview visible if a later request fails. Ensure the Latest Update table value changes after a successful accepted edit.

- [ ] **Step 4: Add the manual regression script.**

Create `tests/manual/lokalbank-regression.md` with this exact matrix:

| Scenario | Expected result |
|---|---|
| Guest clicks Add Resource | In-page sign-in modal; no upload request. |
| Seeded teacher chooses a TXT/DOCX/PDF | File stage reports extracting, then publishing; valid file creates a row. |
| Unsupported/oversize file | Specific validation message; metadata remains present. |
| File extraction failure | Extraction-stage error; no resource row created. |
| Positive review | Groq returns a no-change result; no Accept edit button. |
| Explicit issue review | Groq identifies the quoted issue and offers one applicable edit. |
| Accept actionable edit | Preview/text export/Latest Update use the new canonical text. |
| Download PDF and TXT | Both contain the latest approved resource text. |

- [ ] **Step 5: Run the full verification set.**

Run: `npm run typecheck && npm test && npm run build`

Expected: all commands PASS. Then execute every manual regression row with the seeded Supabase account and a configured Groq key.

- [ ] **Step 6: Commit.**

```bash
git add src/app/api/bank/resources/[id]/accept/route.ts src/components/bank/ExpandedResourceRow.tsx src/components/bank/ResourceTable.tsx tests
git commit -m "fix: verify LokalBank edit and upload flows"
```

## Plan self-review

- **Spec coverage:** Tasks 2–5 cover manual metadata, upload reliability, public browse/seeded writes, review correctness, Groq-only issue analysis, applied edits, and current PDF/TXT exports. Task 1 removes the existing typecheck blocker.
- **No placeholders:** Every changed file, endpoint contract, test behavior, command, and commit is named above.
- **Type consistency:** The client sends only suggestion IDs/mode; the server owns canonical text, feedback retrieval, suggestion validation, and edit application. `outcome` controls all no-change/actionable UI behavior.
