import { describe, it, expect, vi, beforeEach } from 'vitest';

import { updateSession } from '../middleware';

// Mock the deployment module
const getDeploymentModeMock = vi.fn();
vi.mock('@/lib/deployment', () => ({
  getDeploymentMode: () => getDeploymentModeMock(),
}));

type NextUrl = {
  pathname: string;
  search: string;
  clone: () => NextUrl;
};

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (cookie: { name: string; value: string }) => void;
};

type NextRequestMock = {
  cookies: CookieStore;
  nextUrl: NextUrl;
};

const nextResponseNext = vi.fn();
const nextResponseRedirect = vi.fn();

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: (...args: unknown[]) => nextResponseNext(...args),
      redirect: (url: unknown) => nextResponseRedirect(url),
    },
  };
});

const getUser = vi.fn();

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: () => ({
      auth: {
        getUser,
      },
    }),
  };
});

function createRequest(pathname: string): NextRequestMock {
  const nextUrl: NextUrl = {
    pathname,
    search: '',
    clone: () => ({ ...nextUrl }),
  };

  return {
    cookies: {
      getAll: () => [],
      set: () => undefined,
    },
    nextUrl,
  };
}

describe('updateSession', () => {
  beforeEach(() => {
    nextResponseNext.mockReset();
    nextResponseRedirect.mockReset();
    getUser.mockReset();

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    
    // Default to cloud mode for existing tests
    getDeploymentModeMock.mockReturnValue('cloud');

    nextResponseNext.mockReturnValue({
      cookies: {
        set: vi.fn(),
        getAll: vi.fn(() => []),
      },
    });
  });

  it('redirects unauthenticated user from /dashboard to /login', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest('/dashboard');
    await updateSession(request as unknown as never);

    expect(nextResponseRedirect).toHaveBeenCalledTimes(1);
    const redirectUrl = nextResponseRedirect.mock.calls[0]?.[0] as NextUrl;
    expect(redirectUrl.pathname).toBe('/login');
    const params = new URLSearchParams(redirectUrl.search);
    expect(params.get('redirect')).toBe('/dashboard');
  });

  it('preserves existing query string when redirecting unauthenticated user from /dashboard', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest('/dashboard/prompts');
    request.nextUrl.search = '?tab=mine&page=2';

    await updateSession(request as unknown as never);

    expect(nextResponseRedirect).toHaveBeenCalledTimes(1);
    const redirectUrl = nextResponseRedirect.mock.calls[0]?.[0] as NextUrl;
    expect(redirectUrl.pathname).toBe('/login');
    const params = new URLSearchParams(redirectUrl.search);
    expect(params.get('redirect')).toBe('/dashboard/prompts?tab=mine&page=2');
  });

  it('redirects authenticated user from /login to /dashboard', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    const request = createRequest('/login');
    await updateSession(request as unknown as never);

    expect(nextResponseRedirect).toHaveBeenCalled();
  });

  it('does not redirect unauthenticated user on /login', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest('/login');
    await updateSession(request as unknown as never);

    expect(nextResponseRedirect).not.toHaveBeenCalled();
    expect(nextResponseNext).toHaveBeenCalled();
  });

  it('redirects to /auth/config-error when Supabase env vars are missing', async () => {
    vi.unstubAllEnvs()

    const request = createRequest('/dashboard');
    await updateSession(request as unknown as never);

    expect(nextResponseRedirect).toHaveBeenCalledTimes(1);
    const redirectUrl = nextResponseRedirect.mock.calls[0]?.[0] as NextUrl;
    expect(redirectUrl.pathname).toBe('/auth/config-error');
    const params = new URLSearchParams(redirectUrl.search);
    expect(params.get('missing')).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(params.get('missing')).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  describe('in self-hosted mode', () => {
    beforeEach(() => {
      getDeploymentModeMock.mockReturnValue('self-hosted');
    });

    it('redirects unauthenticated user from / to /login', async () => {
      getUser.mockResolvedValue({ data: { user: null } });

      const request = createRequest('/');
      await updateSession(request as unknown as never);

      expect(nextResponseRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = nextResponseRedirect.mock.calls[0]?.[0] as NextUrl;
      expect(redirectUrl.pathname).toBe('/login');
    });

    it('redirects authenticated user from / to /dashboard', async () => {
      getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

      const request = createRequest('/');
      await updateSession(request as unknown as never);

      expect(nextResponseRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = nextResponseRedirect.mock.calls[0]?.[0] as NextUrl;
      expect(redirectUrl.pathname).toBe('/dashboard');
    });

    it('does not redirect unauthenticated user from / when mode is cloud', async () => {
      getDeploymentModeMock.mockReturnValue('cloud');
      getUser.mockResolvedValue({ data: { user: null } });

      const request = createRequest('/');
      await updateSession(request as unknown as never);

      expect(nextResponseRedirect).not.toHaveBeenCalled();
      expect(nextResponseNext).toHaveBeenCalled();
    });
  });
});
