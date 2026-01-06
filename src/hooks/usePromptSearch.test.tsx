import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';

import { usePromptSearch } from './usePromptSearch';

type PromptSearchResult = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  is_listed: boolean;
  user_id: string;
};

type SupabaseResponse = {
  data: PromptSearchResult[] | null;
  error: null | { message: string };
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

let limitDeferreds: Array<Deferred<SupabaseResponse>> = [];

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        or: () => builder,
        ilike: () => builder,
        order: () => builder,
        limit: () => {
          const deferred = createDeferred<SupabaseResponse>();
          limitDeferreds.push(deferred);
          return deferred.promise;
        },
      };

      return {
        from: () => builder,
      };
    },
  };
});

function Harness(props: { debounceMs: number }) {
  const { query, setQuery, results, isLoading } = usePromptSearch({
    scope: 'public',
    debounceMs: props.debounceMs,
  });

  return (
    <div id="use-prompt-search-harness">
      <input
        id="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div id="loading">{String(isLoading)}</div>
      <div id="results-count">{String(results.length)}</div>
      <div id="results-json">{JSON.stringify(results)}</div>
    </div>
  );
}

describe('usePromptSearch', () => {
  beforeEach(() => {
    limitDeferreds = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns results for the latest query', async () => {
    render(<Harness debounceMs={10} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(limitDeferreds.length).toBe(1);

    await act(async () => {
      limitDeferreds[0].resolve({
        data: [
          {
            id: '1',
            title: 'Hello World',
            description: null,
            slug: 'hello-world',
            is_public: true,
            is_listed: true,
            user_id: 'u1',
          },
        ],
        error: null,
      });
    });

    expect(document.getElementById('loading')?.textContent).toBe('false');
    expect(document.getElementById('results-count')?.textContent).toBe('1');
  });

  it('does not apply stale results after clearing the query while a request is in-flight', async () => {
    render(<Harness debounceMs={10} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(limitDeferreds.length).toBe(1);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });

    await act(async () => {
      limitDeferreds[0].resolve({
        data: [
          {
            id: '1',
            title: 'Hello World',
            description: null,
            slug: 'hello-world',
            is_public: true,
            is_listed: true,
            user_id: 'u1',
          },
        ],
        error: null,
      });
    });

    expect(document.getElementById('results-count')?.textContent).toBe('0');
  });

  it('cleans up debounce on unmount (no request executed after unmount)', async () => {
    const { unmount } = render(<Harness debounceMs={50} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(limitDeferreds.length).toBe(0);
  });
});
