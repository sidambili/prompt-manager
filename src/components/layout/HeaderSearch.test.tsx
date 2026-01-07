import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

import { HeaderSearch } from './HeaderSearch';

vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

type UserStub = { id: string };

vi.mock('@/components/layout/AuthProvider', () => {
  const user: UserStub = { id: 'u1' };
  return {
    useAuth: () => ({ user }),
  };
});

type PromptSearchResultStub = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  is_listed: boolean;
  user_id: string;
};

const searchMocks = vi.hoisted(() => {
  const setQuery = vi.fn<(value: string) => void>();

  const results: PromptSearchResultStub[] = [
    {
      id: 'p-owned',
      title: 'Owned Prompt',
      description: null,
      slug: 'owned-prompt',
      is_public: false,
      is_listed: false,
      user_id: 'u1',
    },
    {
      id: 'p-public',
      title: 'Public Prompt',
      description: null,
      slug: 'public-prompt',
      is_public: true,
      is_listed: true,
      user_id: 'u2',
    },
  ];

  return { setQuery, results };
});

vi.mock('@/hooks/usePromptSearch', () => {
  return {
    usePromptSearch: () => ({
      query: 'pro',
      setQuery: (value: string) => searchMocks.setQuery(value),
      results: searchMocks.results,
      isLoading: false,
      isSupabaseConfigured: true,
    }),
  };
});

describe('HeaderSearch', () => {
  it('routes all results to dashboard route when authenticated', () => {
    render(<HeaderSearch />);

    const input = document.getElementById('header-search-input');
    expect(input).toBeTruthy();

    fireEvent.focus(input as HTMLElement);

    const owned = document.getElementById('header-search-item-p-owned') as HTMLAnchorElement | null;
    expect(owned).toBeTruthy();
    expect(owned?.getAttribute('href')).toBe('/dashboard/prompts/p-owned');

    const publicItem = document.getElementById('header-search-item-p-public') as HTMLAnchorElement | null;
    expect(publicItem).toBeTruthy();
    expect(publicItem?.getAttribute('href')).toBe('/dashboard/prompts/p-public');

    // Ensure onChange is wired (smoke check)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new' } });
    expect(searchMocks.setQuery).toHaveBeenCalledWith('new');
  });
});
