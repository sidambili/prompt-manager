# Product Requirements Document: PromptManager 

## Open-Source Prompt Management Platform for Automation Engineers

**Version:** 2.0
**Last Updated:** December 26, 2025
**Status:** MVP Build Spec (Ready for Implementation)
**Author:** Sid (Founder)
**License:** MIT (repo)

---

## 1. Executive Summary

**PromptManager** is a simple, open-source, self-hostable prompt management platform built for automation engineers, developers, and power users who maintain prompts across tools like **n8n**, **Cursor**, **ChatGPT**, **Claude**, and custom agents.

Today, prompt workflows are managed in scattered docs, Notion pages, spreadsheets, or personal snippets, with no reliable way to:

* track revisions
* reuse prompts with variables
* fork and remix with attribution
* export prompts into automation tools quickly
* collaborate without vendor lock-in

PromptManager treats prompts like code: structured, versioned, forkable, and shareable.

---

## 2. Goals and Non-Goals

### 2.1 Product Vision

Empower automation engineers and developers with a collaborative, open-source system to manage, share, and improve AI prompts, without paywalls or vendor lock-in.

### 2.2 Business Objectives (MVP)

1. **Community adoption:** Become a credible “GitHub for prompts” in the automation and developer space.
2. **Retention via utility:** Users build a daily prompt library (10–50 prompts).
3. **Validation of differentiators:** Variables + forking + revisions drive repeat usage.
4. **Open-source growth:** Seed contributors and maintainers.

### 2.3 MVP Success Metrics

* 100 signups in first 30 days
* 50 weekly active users
* 50+ prompts created by users (excluding seed data)
* 20+ forks created by users
* 40% of new users return within 7 days
* 500 GitHub stars within 90 days
* 3+ external contributors merged within 90 days

### 2.4 Non-Goals (Explicitly Out of Scope for MVP)

* Paid tiers, billing, or subscriptions
* Full moderation tooling with reviewer dashboards
* Full-text search across prompt content at scale (MVP is title + description)
* Comments, favorites, and collections (post-MVP)
* AI auto-tagging (post-MVP)
* Enterprise SSO (post-MVP)

---

## 3. Target Users and Personas

### Persona A: Automation Engineer (Primary)

* Uses n8n/Make/Zapier + AI nodes
* Maintains many prompts tied to workflows
* Needs reuse via variables and quick export
* Values speed and organization over social features

### Persona B: AI Developer (Primary)

* Builds agents, tools, RAG systems, or custom pipelines
* Wants forks, revisions, attribution, and collaboration

### Persona C: Power User / Analyst (Secondary)

* Non-developer, wants a simple library
* Mostly reads and copies, rarely forks or contributes

---

## 4. Product Principles

1. **Ship the minimum that is sticky:** variables, revisions, forks, search.
2. **Make public browsing great:** curated seed prompts and “Featured” default.
3. **Prevent spam early:** add friction to public posting on day one.
4. **Security first:** strict row-level security and safe defaults.
5. **Self-hostable:** do not depend on proprietary paid APIs for core function.

---

## 5. MVP Scope Overview

### 5.1 MVP Features (Must Ship)

1. OAuth login (Google, GitHub)
2. Prompt CRUD (create, edit, delete)
3. Public/private visibility
4. Variable detection + live preview + copy filled prompt
5. Browse, search (title + description), filter by tags
6. Fork / remix with parent attribution
7. Prompt revisions (edit history, at least basic)
8. Basic anti-spam controls + reporting
9. Basic analytics events (client side) + view counting (best effort)

### 5.2 MVP Features (Nice-to-Ship, Not Blocking)

* Copy formats (Text, Markdown)
* “Copy for n8n” JSON export (can ship in v1.1 if needed)

---

## 6. Detailed Requirements

## 6.1 Authentication and Profiles (MVP: Must)

**Description:** Passwordless OAuth login with Google or GitHub using Supabase Auth.

**Acceptance Criteria**

* Google OAuth login works
* GitHub OAuth login works
* User profile auto-created on first login
* Profile page shows:

  * created prompts
  * forked prompts
  * public vs private counts
* User is kept signed in unless they sign out (standard refresh token flow)
* Profile uses provider avatar by default

**Implementation Notes**

* OAuth client secrets are managed in Supabase (not in the frontend)
* Frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 6.2 Prompt CRUD (MVP: Must)

**Fields**

