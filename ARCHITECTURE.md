# Architecture Document: PromptManager

**Version:** 1.0  
**Last Updated:** December 26, 2025  
**Status:** MVP Architecture  
**Author:** PromptManager Core Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Database Architecture](#4-database-architecture)
5. [API Architecture](#5-api-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Development Workflow](#9-development-workflow)
10. [Performance Considerations](#10-performance-considerations)
11. [Future Architecture Considerations](#11-future-architecture-considerations)

---

## 1. System Overview

### 1.1 Purpose

PromptManager is a self-hostable, open-source platform for managing, versioning, and reusing AI prompts. It treats prompts as first-class artifacts with versioning, forking, and variable support.

### 1.2 Core Principles

1. **Supabase-First**: Leverage Supabase for auth, database, and real-time capabilities
2. **Self-Hostable**: No vendor lock-in; can run entirely on self-hosted infrastructure
3. **Security by Default**: Row-level security (RLS) enforced at the database layer
4. **Developer-Friendly**: Simple setup, clear structure, contributor-friendly
5. **Minimal Dependencies**: Avoid heavy frameworks; prefer lightweight, focused tools

### 1.3 System Boundaries

**In Scope (MVP):**
- Prompt CRUD operations
- Variable detection and live preview
- Forking and attribution
- Revision history
- Public/private visibility
- Search and filtering
- OAuth authentication

**Out of Scope (MVP):**
- Real-time collaboration
- Prompt execution/runtime
- Full-text search on content
- Comments and social features
- Enterprise SSO
- Paid tiers

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15+ | React framework with App Router |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Supabase JS | Latest | Database client and auth |

**Rationale:**
- Next.js provides SSR, routing, and API routes out of the box
- TypeScript ensures type safety across the codebase
- Tailwind + shadcn/ui provide rapid UI development with consistency
- Supabase client enables direct database access with RLS enforcement

### 2.2 Backend

| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Primary database |
| Supabase Auth | OAuth authentication (Google, GitHub) |
| Supabase RLS | Row-level security policies |
| Next.js API Routes | Optional: rate limiting, view counting |

**Rationale:**
- Supabase provides managed PostgreSQL with built-in auth
- RLS policies enforce security at the database layer
- Next.js API routes handle edge cases (rate limiting, analytics)

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| Supabase CLI | Local development and migrations |
| Docker | Local Supabase instance |
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Running tests | 
---

## 3. Architecture Patterns

### 3.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Next.js Frontend (React)                 │   │
│  │  - Pages (App Router)                            │   │
│  │  - Components (shadcn/ui)                        │   │
│  │  - Client-side state management                  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js Server (Vercel/Node)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes (Optional)                            │   │
│  │  - /api/prompts/[id]/view (increment views)      │   │
│  │  - /api/prompts/[id]/report (rate-limited)      │   │
│  │  - /api/featured (curated feed)                  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Supabase Platform                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                              │   │
│  │  - Tables (prompts, revisions, flags, etc.)       │   │
│  │  - RLS Policies                                   │   │
│  │  - Triggers (updated_at, revision creation)     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                    │   │
│  │  - OAuth (Google, GitHub)                         │   │
│  │  - Session management                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Patterns

**Read Operations:**
1. Client requests data via Supabase client
2. Supabase enforces RLS policies
3. Data returned to client
4. Client renders UI

**Write Operations:**
1. Client validates input
2. Client sends mutation via Supabase client
3. Supabase enforces RLS policies
4. Database triggers execute (e.g., create revision)
5. Success/error returned to client
6. Client updates UI

**Special Operations (API Routes):**
1. Client calls Next.js API route
2. API route validates request (rate limiting, auth)
3. API route performs operation (e.g., increment view count)
4. Response returned to client

### 3.3 State Management

**Client-Side State:**
- React hooks (`useState`, `useEffect`) for component state
- Supabase client for server state (via React Query or SWR if needed)
- URL state for filters, search queries
- Local storage for user preferences (optional)

**Server-Side State:**
- Database is source of truth
- No application-level caching required for MVP
- Supabase handles connection pooling

---

## 4. Database Architecture

### 4.1 Schema Overview

```
auth.users (Supabase managed)
    │
    ├─── prompts
    │     ├─── prompt_revisions (1:N)
    │     ├─── prompt_flags (1:N)
    │     ├─── prompts (self-reference via parent_id for forks)
    │     └─── featured_prompts (M:N via prompt_id)
    │
    ├─── categories
    │     └─── subcategories (1:N)
    │           └─── prompts (N:1)
```

### 4.2 Core Tables

#### `categories`
Top-level taxonomy grouping (e.g., "Software Engineering", "Automation").

**Key Fields:**
- `id` (UUID, PK)
- `name` (text)
- `slug` (text, unique)
- `sort_rank` (integer)
- `is_system` (boolean)

#### `subcategories`
Specific domain within a category (e.g., "Code Review", "Testing").

**Key Fields:**
- `id` (UUID, PK)
- `category_id` (UUID, FK → categories)
- `name` (text)
- `slug` (text, unique within category)
- `sort_rank` (integer)

#### `prompts`
Core entity storing prompt content and metadata.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `subcategory_id` (UUID, FK → subcategories)
- `title` (text, 1-100 chars)
- `content` (text, 10-10,000 chars)
- `description` (text, max 500 chars)
- `tags` (text[], 0-10 tags)
- `tool` (text, optional)
- `parent_id` (UUID, FK → prompts, for forks)
- `is_public` (boolean, default false)
- `is_listed` (boolean, default true)
- `views_count` (integer, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `updated_by` (UUID, FK → auth.users)

**Indexes:**
- `idx_prompts_user_id` on `user_id`
- `idx_prompts_subcategory_id` on `subcategory_id`
- `idx_prompts_is_public_listed` on `(is_public, is_listed)`
- `idx_prompts_created_at` on `created_at`
- `idx_prompts_parent_id` on `parent_id` (for fork count queries)

#### `prompt_revisions`
Historical snapshots of prompt changes.

**Key Fields:**
- `id` (UUID, PK)
- `prompt_id` (UUID, FK → prompts, CASCADE DELETE)
- `title` (text)
- `content` (text)
- `description` (text)
- `tags` (text[])
- `created_at` (timestamptz)
- `created_by` (UUID, FK → auth.users)

**Indexes:**
- `idx_revisions_prompt_id` on `prompt_id`
- `idx_revisions_created_at` on `created_at`

#### `prompt_flags`
User reports for inappropriate content.

**Key Fields:**
- `id` (UUID, PK)
- `prompt_id` (UUID, FK → prompts, CASCADE DELETE)
- `reporter_id` (UUID, FK → auth.users)
- `reason` (text, optional)
- `created_at` (timestamptz)

**Constraints:**
- Unique constraint on `(prompt_id, reporter_id)` (one report per user per prompt)

**Indexes:**
- `idx_flags_prompt_id` on `prompt_id`

#### `featured_prompts`
Curated prompts for homepage feed.

**Key Fields:**
- `prompt_id` (UUID, PK, FK → prompts, CASCADE DELETE)
- `featured_rank` (integer, default 100)
- `created_at` (timestamptz)

### 4.3 Database Triggers

#### `set_updated_at`
Automatically updates `updated_at` timestamp on prompt updates.

```sql
create trigger trg_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();
```

#### `create_prompt_revision`
Creates a revision record before prompt update (optional: can be app-layer instead).

```sql
create trigger trg_prompt_revision
before update on public.prompts
for each row execute function public.create_prompt_revision();
```

**Note:** For MVP, revision creation can be handled in the application layer for better control and error handling.

### 4.4 Row-Level Security (RLS)

All tables have RLS enabled. Policies enforce:

**Prompts:**
- **Read:** Public listed prompts OR own prompts
- **Insert:** Own prompts only
- **Update:** Own prompts only
- **Delete:** Own prompts only

**Revisions:**
- **Read:** Only if user owns the parent prompt
- **Insert:** Only if user owns the parent prompt

**Flags:**
- **Insert:** Any authenticated user (one per prompt per user)

**Categories/Subcategories:**
- **Read:** Public (no RLS needed for taxonomy)

---

## 5. API Architecture

### 5.1 Supabase Client (Primary)

**Pattern:** Direct client-side access to Supabase with RLS enforcement.

**Advantages:**
- Simple architecture
- RLS enforced automatically
- Real-time subscriptions possible (future)
- No API layer maintenance

**Usage Example:**
```typescript
// Client-side
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .eq('is_public', true)
  .eq('is_listed', true);
```

### 5.2 Next.js API Routes (Optional)

Used for operations that require server-side logic or rate limiting.

#### `/api/prompts/[id]/view`
Increments view count atomically.

**Method:** POST  
**Auth:** Optional (track views for logged-in users separately if needed)  
**Rate Limit:** Per IP, per prompt

#### `/api/prompts/[id]/report`
Creates a flag record with rate limiting.

**Method:** POST  
**Auth:** Required  
**Rate Limit:** 1 report per user per prompt (enforced by unique constraint)

#### `/api/featured`
Returns curated featured prompts.

**Method:** GET  
**Auth:** Not required  
**Caching:** Optional (ISR or edge caching)

### 5.3 Variable Parsing Engine

**Location:** Client-side utility function

**Algorithm:**
1. Scan prompt content for `{{variable_name}}` patterns
2. Extract variable names
3. Normalize: lowercase, spaces → underscores, trim
4. Deduplicate by normalized key
5. Return ordered list (by first appearance)

**Edge Cases:**
- Escape sequences: `\{{not_a_var}}`
- Nested braces: Invalid (rejected)
- Empty braces: Invalid (rejected)
- Variables with 50+ unique keys: Show warning, collapse panel

---

## 6. Frontend Architecture

### 6.1 Next.js App Router Structure

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                    # Homepage (Featured feed)
├── prompts/
│   ├── page.tsx               # Browse/search page
│   └── [id]/
│       └── page.tsx           # Prompt detail page
├── new/
│   └── page.tsx               # Create prompt (auth required)
├── edit/
│   └── [id]/
│       └── page.tsx           # Edit prompt (owner only)
├── account/
│   └── page.tsx               # User profile (auth required)
├── login/
│   └── page.tsx               # OAuth entry
└── api/                        # API routes (optional)
    └── prompts/
        └── [id]/
            ├── view/
            │   └── route.ts
            └── report/
                └── route.ts
```

### 6.2 Component Architecture

```
components/
├── ui/                         # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   └── ...
├── prompts/
│   ├── PromptCard.tsx         # Prompt preview card
│   ├── PromptDetail.tsx       # Full prompt view
│   ├── PromptForm.tsx         # Create/edit form
│   ├── VariablePanel.tsx      # Variable inputs + preview
│   └── RevisionHistory.tsx    # Revision list (owner only)
├── layout/
│   ├── Header.tsx             # Navigation
│   ├── Footer.tsx
│   └── AuthProvider.tsx       # Supabase auth context
└── shared/
    ├── SearchBar.tsx
    ├── CategoryFilter.tsx
    └── TagFilter.tsx
```

### 6.3 State Management

**Auth State:**
- Supabase client provides `useUser()` hook
- Global context provider wraps app
- Protected routes check auth state

**Form State:**
- React Hook Form for prompt create/edit
- Client-side validation before submission
- Optimistic updates for better UX

**Search/Filter State:**
- URL query parameters (e.g., `?q=search&category=code`)
- Server components fetch data based on URL
- Client components handle interactions

### 6.4 Variable Engine Integration

**Components:**
1. `VariableParser`: Extracts variables from content
2. `VariableInputs`: Renders input fields
3. `LivePreview`: Shows filled prompt in real-time
4. `CopyButtons`: Copies template or filled prompt

**Flow:**
```
User edits prompt content
    ↓
VariableParser extracts variables
    ↓
VariableInputs renders fields
    ↓
User types values
    ↓
LivePreview updates (<50ms target)
    ↓
User clicks "Copy Filled Prompt"
    ↓
Clipboard API copies filled content
```

---

## 7. Security Architecture

### 7.1 Authentication

**Method:** OAuth via Supabase Auth (Google, GitHub)

**Flow:**
1. User clicks "Sign in with Google/GitHub"
2. Redirected to Supabase OAuth endpoint
3. OAuth provider authenticates
4. Supabase creates/updates user session
5. Redirected back to app with session token
6. Session stored in HTTP-only cookie (Supabase managed)

**Session Management:**
- Refresh tokens handled by Supabase
- Automatic token refresh
- Sign out clears session

### 7.2 Authorization

**Database Layer (RLS):**
- All authorization enforced via RLS policies
- Policies check `auth.uid()` for user identity
- No application-level authorization bypass possible

**Application Layer:**
- Protected routes check auth state
- UI hides actions user cannot perform
- API routes validate auth before operations

### 7.3 Data Protection

**Private Prompts:**
- Never exposed in public queries
- RLS policy: `auth.uid() = user_id`
- No enumeration possible (cannot list private prompts)

**Public Prompts:**
- Only listed prompts appear in feeds
- Flagged prompts hidden via `is_listed = false`
- Owner can still access flagged prompts

### 7.4 Rate Limiting

**Client-Side:**
- Debounce search queries
- Disable buttons during mutations
- Show loading states

**Server-Side (API Routes):**
- IP-based rate limiting (100 req/min per IP)
- Per-user rate limiting for reports (1 per prompt)
- Middleware or edge function enforcement

### 7.5 Input Validation

**Client-Side:**
- React Hook Form validation
- Character limits enforced
- Variable syntax validated

**Server-Side:**
- Database constraints (CHECK clauses)
- RLS policies prevent unauthorized writes
- Type validation in API routes

---

## 8. Deployment Architecture

### 8.1 Development Setup

**Option A: Supabase Local (Recommended for Contributors)**

```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db reset

# Seed data
npx supabase db seed
```

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>
```

**Option B: Supabase Cloud (Recommended for Users)**

```bash
# Link to cloud project
npx supabase link --project-ref <ref>

# Push migrations
npx supabase db push

# Seed data
npx supabase db seed
```

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cloud_anon_key>
```

### 8.2 Production Deployment

**Frontend:**
- Deploy to Vercel (recommended) or any Node.js host
- Environment variables configured in hosting platform
- Automatic deployments from Git

**Database:**
- Supabase Cloud (managed) or self-hosted Supabase
- Migrations run via Supabase CLI or dashboard
- Backups configured in Supabase

**Self-Hosting:**
- Full stack can run on single server
- Docker Compose for Supabase
- Next.js on Node.js or containerized

### 8.3 CI/CD Pipeline

**Recommended:**
1. Push to `main` branch
2. Run tests (if implemented)
3. Deploy to staging (optional)
4. Deploy to production
5. Run database migrations (manual or automated)

**Migrations:**
- Version-controlled in `supabase/migrations/`
- Never modify existing migrations
- Test migrations on staging first

---

## 9. Development Workflow

### 9.1 Local Development

1. Clone repository
2. Install dependencies: `npm install`
3. Start Supabase: `npx supabase start`
4. Run migrations: `npx supabase db reset`
5. Seed data: `npx supabase db seed`
6. Start Next.js: `npm run dev`
7. Open http://localhost:3000

### 9.2 Database Changes

1. Create migration: `npx supabase migration new <name>`
2. Write SQL in migration file
3. Test locally: `npx supabase db reset`
4. Commit migration file
5. Apply to production: `npx supabase db push`

### 9.3 Code Organization

```
prompt-manager/
├── app/                        # Next.js App Router pages
├── components/                 # React components
├── lib/                        # Utilities, helpers
│   ├── supabase/              # Supabase client setup
│   ├── variables/             # Variable parsing engine
│   └── utils/                 # General utilities
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── seed.sql               # Seed data
│   └── config.toml            # Supabase config
├── public/                     # Static assets
├── types/                      # TypeScript types
└── scripts/                    # Setup scripts
```

### 9.4 Testing Strategy (Post-MVP)

**Unit Tests:**
- Variable parser
- Utility functions
- Component logic

**Integration Tests:**
- RLS policies (owner vs non-owner)
- API routes
- Database triggers

**E2E Tests:**
- Critical user flows
- Auth flows
- Prompt CRUD

---

## 10. Performance Considerations

### 10.1 Database Performance

**Indexes:**
- All foreign keys indexed
- Composite indexes for common queries (e.g., `(is_public, is_listed)`)
- Search indexes on `title` and `description` (trigram or full-text)

**Query Optimization:**
- Limit result sets (pagination)
- Use `select()` to fetch only needed fields
- Avoid N+1 queries (use joins or batch queries)

**Computed Values:**
- Fork count computed via `COUNT(parent_id)` (not stored)
- View count stored but best-effort (not guaranteed accurate)

### 10.2 Frontend Performance

**Code Splitting:**
- Next.js automatic code splitting
- Dynamic imports for heavy components

**Caching:**
- Static pages cached by Next.js
- API routes can use ISR or edge caching
- Client-side caching via React Query (optional)

**Optimizations:**
- Debounce search input
- Lazy load images
- Minimize bundle size

### 10.3 Scalability Limits (MVP)

**Expected Scale:**
- 1,000-10,000 prompts
- 100-1,000 users
- <100 concurrent users

**Bottlenecks:**
- Search performance (title/description only in MVP)
- View count updates (best-effort, not critical)

**Future Improvements:**
- Full-text search on content (PostgreSQL full-text or Elasticsearch)
- Caching layer (Redis)
- CDN for static assets
- Database read replicas

---

## 11. Future Architecture Considerations

### 11.1 Prompt Composer (Post-MVP)

**RFC-002** describes a composable prompt system where prompts can include other prompts.

**Architecture Impact:**
- New table: `prompt_dependencies`
- Dependency resolution engine
- Graph traversal for rendering
- Cycle detection
- Version pinning for modules

**Implementation Notes:**
- Keep MVP simple (no composition)
- Design schema to support future composition
- Variable resolution becomes more complex

### 11.2 Real-Time Features

**Potential:**
- Live collaboration (multiple users editing)
- Real-time prompt updates
- Activity feed

**Architecture:**
- Supabase Realtime subscriptions
- WebSocket connections
- Conflict resolution (operational transforms or CRDTs)

### 11.3 Advanced Search

**Current:** Title + description only

**Future:**
- Full-text search on content
- Vector search for semantic similarity
- Filter by variable names
- Advanced query syntax

**Architecture:**
- PostgreSQL full-text search (GIN indexes)
- Or external search service (Elasticsearch, Typesense)
- Search index updates on prompt changes

### 11.4 Analytics & Observability

**Current:** Client-side event tracking (best-effort)

**Future:**
- Server-side analytics
- Usage dashboards
- Performance monitoring

**Architecture:**
- Event tracking service (PostHog, Mixpanel, or custom)
- Aggregation pipeline
- Dashboard UI

### 11.5 Multi-Tenancy

**Current:** Single instance, all users share database

**Future:**
- Organization/workspace support
- Team prompts
- Shared libraries

**Architecture:**
- New table: `organizations`, `organization_members`
- RLS policies extended for org-level access
- UI for org management

---

## Appendix A: Environment Variables

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
```

### Optional

```env
NEXT_PUBLIC_APP_URL=<app_url>  # For OAuth redirects
SUPABASE_SERVICE_ROLE_KEY=<service_key>  # Server-side only, never expose
```

---

## Appendix B: Database Migration Strategy

1. **Never modify existing migrations** in production
2. **Always create new migrations** for schema changes
3. **Test migrations locally** before applying to production
4. **Backup database** before major migrations
5. **Use transactions** for multi-step migrations

**Example:**
```bash
# Create new migration
npx supabase migration new add_prompt_tool_field

# Edit migration file
# Apply locally
npx supabase db reset

# Apply to production
npx supabase db push
```

---

## Appendix C: RLS Policy Testing

**Manual Test Cases:**

1. **Public Prompt Access:**
   - Logged-out user can read public, listed prompts
   - Logged-out user cannot read private prompts
   - Logged-out user cannot read unlisted prompts

2. **Owner Access:**
   - Owner can read own private prompts
   - Owner can read own public prompts
   - Owner can update own prompts
   - Owner can delete own prompts

3. **Non-Owner Access:**
   - Non-owner can read public, listed prompts
   - Non-owner cannot read private prompts
   - Non-owner cannot update prompts (even public ones)
   - Non-owner cannot delete prompts

4. **Revisions:**
   - Only owner can read revisions
   - Only owner can create revisions

5. **Flags:**
   - Any authenticated user can flag a prompt
   - User can only flag once per prompt (unique constraint)

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-26 | Initial architecture document | Core Team |

---

**End of Architecture Document**

