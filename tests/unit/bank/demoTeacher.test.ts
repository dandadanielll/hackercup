import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { requireDemoTeacher } from '@/src/lib/bank/demoTeacher';
import { NextRequest } from 'next/server';

// Mock Supabase JS client
const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe('requireDemoTeacher', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, LOKALBANK_DEMO_TEACHER_ID: 'seeded-teacher-uuid' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns 500 configuration error if LOKALBANK_DEMO_TEACHER_ID is not set', async () => {
    delete process.env.LOKALBANK_DEMO_TEACHER_ID;
    const req = new NextRequest('http://localhost/api/bank/resources', {
      headers: { authorization: 'Bearer some-token' },
    });

    const res = await requireDemoTeacher(req);
    expect(res).not.toHaveProperty('userId');
    const response = res as any;
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.stage).toBe('configuration');
  });

  it('returns 401 if Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/bank/resources');
    const res = await requireDemoTeacher(req);
    const response = res as any;
    expect(response.status).toBe(401);
  });

  it('returns 401 if Supabase auth fails or user session is invalid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Invalid JWT') });
    const req = new NextRequest('http://localhost/api/bank/resources', {
      headers: { authorization: 'Bearer invalid-token' },
    });

    const res = await requireDemoTeacher(req);
    const response = res as any;
    expect(response.status).toBe(401);
  });

  it('returns 403 if authenticated user ID does not match LOKALBANK_DEMO_TEACHER_ID', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'unauthorized-other-user-uuid' } },
      error: null,
    });
    const req = new NextRequest('http://localhost/api/bank/resources', {
      headers: { authorization: 'Bearer token-for-other-user' },
    });

    const res = await requireDemoTeacher(req);
    const response = res as any;
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.stage).toBe('authorization');
  });

  it('returns userId object when authenticated user matches LOKALBANK_DEMO_TEACHER_ID', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'seeded-teacher-uuid' } },
      error: null,
    });
    const req = new NextRequest('http://localhost/api/bank/resources', {
      headers: { authorization: 'Bearer valid-teacher-token' },
    });

    const result = await requireDemoTeacher(req);
    expect(result).toEqual({ userId: 'seeded-teacher-uuid' });
  });
});
