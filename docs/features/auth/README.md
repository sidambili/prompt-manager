# Authentication

## Overview
Authentication in PromptManager is provided by Supabase Auth.

The app uses:
- Client-side Supabase auth calls for sign-in / sign-up
- Next.js middleware to enforce route protection and redirect behavior
- Postgres Row Level Security (RLS) policies (see `supabase/migrations/20251227021813_initial_schema.sql`) to ensure data access is enforced at the database layer via `auth.uid()`

## Entry points

### Routes
- `/login`
  - File: `src/app/login/page.tsx`
  - Supports:
    - Email/password sign-in via `supabase.auth.signInWithPassword()`
    - OAuth sign-in via `supabase.auth.signInWithOAuth()`
- `/signup`
  - File: `src/app/signup/page.tsx`
  - Supports:
    - Email/password sign-up via `supabase.auth.signUp()`
    - OAuth sign-in via `supabase.auth.signInWithOAuth()` (provider buttons)
- `/auth/callback`
  - File: `src/app/auth/callback/route.ts`
  - Exchanges an OAuth/email magic-link `code` for a session using `supabase.auth.exchangeCodeForSession(code)` and then redirects.

### Session enforcement
- Middleware entry: `middleware.ts` delegates to `updateSession()`
- Implementation: `src/lib/supabase/middleware.ts`

Current behavior:
- **Protected dashboard routes**
  - If unauthenticated and path starts with `/dashboard`, redirect to `/login`.
- **Auth routes**
  - If authenticated and path is `/login` or `/signup`, redirect to `/dashboard`.

## OAuth provider availability
OAuth buttons are enabled/disabled based on environment configuration.

Files:
- `src/lib/auth/config.ts`
- `src/lib/auth/hooks.ts` (`useOAuthProviders()`)

Configuration priority:
1. Explicit overrides:
   - `NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE`
   - `NEXT_PUBLIC_ENABLE_OAUTH_GITHUB`
2. Deployment mode default (`NEXT_PUBLIC_DEPLOYMENT_MODE`):
   - `cloud`: OAuth enabled by default
   - `self-hosted` / `local`: OAuth disabled by default

## RLS and security model
The database schema is protected primarily via RLS policies that reference the authenticated user ID (`auth.uid()`).

Examples from `supabase/migrations/20251227021813_initial_schema.sql`:
- Prompts and revisions are constrained to owners for update/delete.
- Flags allow any authenticated user to insert, and users can read their own flags.

RLS is considered the **authoritative enforcement layer** for prompt data access.
