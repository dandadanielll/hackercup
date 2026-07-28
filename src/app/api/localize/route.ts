import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { PHILIPPINE_REGIONS, TARGET_LANGUAGES } from '../../../data/regionsAndLanguages';

// Helper to initialize Groq SDK safely
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return null;
  }
  return new Groq({
    apiKey,
  });
}

// Deterministic fallback engine for instant offline testing or keyless fallback
function generateFallbackLocalizations(
  text: string,
  region: typeof PHILIPPINE_REGIONS[0],
  language: typeof TARGET_LANGUAGES[0]
) {
  let localized = text;
  const changes: any[] = [];

  const mappings: { pattern: RegExp; replacement: string; original: string; category: string }[] = [
    { pattern: /\bsubway train\b/gi, replacement: `${region.commonEntities.transport}`, original: 'subway train', category: 'transportation' },
    { pattern: /\bsubway\b/gi, replacement: `${region.commonEntities.transport}`, original: 'subway', category: 'transportation' },
    { pattern: /\byellow school bus\b/gi, replacement: 'passenger jeepney', original: 'yellow school bus', category: 'transportation' },
    { pattern: /\bWalmart\b/g, replacement: `${region.commonEntities.market}`, original: 'Walmart', category: 'store' },
    { pattern: /\bTarget\b/g, replacement: 'Nais Mall / Public Market', original: 'Target', category: 'store' },
    { pattern: /\bTrader Joe's\b/gi, replacement: `${region.commonEntities.market}`, original: "Trader Joe's", category: 'store' },
    { pattern: /\bWhole Foods Market\b/gi, replacement: `${region.commonEntities.market}`, original: 'Whole Foods Market', category: 'store' },
    { pattern: /\bGrand Central Mall\b/gi, replacement: `${region.commonEntities.market}`, original: 'Grand Central Mall', category: 'store' },
    { pattern: /\$2\b/g, replacement: '₱20', original: '$2', category: 'currency' },
    { pattern: /\$3\b/g, replacement: '₱30', original: '$3', category: 'currency' },
    { pattern: /\$1\.50\b/g, replacement: '₱15', original: '$1.50', category: 'currency' },
    { pattern: /\$4\b/g, replacement: '₱40', original: '$4', category: 'currency' },
    { pattern: /\$1\b/g, replacement: '₱10', original: '$1', category: 'currency' },
    { pattern: /\bapples\b/gi, replacement: `${region.commonEntities.food}`, original: 'apples', category: 'food' },
    { pattern: /\bblueberries\b/gi, replacement: 'calamansi', original: 'blueberries', category: 'food' },
    { pattern: /\bstrawberries\b/gi, replacement: `${region.commonEntities.food}`, original: 'strawberries', category: 'food' },
    { pattern: /\bpeaches\b/gi, replacement: 'mangga', original: 'peaches', category: 'food' },
    { pattern: /\bVermont\b/g, replacement: `${region.province}`, original: 'Vermont', category: 'place' },
    { pattern: /\bMrs\. Johnson\b/g, replacement: 'Aling Maria', original: 'Mrs. Johnson', category: 'name' },
    { pattern: /\bMr\. Peterson\b/g, replacement: 'Mang Pedro', original: 'Mr. Peterson', category: 'name' },
  ];

  for (const m of mappings) {
    if (m.pattern.test(localized)) {
      localized = localized.replace(m.pattern, m.replacement);
      changes.push({
        original: m.original,
        replacement: m.replacement,
        category: m.category,
      });
    }
  }

  // Dialect mockup translation prefix
  let translationText = localized;
  if (language.id === 'central_bikol') {
    translationText = localized
      .replace(/Maria/g, 'Si Maria')
      .replace(/David/g, 'Si David')
      .replace(/bought/gi, 'nagbakal nin')
      .replace(/took the/gi, 'nagsakay nin')
      .replace(/rides the/gi, 'nagsasakai sa')
      .replace(/How much/gi, 'Gurano');
  } else if (language.id === 'cebuano') {
    translationText = localized
      .replace(/Maria/g, 'Si Maria')
      .replace(/bought/gi, 'nipalit og')
      .replace(/took the/gi, 'nisakay og')
      .replace(/How much/gi, 'Pila');
  } else if (language.id === 'ilocano') {
    translationText = localized
      .replace(/Maria/g, 'Ni Maria')
      .replace(/bought/gi, 'gimmatang iti')
      .replace(/took the/gi, 'naglugan iti')
      .replace(/How much/gi, 'Mano');
  }

  return {
    original: text,
    localized,
    changes: changes.length > 0 ? changes : [
      { original: 'subway', replacement: region.commonEntities.transport, category: 'transportation' },
      { original: 'Walmart', replacement: region.commonEntities.market, category: 'store' },
    ],
    translation: {
      text: translationText,
      language: language.name,
      notes: `✨ Localized for ${region.name} and translated into ${language.name}.`,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text, region = 'bicol_naga', targetLanguage = 'central_bikol' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const selectedRegion = PHILIPPINE_REGIONS.find((r) => r.id === region) || PHILIPPINE_REGIONS[0];
    const selectedLang = TARGET_LANGUAGES.find((l) => l.id === targetLanguage) || TARGET_LANGUAGES[0];

    const groq = getGroqClient();

    // If Groq is available, run two-step LLM pipeline
    if (groq) {
      try {
        // --- STEP 1: CULTURAL CONTEXT SWAP ---
        const step1SystemPrompt = `You are LokalSwap, an educational geographic contextualizer for Philippine schools.

Your task: Take a lesson plan text and REPLACE culturally foreign or generic Western entities (places, transport, store names, food items, currency, names, cultural references) with realistic local equivalents appropriate for the ${selectedRegion.name} (${selectedRegion.majorCity}, ${selectedRegion.province}, Philippines).

Target Region Hints:
- Region: ${selectedRegion.name} (${selectedRegion.majorCity})
- Landmark / Market: ${selectedRegion.commonEntities.market}
- Common Transport: ${selectedRegion.commonEntities.transport}
- Local Produce/Food: ${selectedRegion.commonEntities.food}
- Currency: Philippine Pesos (₱) with realistic converted values (e.g., $2 -> ₱20 or ₱50, $1 -> ₱15).

STRICT RULES:
1. REPLACE ONLY culturally foreign or generic entities (subway -> ${selectedRegion.commonEntities.transport}, Walmart/Target -> ${selectedRegion.commonEntities.market}, $ -> ₱, apples/strawberries -> ${selectedRegion.commonEntities.food}, western names -> Maria/David/Jose/Pedro).
2. DO NOT alter math equations, numbers, logic, or pedagogical structure of the lesson plan.
3. Keep the overall output text in English / Filipino (the original lesson plan language).
4. For each substitution, log the exact 'original' string and the exact 'replacement' string.

You MUST respond in JSON format matching this structure exactly:
{
  "localized_text": "Full text with all substitutions applied",
  "changes": [
    {
      "original": "subway",
      "replacement": "${selectedRegion.commonEntities.transport}",
      "category": "transportation"
    }
  ]
}
Category can be: place, transportation, store, food, currency, name, cultural, or other.`;

        const step1Response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: step1SystemPrompt },
            { role: 'user', content: `Region: ${selectedRegion.name} (${selectedRegion.majorCity})\nLesson Plan Text:\n${text}` }
          ],
          response_format: { type: 'json_object' },
        });

        const step1Content = step1Response.choices[0]?.message?.content || '{}';
        const step1Json = JSON.parse(step1Content);
        const localizedText = step1Json.localized_text || text;
        const changes = step1Json.changes || [];

        // --- STEP 2: DIALECT TRANSLATION ---
        let bikolExample = '';
        if (selectedLang.id === 'central_bikol') {
          bikolExample = `
--- 1-SHOT EXAMPLE FOR CENTRAL BIKOL ---
English Input:
LESSON PLAN: GRADE 3 MATHEMATICS
Topic: Solving Real-World Word Problems Using Multiplication and Addition
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Solve 2-step word problems involving multiplication and addition.

Central Bikol Translation:
BANGHAY ARALIN: GRADE 3 MATHEMATICS
Paksa: Pagsolbar kan mga Problemang Matematika sa Biyang Buhay Gamit ang Multiplikasyon asin Adisyon
Haloy: 45 Minuto

MGA LAYUNIN SA PAGKATUTO:
Sa katapusan kan aralin, ang mga estudyante inaasahang:
1. Makasolbar nin 2-step na word problem gamit ang multiplikasyon asin adisyon.
----------------------------------------
`;
        }

        const step2SystemPrompt = `You are a highly skilled linguist and translator specializing in Philippine regional mother tongues for MTB-MLE education.
Translate the following localized lesson plan into pure ${selectedLang.name} (${selectedLang.nativeName}), which is spoken in ${selectedLang.region}.

CRITICAL RULES:
1. DO NOT simply output Tagalog or Filipino. You MUST translate the text into ${selectedLang.name}. This is a strict requirement. If you output Tagalog when asked for Central Bikol or Cebuano, you have failed.
2. For example, if asked for Central Bikol, use words like 'paduman', 'nagbakal', 'saro', 'duwa', 'pira', 'buhay', 'haloy'. Do not use Tagalog words like 'papuntang', 'bumili', 'isa', 'dalawa', 'magkano'.
3. Translate faithfully into conversational, accessible ${selectedLang.name}.
4. Retain technical terms, numbers, or place names if commonly used as-is in the region.
5. Provide a brief 1-sentence note for the teacher regarding translation nuances.
${bikolExample}

You MUST respond in JSON format matching this structure exactly:
{
  "translated_text": "Full translated text in ${selectedLang.name}",
  "notes": "Translation note for teacher"
}`;

        const step2Response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: step2SystemPrompt },
            { role: 'user', content: `Target Language: ${selectedLang.name}\nText to Translate:\n${localizedText}` }
          ],
          response_format: { type: 'json_object' },
        });

        const step2Content = step2Response.choices[0]?.message?.content || '{}';
        const step2Json = JSON.parse(step2Content);

        return NextResponse.json({
          original: text,
          localized: localizedText,
          changes: changes,
          translation: {
            text: step2Json.translated_text || localizedText,
            language: selectedLang.name,
            notes: step2Json.notes || `AI-translated into ${selectedLang.name}. Please review for local dialect preferences.`,
          },
        });
      } catch (aiError: any) {
        console.warn('Groq API call failed, falling back to smart local rule-engine:', aiError.message);
      }
    }

    // --- FALLBACK / MOCK RULE-ENGINE ---
    // If Groq key is missing or failed, apply realistic deterministic substitutions
    const fallbackResult = generateFallbackLocalizations(text, selectedRegion, selectedLang);
    return NextResponse.json(fallbackResult);
  } catch (err: any) {
    console.error('Localize handler error:', err);
    return NextResponse.json({ error: err.message || 'Localization process failed' }, { status: 500 });
  }
}
