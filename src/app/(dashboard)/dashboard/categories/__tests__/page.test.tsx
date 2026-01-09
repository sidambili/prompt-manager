import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CategoriesPage from '../page';

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

type SupabaseError = {
  message: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_rank: number;
  is_public: boolean;
  user_id: string;
  subcategories: SubcategoryRow[];
};

type SubcategoryRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  sort_rank: number;
};

type PostgrestResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};

type InsertCategoryPayload = {
  name: string;
  slug: string;
  sort_rank: number;
  is_public: boolean;
  user_id: string;
};

type InsertSubcategoryPayload = {
  name: string;
  slug: string;
  category_id: string;
  sort_rank: number;
};

type CategoriesQueryBuilder = {
  select: (columns: string) => CategoriesQueryBuilder;
  order: (column: string, opts: { ascending: boolean }) => Promise<PostgrestResult<CategoryRow[]>>;
  delete: () => CategoriesQueryBuilder;
  update: (payload: Partial<CategoryRow>) => CategoriesQueryBuilder;
  insert: (payload: InsertCategoryPayload[]) => Promise<PostgrestResult<null>>;
  eq: (column: string, value: string) => Promise<PostgrestResult<null>>;
};

type SubcategoriesQueryBuilder = {
  insert: (payload: InsertSubcategoryPayload[]) => Promise<PostgrestResult<null>>;
  update: (payload: Partial<SubcategoryRow>) => SubcategoriesQueryBuilder;
  eq: (column: string, value: string) => Promise<PostgrestResult<null>>;
};

type SupabaseFromFn = {
  (table: 'categories'): CategoriesQueryBuilder;
  (table: 'subcategories'): SubcategoriesQueryBuilder;
};

type SupabaseClientMock = {
  from: SupabaseFromFn;
  rpc: (
    fn: 'delete_subcategory_reassign_prompts',
    args: { p_subcategory_id: string }
  ) => Promise<PostgrestResult<null>>;
};

vi.mock('next/link', () => {
  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

const toastMocks = vi.hoisted(() => {
  const success = vi.fn<ToastApi['success']>();
  const error = vi.fn<ToastApi['error']>();
  return { success, error };
});

vi.mock('sonner', () => {
  return {
    toast: {
      success: (message: string) => toastMocks.success(message),
      error: (message: string) => toastMocks.error(message),
    },
  };
});

type UserStub = { id: string };

const authMocks = vi.hoisted(() => {
  const useAuth = vi.fn<() => { user: UserStub | null }>();
  return { useAuth };
});

vi.mock('@/components/layout/AuthProvider', () => {
  return {
    useAuth: () => authMocks.useAuth(),
  };
});

const supabaseMocks = vi.hoisted(() => {
  const categoriesSelect = vi.fn<CategoriesQueryBuilder['select']>();
  const categoriesOrder = vi.fn<CategoriesQueryBuilder['order']>();
  const categoriesDelete = vi.fn<CategoriesQueryBuilder['delete']>();
  const categoriesUpdate = vi.fn<CategoriesQueryBuilder['update']>();
  const categoriesInsert = vi.fn<CategoriesQueryBuilder['insert']>();
  const categoriesEq = vi.fn<CategoriesQueryBuilder['eq']>();

  const subcategoriesInsert = vi.fn<SubcategoriesQueryBuilder['insert']>();
  const subcategoriesUpdate = vi.fn<SubcategoriesQueryBuilder['update']>();
  const subcategoriesEq = vi.fn<SubcategoriesQueryBuilder['eq']>();

  const rpc = vi.fn<SupabaseClientMock['rpc']>();

  const categoriesBuilder: CategoriesQueryBuilder = {
    select: (columns: string) => categoriesSelect(columns),
    order: (column: string, opts: { ascending: boolean }) => categoriesOrder(column, opts),
    delete: () => categoriesDelete(),
    update: (payload: Partial<CategoryRow>) => categoriesUpdate(payload),
    insert: (payload: InsertCategoryPayload[]) => categoriesInsert(payload),
    eq: (column: string, value: string) => categoriesEq(column, value),
  };

  const subcategoriesBuilder: SubcategoriesQueryBuilder = {
    insert: (payload: InsertSubcategoryPayload[]) => subcategoriesInsert(payload),
    update: (payload: Partial<SubcategoryRow>) => subcategoriesUpdate(payload),
    eq: (column: string, value: string) => subcategoriesEq(column, value),
  };

  const client: SupabaseClientMock = {
    from: ((table: string) => {
      if (table === 'categories') return categoriesBuilder;
      if (table === 'subcategories') return subcategoriesBuilder;
      throw new Error(`Unexpected table: ${table}`);
    }) as SupabaseFromFn,
    rpc: (fn: 'delete_subcategory_reassign_prompts', args: { p_subcategory_id: string }) =>
      rpc(fn, args),
  };

  const createClient = vi.fn(() => client);

  return {
    createClient,
    client,
    categoriesBuilder,
    subcategoriesBuilder,
    categoriesSelect,
    categoriesOrder,
    categoriesDelete,
    categoriesUpdate,
    categoriesInsert,
    categoriesEq,
    subcategoriesInsert,
    subcategoriesUpdate,
    subcategoriesEq,
    rpc,
  };
});

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => supabaseMocks.createClient(),
  };
});