* Title (required, 1–100 chars)
* Content (required, 10–10,000 chars)
* Description (optional, max 500)
* Tags (optional, 0–10 tags, each 1–24 chars)
* Visibility: Private (default) or Public

**Acceptance Criteria**

* Prompt saves with `user_id`, timestamps
* Edit and delete allowed only for owner
* UI shows:

  * “Created X time ago”
  * “Updated X time ago”
* Public prompts are read-only for non-owners

**Defaults**

* New prompt is **private** by default

---

## 6.3 Variables (MVP: Must, Differentiator)

### 6.3.1 Variable Syntax and Rules (Deterministic)

PromptManager detects variables in **double curly braces** (Handlebars/Jinja style):

* Canonical syntax: `{{variable_name}}`
* Rationale: Standard in automation tools (n8n, LangChain, Liquid), distinct from Markdown links/images.
* Allowed characters inside:
  * letters A–Z (case-insensitive)
  * numbers 0–9
  * underscore `_`
  * spaces
* Not allowed:
  * nested braces
  * newlines inside braces
  * empty braces `{{}}`

**Normalization**

* Variable keys are normalized to:
  * **lowercase**
  * spaces converted to underscores
  * trim leading/trailing spaces
* Examples:
  * `{{First Name}}` → `first_name`
  * `{{Company}}` → `company`
  * `{{tone 2}}` → `tone_2`

**Deduplication**

* If a variable appears multiple times in content, only one input field is shown.

**Escape Hatch**

* `\{{NOT_A_VAR}}` or `{{! comment }}` allows escaping (depending on parser choice, basic backslash escape `\{{...}}` recommended for MVP).

### 6.3.2 Variable UX

On prompt detail page:

* Render variable inputs in a panel below content
* As user types values, show a **live preview** of the prompt with variables filled
* Copy buttons:
  * “Copy Filled Prompt”
  * “Copy Template” (original prompt with placeholders)

**Acceptance Criteria**

* Variables are detected reliably per rules above
* Inputs appear in consistent order (first appearance in content)
* Live preview updates instantly (<50ms UI latency target)
* Copy confirmation is visible (non-intrusive toast)

**Edge Cases**

* Variables that differ only by case or spacing are treated as the same normalized key:
  * `{{Name}}` and `{{name}}` → `name`
* If a user enters content that would create 50+ variables, show a warning and collapse the variable panel (spam protection).

---

## 6.4 Browse, Search, Filter (MVP: Must)

### 6.4.1 Browsing

* Homepage shows:

  * Featured prompts (seeded and curated)
  * Search bar
  * Tag filters
  * Optional secondary tabs: Newest, Most Forked (computed)

**Important**

* Default landing should not be “Newest”. It should be **Featured** to avoid spam defining first impression.

### 6.4.2 Search (MVP Scope)

* Search indexes:

  * title
  * description
* Search does not query full prompt content in MVP (v1.1)

**Acceptance Criteria**

* Search returns in <500ms for typical use (small-to-medium dataset)
* Results show:

  * title
  * creator
  * tags
  * fork count (computed)
  * view count (best effort)
* Sorting options:

  * Featured (default)
  * Newest
  * Most Forked
  * Most Viewed (best effort)

### 6.4.3 Tags

### 6.4.3 Taxonomy and Categorization

To avoid "tag soup" and ensure structured navigation, the system uses a curated taxonomy alongside user-defined tags.

**Structure:**
1.  **Category (Vertical):** Top-level grouping (e.g., Software Engineering, Automation).
2.  **Subcategory (Topic):** Specific domain (e.g., Code Review, Testing, Workflows).
3.  **Tool (Filter Dimension):** The tool the prompt is for (e.g., Cursor, Windsurf, ChatGPT).
4.  **Tags:** User-defined flexible labels.

**MVP Rules:**
*   A prompt belongs to exactly **one** subcategory.
*   Tools are treated as a specific filter, not a category tree.
*   Prompts in "General" categories do not appear in the Featured carousel unless explicitly curated.

---

## 6.5 Fork / Remix with Parent Tracking (MVP: Must)

**Description:** Fork creates a copy owned by the new user while keeping a parent link.

**Behavior**

* Fork button visible on public prompts
* Fork action:

  * creates new prompt with `parent_id = original_prompt_id`
  * copies content, title (prefixed “Fork of: …” optional), description, tags
  * new prompt defaults to private (safe default)
