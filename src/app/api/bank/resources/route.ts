import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { RESOURCE_TYPES, SUBJECTS, GRADES } from '@/src/lib/bank/resourceInput';

function getUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/bank/resources
// Returns all published resources with avg_rating and review_count aggregated
export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('bank_resources')
      .select(`
        *,
        bank_reviews ( rating )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Compute aggregates
    const resources = (data ?? []).map((r: any) => {
      const reviews: { rating: number }[] = r.bank_reviews ?? [];
      const review_count = reviews.length;
      const avg_rating =
        review_count > 0
          ? reviews.reduce((sum: number, rv: { rating: number }) => sum + rv.rating, 0) / review_count
          : null;
      const { bank_reviews: _, ...rest } = r;
      return { ...rest, avg_rating, review_count };
    });

    return NextResponse.json({ resources });
  } catch (err: any) {
    console.error('GET /api/bank/resources error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load resources' }, { status: 500 });
  }
}

// POST /api/bank/resources
// Authenticated: save a new resource (text already extracted by the caller)
export async function POST(req: NextRequest) {
  try {
    // Validate auth via bearer token sent from the browser client
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.', stage: 'authorization' }, { status: 401 });
    }

    const userClient = getUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid auth token.', stage: 'authorization' }, { status: 401 });
    }

    const body = await req.json();
    const { teacher_name, title, resource_type, subject, grade_level, content_text } = body;

    // Strict metadata validation using resourceInput rules
    if (!teacher_name?.trim()) {
      return NextResponse.json({ error: 'Teacher Name is required.', stage: 'metadata' }, { status: 400 });
    }
    if (!title?.trim() || title.trim().length < 3) {
      return NextResponse.json({ error: 'Title must be at least 3 characters.', stage: 'metadata' }, { status: 400 });
    }
    if (!RESOURCE_TYPES.includes(resource_type)) {
      return NextResponse.json({ error: 'A manually selected resource type is required.', stage: 'metadata' }, { status: 400 });
    }
    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: 'A manually selected subject is required.', stage: 'metadata' }, { status: 400 });
    }
    if (!GRADES.includes(grade_level)) {
      return NextResponse.json({ error: 'A manually selected grade level is required.', stage: 'metadata' }, { status: 400 });
    }
    if (!content_text?.trim()) {
      return NextResponse.json({ error: 'Extracted content text is required.', stage: 'metadata' }, { status: 400 });
    }
    if (content_text.length > 50000) {
      return NextResponse.json({ error: 'Content exceeds max limit (50,000 characters).', stage: 'metadata' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('bank_resources')
      .insert({
        uploader_id: user.id,
        teacher_name: teacher_name.trim(),
        title: title.trim(),
        resource_type,
        subject,
        grade_level,
        content_text: content_text.trim(),
        is_published: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource: data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/bank/resources error:', err);
    return NextResponse.json({ error: err.message || 'Resource could not be saved. Try again.', stage: 'persistence' }, { status: 500 });
  }
}

