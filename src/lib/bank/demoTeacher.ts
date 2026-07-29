import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export function getUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Server-only authorization helper for LokalBank protected routes.
 * Checks bearer token, verifies user session with Supabase Auth,
 * and ensures the authenticated user matches LOKALBANK_DEMO_TEACHER_ID.
 */
export async function requireDemoTeacher(
  req: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const demoTeacherId = process.env.LOKALBANK_DEMO_TEACHER_ID;
  if (!demoTeacherId) {
    console.error('LOKALBANK_DEMO_TEACHER_ID environment variable is not configured');
    return NextResponse.json(
      { error: 'LokalBank writer account configuration missing.', stage: 'configuration' },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in as the verified demo teacher.', stage: 'authorization' },
      { status: 401 }
    );
  }

  const userClient = getUserClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Invalid or expired session. Please sign in again.', stage: 'authorization' },
      { status: 401 }
    );
  }

  if (user.id !== demoTeacherId) {
    return NextResponse.json(
      { error: 'Only the verified demo teacher account can contribute resources or reviews.', stage: 'authorization' },
      { status: 403 }
    );
  }

  return { userId: user.id };
}