* Fork attribution appears on forked prompt:

  * “Remixed from {Original Author}: {Original Title}”
* Original prompt shows fork count (computed)

**Acceptance Criteria**

* Forked prompt is editable by forker
* Fork attribution links to original
* Original cannot be edited by forker
* Fork count is not stored as a fragile counter (computed)

---

## 6.6 Prompt Revisions (MVP: Must)

**Problem:** Without revision history, users cannot trust edits.

**Solution:** Store prompt revisions whenever a prompt is updated.

**Revision Rules**

* Every update creates a revision record with:

  * previous content snapshot
  * previous title/description/tags
  * timestamp
  * updated_by

**MVP UX**

* Prompt page includes “Revision History” section
* Shows last 10 revisions by default
* Allows restoring a previous revision (optional for MVP, recommended)

**Acceptance Criteria**

* Revision created on every update
* Revision list view renders and is restricted to prompt owner
* Restore (if implemented) creates a new revision (do not delete history)

---

## 6.7 Anti-Spam and Reporting (MVP: Must)

Public libraries get spam. MVP must include basic brakes.

### 6.7.1 Public Posting Restrictions (Minimal Speed Bumps)

* New accounts default to private prompts
* Public posting is allowed only if **any one** is true:

  1. account age > 24 hours, or
  2. user has created at least 1 private prompt, or
  3. user is on an allowlist (admin seeded)

(Exact gating can be configured by env flag)

### 6.7.2 Reporting

* Every public prompt has “Report” action
* Report creates a row in `prompt_flags` table
* If a prompt exceeds a threshold (ex: 3 reports), it can be automatically hidden from public listing via `is_listed=false` (still visible to owner)

**Acceptance Criteria**

* Reporting works for logged-in users
* Report action is rate-limited (one report per user per prompt)
* Flagged prompts can be excluded from browse and search feeds

---

## 6.8 Exports and Copy Formats

### 6.8.1 Copy as Text (MVP: Must)

* Copy template
* Copy filled prompt

### 6.8.2 Copy as Markdown (MVP: Nice-to-Ship)

* Wrap content in Markdown code block
* Preserve variables

### 6.8.3 Copy for n8n JSON (v1.1 Recommended)

Generates:

```json
{
  "prompt": "Write an email to [RECIPIENT] about [TOPIC]",
  "variables": ["RECIPIENT", "TOPIC"],
  "source": "PromptManager"
}
```

If included in MVP, also ship docs page: “Using PromptManager with n8n”.

---

## 7. User Flows

### 7.1 New User Creates First Prompt

1. Visit homepage → browse featured prompts
2. Click “Create Prompt” → OAuth login
3. Land on dashboard with empty state
4. Create prompt → save (private default)
5. View prompt → variables panel auto-generated
6. Copy filled prompt → use elsewhere
7. Optional: publish prompt (if eligible)

### 7.2 User Forks a Prompt

1. Search and open a public prompt
2. Click “Fork”
3. Forked prompt created as private, owned by forker
4. Fork attribution shown
5. Edit prompt → revision created

### 7.3 User Reports a Prompt

1. Open a public prompt
2. Click Report → choose reason (optional MVP)
3. Prompt is flagged (not removed automatically unless threshold hit)

---

## 8. Non-Functional Requirements

### 8.1 Performance

* Homepage loads < 2 seconds on typical connection
* Search results appear < 500ms for MVP scale
* Use indexes on:

  * `prompts.created_at`
  * `prompts.user_id`
  * `prompts.is_public`
  * `prompts.is_listed`
  * title/description search index (trigram or full-text later)

### 8.2 Security

* HTTPS only
* Supabase RLS enforced
* Users can only edit their own prompts
* Private prompts never exposed in public queries
* Rate limit:

  * 100 requests/min per IP (middleware or edge)
  * report action: 1 per prompt per user

### 8.3 Accessibility

* Keyboard navigable
* Semantic HTML headings
* Sufficient contrast
* Screen-reader labels for input fields and copy buttons

### 8.4 Compatibility

* Responsive down to 375px
* Latest 2 versions of Chrome, Safari, Firefox, Edge

---

## 9. Technical Specifications

### 9.1 Frontend

* Next.js 15+
* Tailwind CSS
* shadcn/ui
* Supabase JS client
* Optional: CodeMirror/Monaco later (not required for MVP)

### 9.2 Backend

* Supabase Postgres
* Supabase Auth (OAuth)
* Supabase Storage optional (avatars can come from OAuth provider)

