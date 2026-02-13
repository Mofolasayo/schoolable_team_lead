import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { buildBackendUrl } from './backend-url';
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from './team-lead';

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

describe('team lead announcements', () => {
  let cookieStore: CookieStore;
  let authToken: string;

  beforeEach(() => {
    authToken = buildTestToken();
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('throws when auth token is missing', async () => {
    await expect(
      createAnnouncement({
        title: 'Update',
        content: 'Hello team',
        audience: 'Engineering',
      })
    ).rejects.toThrow('No authentication token found');
  });

  it('creates announcement with auth headers', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1', employeeId: 'TL-1' })
    );

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createAnnouncement({
      title: 'Update',
      content: 'Hello team',
      audience: 'Engineering',
      status: 'Published',
    });

    expect(result).toMatchObject({ id: 'ann-1' });
    expect(global.fetch).toHaveBeenCalledWith(
      buildBackendUrl('/announcements'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${authToken}`,
          'X-User-ID': 'lead-1',
        }),
      })
    );
  });

  it('creates a scheduled announcement for later publishing', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1', employeeId: 'TL-1' })
    );

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-2' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const scheduled_at = '2030-01-01T09:00:00.000Z';
    const result = await createAnnouncement({
      title: 'Scheduled Update',
      content: 'Hello later',
      audience: 'Engineering',
      status: 'Scheduled',
      scheduled_at,
    });

    expect(result).toMatchObject({ id: 'ann-2' });
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body).toMatchObject({
      status: 'Scheduled',
      scheduled_at,
    });
  });

  it('updates an announcement to publish later', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1', employeeId: 'TL-1' })
    );

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-1', status: 'Scheduled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const scheduled_at = '2030-01-01T09:00:00.000Z';
    const result = await updateAnnouncement('ann-1', {
      status: 'Scheduled',
      scheduled_at,
    });

    expect(result).toMatchObject({ id: 'ann-1', status: 'Scheduled' });
    expect(global.fetch).toHaveBeenCalledWith(
      buildBackendUrl('/announcements/ann-1'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: `Bearer ${authToken}`,
          'X-User-ID': 'lead-1',
        }),
      })
    );
  });

  it('deletes an announcement', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1', employeeId: 'TL-1' })
    );

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await deleteAnnouncement('ann-1');

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      buildBackendUrl('/announcements/ann-1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: `Bearer ${authToken}`,
          'X-User-ID': 'lead-1',
        }),
      })
    );
  });
});
