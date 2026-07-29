import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { REGION_PROFILES, getRegionProfile } from '../../../data/regionsAndLanguages';
import { getCompetency, buildCompetencyMatch } from '../../../data/competencies';
import { getDemoFallback } from '../../../data/fallbackResponses';
import { REGION_KEYS, SUPPORTED_SUBJECTS, LocalizeResponse, ChangeItem } from '../../../types';

// ─── Zod Schema ──────────────────────────────────────────────────────────
const localizeSchema = z.object({
  text: z.string().min(1, 'Lesson text is required'),
  region: z.enum(REGION_KEYS),
  grade: z.number().int().min(1).max(6),
  subject: z.enum(SUPPORTED_SUBJECTS),
  quarter: z.number().int().min(1).max(4),
});

// ─── Groq Client ─────────────────────────────────────────────────────────
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('MY_')) return null;
  return new Groq({ apiKey });
}

// ─── Timeout helper ───────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Fallback rule-engine ─────────────────────────────────────────────────
function buildRuleEngineFallback(
  text: string,
  regionKey: string,
  grade: number,
  subject: string,
  quarter: number
): LocalizeResponse {
  const region = getRegionProfile(regionKey as any);
  let localized = text;
  const changes: ChangeItem[] = [];

  const mappings: { pattern: RegExp; replacement: string; original: string; entityType: string }[] = [
    { pattern: /\bsubway(?: train)?\b/gi, replacement: region.knownEntities.transport[0], original: 'subway train', entityType: 'transport' },
    { pattern: /\byellow school bus\b/gi, replacement: region.knownEntities.transport[0], original: 'yellow school bus', entityType: 'transport' },
    { pattern: /\bWalmart\b/g, replacement: region.knownEntities.places[0], original: 'Walmart', entityType: 'place' },
    { pattern: /\bTarget\b/g, replacement: region.knownEntities.places[0], original: 'Target', entityType: 'place' },
    { pattern: /\bTrader Joe's\b/gi, replacement: region.knownEntities.places[0], original: "Trader Joe's", entityType: 'place' },
    { pattern: /\bWhole Foods Market\b/gi, replacement: region.knownEntities.places[0], original: 'Whole Foods Market', entityType: 'place' },
    { pattern: /\bGrand Central Mall\b/gi, replacement: region.knownEntities.places[0], original: 'Grand Central Mall', entityType: 'place' },
    { pattern: /\$2\b/g, replacement: '₱20', original: '$2', entityType: 'currency' },
    { pattern: /\$3\b/g, replacement: '₱30', original: '$3', entityType: 'currency' },
    { pattern: /\$1\.50\b/g, replacement: '₱15', original: '$1.50', entityType: 'currency' },
    { pattern: /\$4\b/g, replacement: '₱40', original: '$4', entityType: 'currency' },
    { pattern: /\$1\b/g, replacement: '₱10', original: '$1', entityType: 'currency' },
    { pattern: /\bapples\b/gi, replacement: region.knownEntities.food[0], original: 'apples', entityType: 'food' },
    { pattern: /\bstrawberries\b/gi, replacement: region.knownEntities.food[0], original: 'strawberries', entityType: 'food' },
    { pattern: /\bpeaches\b/gi, replacement: 'mangga', original: 'peaches', entityType: 'food' },
    { pattern: /\bMrs\. Johnson\b/g, replacement: 'Aling Maria', original: 'Mrs. Johnson', entityType: 'character_name' },
    { pattern: /\bMr\. Peterson\b/g, replacement: 'Mang Pedro', original: 'Mr. Peterson', entityType: 'character_name' },
  ];

  for (const m of mappings) {
    m.pattern.lastIndex = 0;
    if (m.pattern.test(localized)) {
      m.pattern.lastIndex = 0;
      localized = localized.replace(m.pattern, m.replacement);
      changes.push({ original: m.original, replacement: m.replacement, category: 'entity', entityType: m.entityType as any });
    }
  }

  const competencyEntry = getCompetency(grade, subject, quarter);
  const competencyMatch = buildCompetencyMatch(competencyEntry);

  return {
    original: text,
    localized,
    changes: changes.length > 0 ? changes : [
      { original: 'subway', replacement: region.knownEntities.transport[0], category: 'entity', entityType: 'transport' },
      { original: 'Walmart', replacement: region.knownEntities.places[0], category: 'entity', entityType: 'place' },
    ],
    translation: {
      text: localized,
      language: region.motherTongue,
      notes: `Rule-engine fallback for ${region.name}. AI translation unavailable — review before classroom use.`,
    },
    competencyMatch,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = localizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { text, region, grade, subject, quarter } = parsed.data;

    // 2. Guard: empty or nonsense
    if (text.trim().length === 0) {
      return NextResponse.json({ error: 'Lesson text cannot be empty' }, { status: 400 });
    }
    // Truncate extremely long inputs gracefully
    const safeText = text.length > 30_000 ? text.slice(0, 30_000) : text;

    // 3. Derive region profile + language server-side
    const regionProfile = getRegionProfile(region);
    const { motherTongue, motherTongueLabel } = regionProfile;

    // 4. Competency grounding
    const competencyEntry = getCompetency(grade, subject, quarter);
    const competencyMatch = buildCompetencyMatch(competencyEntry);
    const competencyBlock = competencyEntry
      ? `\nThis lesson plan is targeting the following official DepEd MATATAG competency:\n"${competencyEntry.competencyText}" (Code: ${competencyEntry.competencyCode})\nIf the uploaded lesson plan does NOT align with this competency, flag the misalignment as an "alignmentNote" in your JSON — do not silently rewrite the learning objective.\n`
      : '';

    // 5. Attempt live Groq call with retry + timeout fallback
    const groq = getGroqClient();

    const attempt = async (): Promise<LocalizeResponse> => {
      if (!groq) throw new Error('Groq not configured');

      // ── STEP 1: Two-layer contextualization ──
      const step1Prompt = `You are LokalSwap, an educational geographic contextualizer for Philippine schools using the MTB-MLE framework.

You are contextualizing a lesson plan for ${regionProfile.name}, Philippines.

Region profile:
- Environment: ${regionProfile.environmentDescriptor}
- Known transport: ${regionProfile.knownEntities.transport.join(', ')}
- Known places: ${regionProfile.knownEntities.places.join(', ')}
- Known food/items: ${regionProfile.knownEntities.food.join(', ')}
${competencyBlock}
Your task has TWO layers:

1. ENTITY SUBSTITUTION: Replace foreign/generic place names, transport modes, food items, currency, and character names with regionally authentic equivalents from the profile above.
   - Currency: convert $ to ₱ at realistic local rates (e.g., $2 → ₱20, $1 → ₱10)
   - Transport: replace subway/bus with ${regionProfile.knownEntities.transport[0]}
   - Stores: replace Walmart/Target/Trader Joe's with ${regionProfile.knownEntities.places[0]}
   - Food: replace apples/strawberries/blueberries with ${regionProfile.knownEntities.food[0]}
   - Names: replace Western names (Maria, David, Alex, Mrs. Johnson) with Filipino equivalents

2. SCENARIO REFRAMING: Where the lesson uses an example, word problem, or scenario to illustrate a concept, reframe it around something authentic to this region's environment and livelihood — not just noun-swapping. For example, in a fishing/coastal region, a counting or arithmetic scenario should be framed around fish catch, market weighing, or boat trip rather than a generic store scenario with swapped item names.

PRESERVE:
- The underlying learning objective and competency (do not change what skill is being taught)
- The overall structure (do not add or remove questions)
- Numbers/quantities unless the scenario reframe requires a logical adjustment

Respond ONLY with valid JSON matching this exact structure:
{
  "localized_text": "Full localized text",
  "changes": [
    { "original": "subway", "replacement": "${regionProfile.knownEntities.transport[0]}", "category": "entity", "entityType": "transport" },
    { "original": "Alex bought 5 packages of strawberries...", "replacement": "reframed scenario text", "category": "scenario_reframe" }
  ],
  "alignmentNote": "Only populate this if you detected a mismatch with the target competency, otherwise omit or set to null"
}
Category must be exactly "entity" or "scenario_reframe". entityType (for entity category only): transport | place | food | currency | character_name | other.`;

      const step1 = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: step1Prompt },
          { role: 'user', content: `Region: ${regionProfile.name}\nLesson Plan:\n${safeText}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const s1 = JSON.parse(step1.choices[0]?.message?.content || '{}');
      const localizedText: string = s1.localized_text || safeText;
      const rawChanges: any[] = s1.changes || [];
      const alignmentNote: string | null = s1.alignmentNote || null;

      // Normalise changes
      const changes: ChangeItem[] = rawChanges
        .map((c: any): ChangeItem => ({
          original: c.original || '',
          replacement: c.replacement || '',
          category: (c.category === 'scenario_reframe' ? 'scenario_reframe' : 'entity') as 'entity' | 'scenario_reframe',
          entityType: c.entityType,
        }))
        .filter((c) => c.original && c.replacement);

      // ── STEP 2: Mother-tongue translation ──
      const bikolExample = motherTongue === 'Central Bikol'
        ? `\n--- 1-SHOT EXAMPLE ---\nEnglish: "Maria bought 3 apples at the market. How much did she spend?"\nCentral Bikol: "Si Maria nagbakal nin 3 pirasong mansanas sa merkado. Gurano an nagastos niya?"\n---`
        : '';

      const step2Prompt = `You are a skilled linguist specializing in Philippine regional mother tongues for MTB-MLE education.
Translate the following lesson plan text into ${motherTongue} (${motherTongueLabel}).

STRICT RULES:
1. Output ONLY in ${motherTongue} — not Tagalog/Filipino unless ${motherTongue} IS Filipino.
2. Use authentic vocabulary: ${motherTongue === 'Central Bikol' ? "'paduman', 'nagbakal', 'gurano', 'pira', 'haloy'" : motherTongue === 'Cebuano' ? "'padulong', 'nipalit', 'pila', 'gikan'" : "'papunta', 'bumili', 'magkano', 'mula'"}.
3. Keep numbers, competency codes, and proper nouns as-is.
4. Provide a 1-sentence teacher note on translation nuances.${bikolExample}

Respond ONLY with JSON:
{
  "translated_text": "Full text in ${motherTongue}",
  "notes": "Brief teacher note"
}`;

      const step2 = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: step2Prompt },
          { role: 'user', content: `Language: ${motherTongue}\nText:\n${localizedText}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const s2 = JSON.parse(step2.choices[0]?.message?.content || '{}');

      const finalCompetencyMatch = {
        ...competencyMatch,
        ...(alignmentNote ? { alignmentNote } : {}),
      };

      return {
        original: safeText,
        localized: localizedText,
        changes,
        translation: {
          text: s2.translated_text || localizedText,
          language: motherTongue,
          notes: s2.notes || `AI-translated into ${motherTongue}. Please review for local dialect preferences.`,
        },
        competencyMatch: finalCompetencyMatch,
      };
    };

    // Try once, retry once on failure, then check demo fallback, then rule-engine
    let result: LocalizeResponse | null = null;
    let lastError: string | null = null;

    for (let attempt_num = 0; attempt_num < 2; attempt_num++) {
      try {
        result = await withTimeout(attempt(), 25_000);
        break;
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Groq attempt ${attempt_num + 1} failed:`, e.message);
        // Small delay before retry
        if (attempt_num === 0) await new Promise(r => setTimeout(r, 1_000));
      }
    }

    if (!result) {
      // Try demo fallback
      const cached = getDemoFallback(grade, subject, region);
      if (cached) {
        console.info('Serving demo fallback for:', { grade, subject, region });
        return NextResponse.json(cached);
      }
      // Final: rule-engine
      console.warn('Falling back to rule-engine. Last error:', lastError);
      result = buildRuleEngineFallback(safeText, region, grade, subject, quarter);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Localize handler critical error:', err);
    return NextResponse.json(
      { error: err.message || 'Localization process failed unexpectedly' },
      { status: 500 }
    );
  }
}
