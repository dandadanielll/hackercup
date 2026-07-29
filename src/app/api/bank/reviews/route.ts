import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { requireDemoTeacher } from '@/src/lib/bank/demoTeacher';

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
// Authenticated (Seeded Teacher Only): submit a review for a resource
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireDemoTeacher(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const { resource_id, rating, comment, author_label } = body;

    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
    if (!comment?.trim()) return NextResponse.json({ error: 'comment is required' }, { status: 400 });
    if (comment.length > 2000) return NextResponse.json({ error: 'Comment too long (max 2,000 chars)' }, { status: 400 });

    const admin = getSupabaseAdmin();

    // Verify resource exists before attaching review
    const { data: resource, error: resErr } = await admin
      .from('bank_resources')
      .select('id')
      .eq('id', resource_id)
      .single();

    if (resErr || !resource) {
      return NextResponse.json({ error: 'Resource not found', stage: 'validation' }, { status: 404 });
    }

    const { data, error } = await admin
      .from('bank_reviews')
      .insert({
        resource_id,
        author_id: userId,
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

