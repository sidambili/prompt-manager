import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '../page';

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

  it('signs in with email/password and navigates to /', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(window.location.href).toBe('/');
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