### 9.3 API Strategy

MVP can use Supabase client directly for CRUD.
Optional: Next.js route handlers for:

* view count increment (to avoid exposing raw updates)
* reporting endpoint (rate-limited)
* featured prompts feed (curated)

### 9.4 Development and Deployment Architecture

**Strategy: Supabase-First**

The platform is designed to be cloneable and contributor-friendly while leveraging robust auth and database features.

1.  **Option A: Supabase Cloud (Recommended Default)**
    *   Fastest setup for users.
    *   `npx supabase db push` + `npx supabase db seed`.
2.  **Option B: Supabase Local via Docker (Contributor Friendly)**
    *   Runs full stack locally (Postgres + Auth + Studio).
    *   `npx supabase start` + `npx supabase db reset`.
3.  **Self-Hosting:** Supported via standard Docker self-hosting of Supabase.

**Scripts to Ship:**
*   `scripts/setup.sh`: Automates CLI checks, local start or cloud link, migrations, and seeding.

---

## 10. Data Model and Schema

## 10.1 Tables

### `categories` (Taxonomy)

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_rank integer default 0,
  is_system boolean default true,
  created_at timestamptz default now()
);
```

### `subcategories` (Taxonomy)

```sql
create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_rank integer default 0,
  is_system boolean default true,
  created_at timestamptz default now(),
  unique(category_id, slug)
);
```

### `prompts`

Recommended fields:

```sql
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  subcategory_id uuid references public.subcategories(id),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 10 and 10000),
  description text check (char_length(description) <= 500),
  tags text[] default '{}'::text[],
  tool text, -- Optional: e.g., 'Cursor', 'n8n'
  parent_id uuid references public.prompts(id),
  is_public boolean not null default false,
  is_listed boolean not null default true,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
```

Notes:

* `subcategory_id` enforces the taxonomy structure.
* `tool` is a high-level filter dimension (optional).
* `fork_count` is intentionally not stored as truth. Compute from `parent_id`.
* `is_listed` supports hiding flagged content without deleting it.

### `prompt_revisions`

```sql
create table public.prompt_revisions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  title text not null,
  content text not null,
  description text,
  tags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);
```

### `prompt_flags`

```sql
create table public.prompt_flags (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now(),
  unique (prompt_id, reporter_id)
);
```

### Optional: `featured_prompts` (curation)

```sql
create table public.featured_prompts (
  prompt_id uuid primary key references public.prompts(id) on delete cascade,
  featured_rank integer not null default 100,
  created_at timestamptz not null default now()
);
```

---

## 10.2 Row Level Security (RLS)

### Enable RLS

```sql
alter table public.prompts enable row level security;
alter table public.prompt_revisions enable row level security;
alter table public.prompt_flags enable row level security;
```

### Prompts Policies

**Read**

* Anyone can read public, listed prompts
* Owners can read their own prompts (public or private)

```sql
create policy "read public prompts"
on public.prompts for select
using (is_public = true and is_listed = true);

create policy "read own prompts"
on public.prompts for select
using (auth.uid() = user_id);
```

**Insert**

```sql
create policy "insert own prompts"
on public.prompts for insert
with check (auth.uid() = user_id);
```

**Update**

```sql
create policy "update own prompts"
on public.prompts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

**Delete**

```sql
create policy "delete own prompts"
on public.prompts for delete
using (auth.uid() = user_id);
```

### Revisions Policies

Only owner can read and create revisions.

```sql
create policy "read own revisions"
on public.prompt_revisions for select
using (
  exists (
    select 1 from public.prompts p
    where p.id = prompt_revisions.prompt_id
      and p.user_id = auth.uid()
  )
);

create policy "insert own revisions"
on public.prompt_revisions for insert
with check (
  exists (
    select 1 from public.prompts p
    where p.id = prompt_revisions.prompt_id
      and p.user_id = auth.uid()
  )
);
```

### Flags Policies

Any logged-in user can flag a public prompt once.

```sql
create policy "insert flags"
on public.prompt_flags for insert
with check (auth.uid() = reporter_id);
```

---

## 10.3 Triggers (Recommended)

### Update timestamps

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();
```

### Create revision on update

You can implement revisions in the app layer or via trigger. App layer is easier to reason about. If trigger-based:

```sql
create or replace function public.create_prompt_revision()
returns trigger as $$
begin
  insert into public.prompt_revisions (prompt_id, title, content, description, tags, created_by)
  values (old.id, old.title, old.content, old.description, old.tags, auth.uid());
  return new;
