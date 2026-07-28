import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';
import { requireDemoTeacher } from '@/src/lib/bank/demoTeacher';

// DELETE /api/bank/resources/[id]
// Authenticated (Seeded Teacher Only): delete a resource from the vault
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;

    const authResult = await requireDemoTeacher(req);
    if (authResult instanceof NextResponse) return authResult;

    if (!resourceId) {
      return NextResponse.json({ error: 'resource_id is required', stage: 'validation' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify resource exists
    const { data: resource, error: fetchErr } = await admin
      .from('bank_resources')
      .select('id, title')
      .eq('id', resourceId)
      .single();

    if (fetchErr || !resource) {
      return NextResponse.json({ error: 'Resource not found', stage: 'validation' }, { status: 404 });
    }

    // Delete reviews and suggestions associated with this resource first if not ON DELETE CASCADE
    await admin.from('bank_reviews').delete().eq('resource_id', resourceId);
    await admin.from('bank_ai_suggestions').delete().eq('resource_id', resourceId);

    // Delete resource
    const { error: deleteErr } = await admin
      .from('bank_resources')
      .delete()
      .eq('id', resourceId);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true, deleted_id: resourceId });
  } catch (err: any) {
    console.error('DELETE /api/bank/resources/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete resource' }, { status: 500 });
  }
}
