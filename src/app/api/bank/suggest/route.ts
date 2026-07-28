import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { requireDemoTeacher } from '@/src/lib/bank/demoTeacher';
import { validateAndParseSuggestion } from '@/src/lib/bank/suggestion';
import Groq from 'groq-sdk';

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') return null;
  return new Groq({ apiKey });
}

// POST /api/bank/suggest
// Authenticated (Seeded Teacher Only): generate a grounded suggestion from database canonical text & reviews
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireDemoTeacher(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { resource_id, mode, review_id } = body;

    if (!resource_id) {
      return NextResponse.json({ error: 'resource_id is required', stage: 'validation' }, { status: 400 });
    }
    if (mode !== 'review' && mode !== 'overall') {
      return NextResponse.json({ error: "mode must be 'review' or 'overall'", stage: 'validation' }, { status: 400 });
    }
    if (mode === 'review' && !review_id) {
      return NextResponse.json({ error: "review_id is required when mode is 'review'", stage: 'validation' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Fetch canonical resource content
    const { data: resource, error: resErr } = await admin
      .from('bank_resources')
      .select('id, title, content_text')
      .eq('id', resource_id)
      .single();

    if (resErr || !resource) {
      return NextResponse.json({ error: 'Resource not found', stage: 'validation' }, { status: 404 });
    }

    const canonicalText = resource.content_text;
    let feedbackSnapshot = '';

    if (mode === 'review') {
      const { data: review, error: revErr } = await admin
        .from('bank_reviews')
        .select('*')
        .eq('id', review_id)
        .eq('resource_id', resource_id)
        .single();

      if (revErr || !review) {
        return NextResponse.json({ error: 'Review not found or does not belong to this resource', stage: 'validation' }, { status: 404 });
      }
      feedbackSnapshot = `[Review by ${review.author_label} (${review.rating}/5 stars)]: ${review.comment}`;
    } else {
      // Overall mode: aggregate all reviews for this resource
      const { data: reviews, error: revsErr } = await admin
        .from('bank_reviews')
        .select('*')
        .eq('resource_id', resource_id)
        .order('created_at', { ascending: true });

      if (revsErr || !reviews || reviews.length === 0) {
        return NextResponse.json({ error: 'No reviews exist for this resource yet to generate an overall improvement.', stage: 'validation' }, { status: 400 });
      }
      feedbackSnapshot = reviews
        .map((r: any) => `[${r.author_label} - ${r.rating}/5 stars]: ${r.comment}`)
        .join('\n');
    }

    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json(
        { error: 'Groq API key is not configured on the server. AI suggestions are currently unavailable.', stage: 'configuration' },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a constructive educational editor assisting Filipino teachers.
Analyze a lesson resource and peer feedback to decide if a text edit is required.

CONTRACT:
1. If the feedback consists ONLY of praise, general positive comments, or vague remarks without requesting a specific change or improvement, you MUST set outcome="no_change".
2. Never invent an issue or problem that the reviewer did not explicitly raise.
3. For outcome="no_change", state why no edit is needed in reason_no_change.
4. For outcome="actionable", quote the exact evidence from the review in evidence_from_review, describe the issue in issue_identified, and provide one specific content edit.
5. If edit_kind="replace", target_excerpt MUST be an EXACT substring quoted verbatim from the resource text.

Respond in this exact JSON structure:
For NO CHANGE needed:
{
  "outcome": "no_change",
  "feedback_summary": "Summary of reviewer comments",
  "reason_no_change": "Explanation of why no content revision is necessary",
  "teacher_action": "Guidance for the teacher"
}

For ACTIONABLE edit needed:
{
  "outcome": "actionable",
  "feedback_summary": "Summary of reviewer feedback",
  "issue_identified": "Specific issue raised by reviewer",
  "evidence_from_review": "Verbatim quote or proof from feedback",
  "edit_kind": "replace" or "append",
  "target_excerpt": "Exact substring from resource text if replace, or null if append",
  "replacement_text": "New content text to insert or replace with",
  "teacher_action": "Guidance for the teacher before accepting"
}`;

    const userMessage = `RESOURCE TEXT:\n${canonicalText.slice(0, 15000)}\n\nPEER REVIEW FEEDBACK:\n${feedbackSnapshot}`;

    let groqContent = '';
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
      groqContent = response.choices[0]?.message?.content ?? '';
    } catch (aiErr: any) {
      console.error('Groq call failed:', aiErr);
      return NextResponse.json(
        { error: `Groq AI service unavailable: ${aiErr.message}`, stage: 'ai_generation' },
        { status: 503 }
      );
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(groqContent);
    } catch (jsonErr) {
      return NextResponse.json(
        { error: 'Groq returned invalid JSON output.', stage: 'ai_validation' },
        { status: 502 }
      );
    }

    let groundedSuggestion: any;
    try {
      groundedSuggestion = validateAndParseSuggestion(parsedJson, canonicalText);
    } catch (valErr: any) {
      console.warn('Grounded suggestion validation failed:', valErr.message);
      return NextResponse.json(
        { error: `AI suggestion failed validation: ${valErr.message}`, stage: 'ai_validation' },
        { status: 502 }
      );
    }

    // Persist the validated suggestion
    const { data: savedSuggestion, error: saveErr } = await admin
      .from('bank_ai_suggestions')
      .insert({
        resource_id,
        review_id: mode === 'review' ? review_id : null,
        feedback_snapshot: feedbackSnapshot.slice(0, 5000),
        suggestion_json: groundedSuggestion,
        status: 'pending',
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    return NextResponse.json({ suggestion: savedSuggestion }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/bank/suggest error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 });
  }
}
