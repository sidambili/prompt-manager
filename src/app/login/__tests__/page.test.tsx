import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '../page';

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

type SupabaseAuthMock = {
  signInWithPassword: (args: { email: string; password: string }) => Promise<{ error: unknown | null }>;
  signInWithOAuth: (args: unknown) => Promise<{ error: unknown | null }>;
};

type SupabaseClientMock = {
  auth: SupabaseAuthMock;
};

const supabaseMocks = vi.hoisted(() => {
  const signInWithPassword = vi.fn<SupabaseAuthMock['signInWithPassword']>()
  const signInWithOAuth = vi.fn<SupabaseAuthMock['signInWithOAuth']>()

  const client: SupabaseClientMock = {
    auth: {
      signInWithPassword,
      signInWithOAuth,
    },
  }

  return {
    signInWithPassword,
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

describe('LoginPage', () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

  beforeEach(() => {
    supabaseMocks.signInWithPassword.mockReset();
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
      },
      writable: true,
    })
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signs in with email/password and navigates to redirect destination', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValue({ error: null });
    navigationMocks.useSearchParams.mockReturnValue({
      get: (key: string) => (key === 'redirect' ? '/dashboard' : null),
    })

    navigationMocks.useRouter.mockReturnValue({ push: navigationMocks.push })

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(navigationMocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('alerts on email/password login error', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValue({ error: new Error('bad credentials') });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(alertSpy).toHaveBeenCalled();
  });

  it('disables OAuth button when provider is not configured', async () => {
    render(<LoginPage />);

    const githubButton = screen.getByRole('button', { name: /github/i });
    expect(githubButton).toBeDisabled();
    expect(screen.getByText(/github oauth not configured/i)).toBeInTheDocument();
    expect(supabaseMocks.signInWithOAuth).not.toHaveBeenCalled();
  });
});
