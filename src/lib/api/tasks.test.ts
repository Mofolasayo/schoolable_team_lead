import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { buildBackendUrl } from './backend-url';
import { createTask } from './team-lead';

type CookieStore = {
  values: Map<string, string>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

function createCookieStore(): CookieStore {
  const values = new Map<string, string>();

  return {
    values,
    set: vi.fn((name: string, value: string) => {
      values.set(name, value);
    }),
    get: vi.fn((name: string) => {
      const value = values.get(name);
      return value ? { name, value } : undefined;
    }),
  };
}

function buildTestToken(expiresInSeconds = 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode(header)}.${encode(payload)}.signature`;
}

describe('team lead task actions', () => {
  let cookieStore: CookieStore;
  let authToken: string;

  beforeEach(() => {
    authToken = buildTestToken();
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('throws when auth token is missing', async () => {
    await expect(
      createTask({
        title: 'Assign task',
        description: 'Assign to team',
        assigneeId: 'user-1',
        assigneeIds: ['user-1', 'user-2'],
        organization: 'Engineering',
        priority: 'High',
      })
    ).rejects.toThrow('No authentication token found');
  });

  it('creates and assigns a task with auth headers', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1', employeeId: 'TL-1' })
    );

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'task-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createTask({
      title: 'Assign task',
      description: 'Assign to team',
      assigneeId: 'user-1',
      assigneeIds: ['user-1', 'user-2'],
      organization: 'Engineering',
      priority: 'High',
      dueDate: '2030-01-01',
    });

    expect(result).toMatchObject({ id: 'task-1' });
    expect(global.fetch).toHaveBeenCalledWith(
      buildBackendUrl('/tasks'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${authToken}`,
          'X-User-ID': 'lead-1',
        }),
      })
    );

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body).toMatchObject({
      assigneeId: 'user-1',
      assigneeIds: ['user-1', 'user-2'],
    });
  });
});
