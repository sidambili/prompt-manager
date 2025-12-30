import { describe, it, expect, vi, beforeEach } from 'vitest';

import { updateSession } from '../middleware';

type NextUrl = {
  pathname: string;
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
      redirect: (url: string) => nextResponseRedirect(url),
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

    expect(nextResponseRedirect).toHaveBeenCalled();
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
});