end;
$$ language plpgsql;

create trigger trg_prompt_revision
before update on public.prompts
for each row execute function public.create_prompt_revision();
```

---

## 11. Pages and UI Requirements (Cursor-Friendly)

### Public Routes

* `/` Home (Featured feed default)
* `/prompts` Browse (search + filter + sorts)
* `/p/[id-or-slug]` Prompt detail (public view)

### Auth Routes

* `/login` OAuth entry
* `/account` Profile page (created + forked)
* `/new` Create prompt (auth required)
* `/edit/[id]` Edit prompt (owner only)

### Prompt Detail Page Components

* Prompt header: title, author, tags, visibility badge
* Fork attribution (if `parent_id`)
* Content viewer
* Variable panel (inputs + live preview)
* Copy buttons: template and filled
* Fork button (if public and not owner)
* Report button (if public and not owner)
* Revision history (owner only)

---

## 12. Analytics (MVP)

**Goal:** lightweight product signals without heavy infrastructure.

Track events (client-side):

* signup_completed
* prompt_created
* prompt_updated
* prompt_forked
* prompt_copied_template
* prompt_copied_filled
* prompt_reported
* search_performed

View counting:

* “best effort” increment on prompt page view
* do not guarantee accuracy (bots, reloads)

---

## 13. Seed Data and Curation (Required for Launch Quality)

### Seed Strategy

* Create 20–50 high-quality prompts under “PromptManager Team”
* Add 10–20 to “Featured” feed
* “Featured” is the default tab on homepage

### Initial Taxonomy (Seed Categories)

The system will ship with the following structure:

1.  **Software Engineering**
    *   Planning, PRD / Specs, Development, Code Review, Testing, Debugging, Documentation
2.  **Automation**
    *   n8n Workflows, Make.com Scenarios, Webhooks & APIs, Data Transformations, Agents / Tool Calling
3.  **AI Prompting**
    *   Prompt Templates, System Prompts, Evaluations / Scoring, Red Team / Safety, RAG Prompts
4.  **Personal**
    *   Health, Finance, Career, Relationships, Productivity
5.  **Academic**
    *   Study Help, Writing, Research, Exam Prep
6.  **General**
    *   Writing, Life, Other (Note: Not featured by default)

**Tools Filter List:**
Cursor, Windsurf, Claude, ChatGPT, GitHub Copilot, LangChain, n8n.

### Quality Standards for Seed Prompts

* Clear title, tags, short description
* Variables used where appropriate
* Tested formatting (no broken brackets)

---

## 14. Release Plan

### v1.0 (MVP)

Must ship:

* OAuth
* CRUD prompts
* public/private and is_listed
* variables + live preview + copy
* browse + search title/description + tags
* fork with parent attribution
* revisions
* reporting + basic spam brakes
* curated seed prompts + featured default

### v1.1

* n8n JSON export + docs
* multi-tag filtering
* full-text search on content
* favorites/collections

### v1.2

* comments
* notifications
* trending leaderboard

---

## 15. Open Questions (Kept Small for MVP)

1. Export format priority: do users want n8n JSON or just “Copy Filled Prompt” first?
2. Public posting gate: which rule performs best (age > 24h vs first private prompt vs allowlist)?
3. Best sorting default: Featured only, or Featured + Popular?

---

## 16. Risks and Mitigations

| Risk                                        | Impact | Likelihood | Mitigation                                                           |
| ------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------- |
| Spam floods public library                  | High   | Medium     | Featured default + public posting brakes + report system + is_listed |
| Variable parsing edge cases frustrate users | Medium | Medium     | Deterministic rules + escape hatch + tests                           |
| Search performance degrades                 | Medium | Low-Medium | Limit MVP search to title/description + indexes                      |
| Revision history missing trust              | High   | Medium     | Revisions are MVP requirement                                        |
| Permission bugs expose private prompts      | High   | Low        | Strict RLS + test cases                                              |

---

## 17. Definition of Done (MVP)

A build is considered MVP complete when:

* All MVP features ship and pass acceptance criteria
* RLS policies are validated with tests (owner vs non-owner vs logged-out)
* Seed prompts are present and featured
* Public feed cannot be easily spammed on day one
* A developer can clone repo, configure env vars, connect Supabase, and run locally
