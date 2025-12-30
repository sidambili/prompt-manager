import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignUpClient from '../SignUpClient';

const navigationMocks = vi.hoisted(() => {
  const useSearchParams = vi.fn((): { get: (key: string) => string | null } => ({
    get: (_key: string) => null,
  }))

  const push = vi.fn()
  const useRouter = vi.fn(() => ({ push }))

  return { useSearchParams, useRouter, push }
})

vi.mock('next/navigation', () => {
  return {
    useSearchParams: () => navigationMocks.useSearchParams(),
    useRouter: () => navigationMocks.useRouter(),
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

  const createClient = vi.fn(() => client)

  const client: SupabaseClientMock = {
    auth: {
      signUp,
      signInWithOAuth,
    },
  }

  return {
    signUp,
    signInWithOAuth,
    createClient,
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
    navigationMocks.useRouter.mockReset();
    navigationMocks.push.mockReset();
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

    navigationMocks.useRouter.mockReturnValue({ push: navigationMocks.push })

    const user = userEvent.setup();
    render(<SignUpClient />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(supabaseMocks.signUp).toHaveBeenCalled();
    expect(navigationMocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('alerts when user created but email confirmation required', async () => {
    supabaseMocks.signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    });

    const user = userEvent.setup();
    render(<SignUpClient />);

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
    render(<SignUpClient />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/signup failed/i);
  });

  it('shows OAuth not configured helper text when providers are disabled', async () => {
    render(<SignUpClient />);

    const githubButton = screen.getByRole('button', { name: /github/i });
    expect(githubButton).toBeDisabled();
    expect(screen.getByText(/github oauth not configured/i)).toBeInTheDocument();

    const googleButton = screen.getByRole('button', { name: /google/i });
    expect(googleButton).toBeDisabled();
    expect(screen.getByText(/google oauth not configured/i)).toBeInTheDocument();
  })
});
