import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

function getUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') return null;
  return new Groq({ apiKey });
}

// POST /api/bank/suggest
// Authenticated: generate a structured AI suggestion from resource text + review feedback
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userClient = getUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { resource_id, review_id, resource_text, feedback } = body;

    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
    if (!resource_text?.trim()) return NextResponse.json({ error: 'resource_text is required' }, { status: 400 });
    if (!feedback?.trim()) return NextResponse.json({ error: 'feedback is required' }, { status: 400 });

    const systemPrompt = `You are a constructive educational content editor assisting Filipino teachers.
Your job: analyze a lesson resource and specific reviewer feedback, then produce ONE concrete, content-only improvement suggestion.

STRICT RULES:
1. Base your suggestion ONLY on the resource text and the reviewer feedback provided.
2. Do NOT invent facts, standards codes, or citation-based claims that are not in the resource.
3. Do NOT apply the change automatically. Present it as a draft for teacher review.
4. Keep the proposed_edit as a complete replacement of the relevant section, or the full resource text with the edit applied.
5. Keep proposed_edit under 5,000 characters.

Respond in this exact JSON format:
{
  "feedback_addressed": "One sentence describing which part of the reviewer's feedback you are addressing.",
  "issue_identified": "One sentence describing the concrete problem in the resource.",
  "proposed_edit": "The full resource text with your suggested content edit applied. Label your changes clearly with [SUGGESTED:] tags.",
  "teacher_action": "One sentence of guidance for the teacher on what to consider before accepting."
}`;

    const userMessage = `REVIEWER FEEDBACK:\n${feedback}\n\nRESOURCE TEXT:\n${resource_text.slice(0, 15000)}`;

    let suggestionJson: any;

    const groq = getGroqClient();
    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });
        suggestionJson = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch (aiErr: any) {
        console.warn('Groq call failed, using fallback:', aiErr.message);
        suggestionJson = null;
      }
    }

    // Fallback if Groq unavailable
    if (!suggestionJson) {
      suggestionJson = {
        feedback_addressed: "The reviewer's general feedback about the resource content.",
        issue_identified: "The resource could benefit from more locally relevant examples and clearer activity instructions.",
        proposed_edit: resource_text + "\n\n[SUGGESTED: Add a locally-themed word problem or activity based on reviewer feedback above.]",
        teacher_action: "Review the suggested addition and adapt it to match your students' local context before accepting.",
      };
    }

    // Validate keys exist
    const required = ['feedback_addressed', 'issue_identified', 'proposed_edit', 'teacher_action'];
    for (const key of required) {
      if (!suggestionJson[key]) {
        suggestionJson[key] = 'AI could not generate this field. Please try again.';
      }
    }

    // Persist the suggestion
    const admin = getSupabaseAdmin();
    const { data: savedSuggestion, error: saveErr } = await admin
      .from('bank_ai_suggestions')
      .insert({
        resource_id,
        review_id: review_id ?? null,
        feedback_snapshot: feedback.slice(0, 5000),
        suggestion_json: suggestionJson,
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
