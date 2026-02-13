import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { getAuthToken, getCurrentUser, login } from './actions';

type CookieStore = {
  values: Map<string, string>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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
    delete: vi.fn((name: string) => {
      values.delete(name);
    }),
  };
}

function createLoginFormData() {
  const formData = new FormData();
  formData.set('email', 'lead@schoolable.com');
  formData.set('password', 'password123');
  return formData;
}

describe('team lead login actions', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('blocks non team lead users', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          token: 'token-123',
          profile: {
            id: 'user-1',
            email: 'user@schoolable.com',
            full_name: 'Test User',
            role: 'member',
            is_team_lead: false,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(login(createLoginFormData())).rejects.toThrow(
      'Access denied. This dashboard is for Team Leads only.'
    );
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('stores auth cookies for team leads', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          token: 'token-456',
          profile: {
            id: 'lead-1',
            employee_id: 'TL-1',
            email: 'lead@schoolable.com',
            full_name: 'Team Lead',
            role: 'manager',
            department: 'Engineering',
            is_team_lead: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await login(createLoginFormData());

    expect(result).toEqual({ ok: true });
    expect(cookieStore.values.get('teamlead-auth-token')).toBe('token-456');
    const userInfo = cookieStore.values.get('teamlead-user-info');
    expect(userInfo).toBeDefined();
    expect(JSON.parse(userInfo as string)).toMatchObject({
      id: 'lead-1',
      employeeId: 'TL-1',
      email: 'lead@schoolable.com',
      fullName: 'Team Lead',
      role: 'manager',
      department: 'Engineering',
      isTeamLead: true,
    });
  });

  it('returns auth token and user info from cookies', async () => {
    cookieStore.values.set('teamlead-auth-token', 'token-999');
    cookieStore.values.set(
      'teamlead-user-info',
      JSON.stringify({ id: 'lead-1' })
    );

    await expect(getAuthToken()).resolves.toBe('token-999');
    await expect(getCurrentUser()).resolves.toMatchObject({ id: 'lead-1' });
  });

  it('returns null for invalid user info cookie', async () => {
    cookieStore.values.set('teamlead-user-info', 'not-json');

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
