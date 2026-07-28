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

// GET /api/bank/reviews?resource_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resource_id');

  if (!resourceId) {
    return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('bank_reviews')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ reviews: data ?? [] });
  } catch (err: any) {
    console.error('GET /api/bank/reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load reviews' }, { status: 500 });
  }
}

// POST /api/bank/reviews
// Authenticated: submit a review for a resource
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userClient = getUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { resource_id, rating, comment, author_label } = body;

    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
    if (!comment?.trim()) return NextResponse.json({ error: 'comment is required' }, { status: 400 });
    if (comment.length > 2000) return NextResponse.json({ error: 'Comment too long (max 2,000 chars)' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('bank_reviews')
      .insert({
        resource_id,
        author_id: user.id,
        author_label: (author_label || 'Teacher').trim(),
        rating: Number(rating),
        comment: comment.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/bank/reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
