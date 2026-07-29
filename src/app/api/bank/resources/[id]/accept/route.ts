import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { requireDemoTeacher } from '@/src/lib/bank/demoTeacher';
import { applySuggestion, GroundedSuggestion } from '@/src/lib/bank/suggestion';

// POST /api/bank/resources/[id]/accept
// Authenticated (Seeded Teacher Only): apply a validated persisted actionable suggestion
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;

    const authResult = await requireDemoTeacher(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { suggestion_id } = body;

    if (!suggestion_id) {
      return NextResponse.json({ error: 'suggestion_id is required', stage: 'validation' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Fetch canonical resource
    const { data: resource, error: fetchResErr } = await admin
      .from('bank_resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (fetchResErr || !resource) {
      return NextResponse.json({ error: 'Resource not found', stage: 'validation' }, { status: 404 });
    }

    // Fetch persisted suggestion
    const { data: suggestion, error: fetchSugErr } = await admin
      .from('bank_ai_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .eq('resource_id', resourceId)
      .single();

    if (fetchSugErr || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found or does not belong to this resource', stage: 'validation' }, { status: 404 });
    }

    const suggestionJson = suggestion.suggestion_json as GroundedSuggestion;
    if (suggestionJson.outcome === 'no_change') {
      return NextResponse.json({ error: 'Cannot accept a no-change suggestion.', stage: 'validation' }, { status: 400 });
    }

    // Deterministically derive new content text
    let newContentText: string;
    try {
      newContentText = applySuggestion(resource.content_text, suggestionJson);
    } catch (applyErr: any) {
      return NextResponse.json({ error: `Cannot apply suggestion: ${applyErr.message}`, stage: 'application' }, { status: 422 });
    }

    if (newContentText.length > 50000) {
      return NextResponse.json({ error: 'Updated content exceeds maximum limit (50,000 chars)', stage: 'validation' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update resource content & timestamp
    const { data: updatedResource, error: updateErr } = await admin
      .from('bank_resources')
      .update({ content_text: newContentText, updated_at: now })
      .eq('id', resourceId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Mark suggestion accepted
    await admin
      .from('bank_ai_suggestions')
      .update({ status: 'accepted' })
      .eq('id', suggestion_id);

    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (err: any) {
    console.error('POST /api/bank/resources/[id]/accept error:', err);
    return NextResponse.json({ error: err.message || 'Failed to accept edit' }, { status: 500 });
  }
}
