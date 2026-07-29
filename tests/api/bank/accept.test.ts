import { describe, expect, it, vi } from 'vitest';
import { POST } from '@/src/app/api/bank/resources/[id]/accept/route';
import { NextRequest } from 'next/server';

// Mock demo teacher auth to pass
vi.mock('@/src/lib/bank/demoTeacher', () => ({
  requireDemoTeacher: async () => ({ userId: 'seeded-teacher-uuid' }),
}));

// Mock Supabase admin client
const mockResourceUpdate = vi.fn().mockReturnValue({
  eq: () => ({
    select: () => ({
      single: async () => ({ data: { id: 'res-1', content_text: 'Updated lesson text.' }, error: null }),
    }),
  }),
});

const mockSuggestionUpdate = vi.fn().mockReturnValue({
  eq: async () => ({ error: null }),
});


vi.mock('@/src/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'bank_resources') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'res-1', content_text: 'Original lesson text.' },
                error: null,
              }),
            }),
          }),
          update: mockResourceUpdate,
        };
      }
      if (table === 'bank_ai_suggestions') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: 'sug-1',
                    resource_id: 'res-1',
                    suggestion_json: {
                      outcome: 'actionable',
                      feedback_summary: 'Fix title',
                      issue_identified: 'Needs title change',
                      evidence_from_review: 'Change to math',
                      edit_kind: 'replace',
                      target_excerpt: 'Original lesson text.',
                      replacement_text: 'Updated lesson text.',
                      teacher_action: 'Verify',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update: mockSuggestionUpdate,
        };
      }
      return {};
    },
  }),
}));

describe('POST /api/bank/resources/[id]/accept', () => {
  it('accepts a persisted actionable suggestion and updates content', async () => {
    const req = new NextRequest('http://localhost/api/bank/resources/res-1/accept', {
      method: 'POST',
      body: JSON.stringify({ suggestion_id: 'sug-1' }),
    });

    const params = Promise.resolve({ id: 'res-1' });
    const res = await POST(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockResourceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ content_text: 'Updated lesson text.' })
    );
  });
});
