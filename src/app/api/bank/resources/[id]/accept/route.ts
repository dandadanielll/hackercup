import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { createClient } from '@supabase/supabase-js';

function getUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/bank/resources/[id]/accept
// Authenticated: overwrite the canonical content_text with accepted AI suggestion
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;

    // Auth
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userClient = getUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { suggestion_id, new_content } = body;

    if (!new_content?.trim()) {
      return NextResponse.json({ error: 'new_content is required' }, { status: 400 });
    }
    if (new_content.length > 50000) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify user owns the resource
    const { data: resource, error: fetchErr } = await admin
      .from('bank_resources')
      .select('uploader_id')
      .eq('id', resourceId)
      .single();

    if (fetchErr || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    if (resource.uploader_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Overwrite content and update timestamp
    const { error: updateErr } = await admin
      .from('bank_resources')
      .update({ content_text: new_content.trim(), updated_at: new Date().toISOString() })
      .eq('id', resourceId);

    if (updateErr) throw updateErr;

    // Mark the suggestion as accepted
    if (suggestion_id) {
      await admin
        .from('bank_ai_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/bank/resources/[id]/accept error:', err);
    return NextResponse.json({ error: err.message || 'Failed to accept edit' }, { status: 500 });
  }
}
