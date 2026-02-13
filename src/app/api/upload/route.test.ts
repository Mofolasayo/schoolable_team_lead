import { beforeEach, describe, expect, it, vi } from 'vitest';
const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { buildBackendUrl } from '@/lib/api/backend-url';
import { POST } from './route';

type CookieStore = {
  values: Map<string, string>;
  get: ReturnType<typeof vi.fn>;
};

function createCookieStore(): CookieStore {
  const values = new Map<string, string>();

  return {
    values,
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

describe('team lead upload route', () => {
  let cookieStore: CookieStore;
  let authToken: string;

  beforeEach(() => {
    authToken = buildTestToken();
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('returns unauthorized when token is missing', async () => {
    const formData = { get: () => null } as unknown as FormData;
    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=team-reports'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Unauthorized',
    });
  });

  it('returns bad request when file is missing', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);

    const formData = { get: () => null } as unknown as FormData;
    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=team-reports'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'No file provided',
    });
  });

  it('uploads document to backend storage', async () => {
    cookieStore.values.set('teamlead-auth-token', authToken);

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ url: 'https://cdn.example.com/report.pdf' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const file = Object.assign(
      new Blob(['content'], { type: 'application/pdf' }),
      {
        name: 'report.pdf',
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }
    );
    const formData = { get: () => file } as unknown as FormData;

    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=team-reports'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      url: 'https://cdn.example.com/report.pdf',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      buildBackendUrl('/storage/upload?folder=team-reports'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
    );
  });
});