async function waitForInitialFetch(): Promise<void> {
  await waitFor(() => {
    expect(supabaseMocks.categoriesOrder).toHaveBeenCalled();
  });
}

async function waitForCategoryCard(name: string): Promise<void> {
  await screen.findByText(name);
}

describe('/dashboard/categories', () => {
  const confirmSpy = vi.spyOn(window, 'confirm');

  beforeEach(() => {
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();

    authMocks.useAuth.mockReset();

    supabaseMocks.categoriesSelect.mockReset();
    supabaseMocks.categoriesOrder.mockReset();
    supabaseMocks.categoriesDelete.mockReset();
    supabaseMocks.categoriesUpdate.mockReset();
    supabaseMocks.categoriesInsert.mockReset();
    supabaseMocks.categoriesEq.mockReset();
    supabaseMocks.subcategoriesInsert.mockReset();
    supabaseMocks.subcategoriesUpdate.mockReset();
    supabaseMocks.subcategoriesEq.mockReset();
    supabaseMocks.rpc.mockReset();

    confirmSpy.mockReset();

    supabaseMocks.categoriesSelect.mockImplementation(() => supabaseMocks.categoriesBuilder);
    supabaseMocks.categoriesDelete.mockImplementation(() => supabaseMocks.categoriesBuilder);
    supabaseMocks.categoriesUpdate.mockImplementation(() => supabaseMocks.categoriesBuilder);
    supabaseMocks.subcategoriesUpdate.mockImplementation(() => supabaseMocks.subcategoriesBuilder);

    // Default response for any unexpected refresh calls.
    supabaseMocks.categoriesOrder.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    // no-op
  });

  it('renders categories and filters by search across categories and subcategories', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });

    const cats: CategoryRow[] = [
      {
        id: 'cat-1',
        name: 'Marketing',
        slug: 'marketing',
        sort_rank: 0,
        is_public: false,
        user_id: 'u1',
        subcategories: [
          { id: 'sub-1', name: 'Email', slug: 'email', category_id: 'cat-1', sort_rank: 0 },
        ],
      },
      {
        id: 'cat-2',
        name: 'Engineering',
        slug: 'engineering',
        sort_rank: 1,
        is_public: false,
        user_id: 'u1',
        subcategories: [],
      },
    ];

    supabaseMocks.categoriesOrder.mockResolvedValueOnce({ data: cats, error: null });

    const user = userEvent.setup();

    render(<CategoriesPage />);

    await waitForInitialFetch();

    await waitForCategoryCard('Marketing');

    expect(await screen.findByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/search categories and subcategories/i),
      'email'
    );

    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
  });

  it('shows read-only state when user does not own the category', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });

    const cats: CategoryRow[] = [
      {
        id: 'cat-1',
        name: 'Shared',
        slug: 'shared',
        sort_rank: 0,
        is_public: false,
        user_id: 'u2',
        subcategories: [
          { id: 'sub-1', name: 'Email', slug: 'email', category_id: 'cat-1', sort_rank: 0 },
        ],
      },
    ];

    supabaseMocks.categoriesOrder.mockResolvedValueOnce({ data: cats, error: null });

    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitForInitialFetch();

    await waitForCategoryCard('Shared');

    const addSubButton = document.getElementById('add-sub-btn-cat-1') as HTMLButtonElement | null;
    expect(addSubButton).not.toBeNull();
    expect(addSubButton).toBeDisabled();

    const deleteSubButton = document.getElementById(
      'delete-subcategory-btn-sub-1'
    ) as HTMLButtonElement | null;
    expect(deleteSubButton).not.toBeNull();
    expect(deleteSubButton).toBeDisabled();

    const categoryMenuTrigger = document.getElementById(
      'category-menu-cat-1'
    ) as HTMLButtonElement | null;
    expect(categoryMenuTrigger).not.toBeNull();

    await user.click(categoryMenuTrigger as HTMLButtonElement);

    expect(await screen.findByText(/read-only/i)).toBeInTheDocument();
  });

  it('creates a category and refreshes the list', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });

    supabaseMocks.categoriesOrder
      .mockResolvedValueOnce({
        data: [],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'cat-1',
            name: 'Marketing',
            slug: 'marketing',
            sort_rank: 0,
            is_public: false,
            user_id: 'u1',
            subcategories: [],
          },
        ],
        error: null,
      });

    supabaseMocks.categoriesInsert.mockResolvedValueOnce({ data: null, error: null });

    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitForInitialFetch();

    await user.click(screen.getByRole('button', { name: /new category/i }));

    const nameInput = document.getElementById('category-name-input') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();
    await user.type(nameInput as HTMLInputElement, 'Marketing');

    await user.click(screen.getByRole('button', { name: /save category/i }));

    await waitFor(() => {
      expect(supabaseMocks.categoriesInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Marketing',
          user_id: 'u1',
        }),
      ]);
    });

    expect(toastMocks.success).toHaveBeenCalledWith('Category created successfully');

    await waitFor(() => {
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });
  });

  it('shows toast error when initial fetch fails', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });
    supabaseMocks.categoriesOrder.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });

    render(<CategoriesPage />);

    await waitForInitialFetch();

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Failed to fetch categories');
    });
  });

  it('deletes subcategory via RPC after confirmation', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });
    confirmSpy.mockReturnValue(true);

    const cats: CategoryRow[] = [
      {
        id: 'cat-1',
        name: 'Marketing',
        slug: 'marketing',
        sort_rank: 0,
        is_public: false,
        user_id: 'u1',
        subcategories: [
          { id: 'sub-1', name: 'Email', slug: 'email', category_id: 'cat-1', sort_rank: 0 },
        ],
      },
    ];

    supabaseMocks.categoriesOrder.mockResolvedValue({ data: cats, error: null });
    supabaseMocks.rpc.mockResolvedValueOnce({ data: null, error: null });

    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitForInitialFetch();

    await waitForCategoryCard('Marketing');

    const deleteSubButton = document.getElementById(
      'delete-subcategory-btn-sub-1'
    ) as HTMLButtonElement | null;
    expect(deleteSubButton).not.toBeNull();

    await user.click(deleteSubButton as HTMLButtonElement);

    await waitFor(() => {
      expect(supabaseMocks.rpc).toHaveBeenCalledWith('delete_subcategory_reassign_prompts', {
        p_subcategory_id: 'sub-1',
      });
    });

    expect(toastMocks.success).toHaveBeenCalledWith('Subcategory deleted');
  });

  it('shows toast error when category creation fails due to constraint', async () => {
    authMocks.useAuth.mockReturnValue({ user: { id: 'u1' } });

    supabaseMocks.categoriesOrder.mockResolvedValueOnce({ data: [], error: null });
    supabaseMocks.categoriesInsert.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    });

    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitForInitialFetch();

    await user.click(screen.getByRole('button', { name: /new category/i }));

    const nameInput = document.getElementById('category-name-input') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();
    await user.type(nameInput as HTMLInputElement, 'Marketing');

    await user.click(screen.getByRole('button', { name: /save category/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalled();
    });
  });
});
