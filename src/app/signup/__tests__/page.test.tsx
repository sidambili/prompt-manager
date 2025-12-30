import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignUpPage from '../page';

const navigationMocks = vi.hoisted(() => {
  const useSearchParams = vi.fn((): { get: (key: string) => string | null } => ({
    get: (_key: string) => null,
  }))

  return { useSearchParams }
})

vi.mock('next/navigation', () => {
  return {
    useSearchParams: () => navigationMocks.useSearchParams(),
  }
})

vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

type SignUpResult = {
  data: { user: unknown | null; session: unknown | null };
  error: unknown | null;
};

type SupabaseClientMock = {
  auth: {
    signUp: (args: unknown) => Promise<SignUpResult>;
    signInWithOAuth: (args: unknown) => Promise<{ error: unknown | null }>;
  };
};

const supabaseMocks = vi.hoisted(() => {
  const signUp = vi.fn<SupabaseClientMock['auth']['signUp']>()
  const signInWithOAuth = vi.fn<SupabaseClientMock['auth']['signInWithOAuth']>()

  const client: SupabaseClientMock = {
    auth: {
      signUp,
      signInWithOAuth,
    },
  }

  return {
    signUp,
    signInWithOAuth,
    createClient: () => client,
  }
})

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => supabaseMocks.createClient(),
  }
})

const oauthMocks = vi.hoisted(() => {
  const useOAuthProviders = vi.fn(() => ({
    providers: { google: false, github: false },
    isLoading: false,
  }))

  return { useOAuthProviders }
})

vi.mock('@/lib/auth/hooks', () => {
  return {
    useOAuthProviders: () => oauthMocks.useOAuthProviders(),
  }
})

describe('SignUpPage', () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

  beforeEach(() => {
    supabaseMocks.signUp.mockReset();
    supabaseMocks.signInWithOAuth.mockReset();
    navigationMocks.useSearchParams.mockReset();
    navigationMocks.useSearchParams.mockReturnValue({
      get: (_key: string) => null,
    })
    alertSpy.mockClear();

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost/',
        origin: 'http://localhost',
        hostname: 'localhost',
      },
      writable: true,
    })
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signs up and navigates to redirect destination when session is returned', async () => {
    supabaseMocks.signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });

    navigationMocks.useSearchParams.mockReturnValue({
      get: (key: string) => (key === 'redirect' ? '/dashboard' : null),
    })

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(supabaseMocks.signUp).toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('alerts when user created but email confirmation required', async () => {
    supabaseMocks.signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    });

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(alertSpy).toHaveBeenCalled();
  });

  it('alerts when signup fails', async () => {
    supabaseMocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('failed'),
    });

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(alertSpy).toHaveBeenCalled();
  });
});
