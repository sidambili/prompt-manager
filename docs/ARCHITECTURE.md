# PromptManager Architecture (Public)

Last updated: 2025-12-29  
Status: MVP

## What this is
PromptManager is a self-hostable app for storing, versioning, and reusing AI prompts. Prompts can be public or private, can be forked, and can include variables like `{{customer_name}}`.

## Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Optional Next.js API routes for server-only logic

## High level design
PromptManager uses a simple split:
- The Next.js app renders UI and talks to Supabase.
- Supabase is the database + authentication.
- Security is enforced with Postgres Row Level Security (RLS).

### Data access approach
- Reads and writes happen through the Supabase client.
- RLS policies ensure users can only access what they should.
- No private prompt data should be accessible via public pages.

## Core data model (MVP)
Tables:
- `prompts`
- `prompt_revisions`
- `prompt_flags`
- `categories`
- `subcategories`
- (optional) `featured_prompts` for curated homepage content

Key rules:
- A prompt belongs to a user.
- Prompts can reference a parent prompt (`parent_id`) for forking.
- Revisions store snapshots of prompts over time.
- Flags allow reporting public prompts.

## Security model
Authentication:
- Supabase Auth (email/password or OAuth)

Authorization:
- RLS is the main enforcement layer.
- Public prompts are readable when `is_public = true` and `is_listed = true`.
- Private prompts are readable only by the owner.
- Updates and deletes are owner-only.

## App structure
Main folders:
- `src/app/` Next.js routes and layouts
- `src/components/` UI components and feature components
- `src/lib/` helpers (supabase client, variable parsing, utilities)
- `supabase/` local Supabase setup and migrations
- `scripts/` utility scripts (example: RLS verification)

## Public vs private prompt pages
Public prompt pages must not leak private prompts:
- If a prompt is not public and listed, treat it like it does not exist.
- Return a normal 404 for private or missing prompts.

Owners can still view their private prompts via authenticated pages.

## Local development
Recommended setup:
1. Start local Supabase
2. Apply migrations and seed data
3. Run Next.js dev server

This keeps onboarding simple and makes it easy to verify RLS behavior.

## What is intentionally not included here
Internal planning docs like PRDs, task lists, and roadmaps are not part of the public repo documentation. The public repo docs focus on:
- how to run the project
- how the system is structured
- how security works
