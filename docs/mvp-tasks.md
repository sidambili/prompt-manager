# FINAL MVP CHECKLIST FOR CURSOR

## PHASE 0 — Repo & Environment Setup [DONE]

### Task 0.1 — Initialize Repository [DONE]

* Create Next.js app (App Router)
* Configure Tailwind CSS
* Install Supabase JS client
* Set up shadcn/ui

Deliverables:

* App runs locally
* Base layout renders

---

### Task 0.2 — Supabase Local Setup [DONE]

* Add Supabase CLI config
* Enable local Supabase via Docker
* Create `.env.local.example`

Required env vars:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Deliverables:

* `supabase start` works
* Supabase Studio accessible locally

---

## PHASE 1 — Database & Security Foundation (CRITICAL) [DONE]

### Task 1.1 — Create Database Schema [DONE]

Implement SQL migrations for:

* `prompts`
* `prompt_revisions`
* `prompt_flags`
* `categories`
* `subcategories`
* `prompt_classifications`

Deliverables:

* All tables created
* Foreign keys + constraints enforced

---

### Task 1.2 — Enable Row Level Security (RLS) [DONE]

Add RLS policies for:

* Read public prompts
* Read own prompts
* Insert/update/delete own prompts
* Insert flags (1 per user per prompt)
* Read/write own revisions

Deliverables:

* Verified via manual tests:

  * owner vs non-owner
  * logged-out user

---

### Task 1.3 — Triggers & Defaults [DONE]

* `updated_at` trigger
* Revision creation on update (or app-layer equivalent)

Deliverables:

* Updating a prompt creates a revision
* Timestamps update automatically

---

## PHASE 2 — Authentication & User Context [DONE]

### Task 2.1 — OAuth Authentication [DONE]

* Integrate Supabase Auth
* Enable Google + GitHub OAuth
* Implement login/logout flows

Deliverables:

* Users can sign in/out
* Session persists
* User object available app-wide

---

### Task 2.2 — User Profile Context [DONE]

* Global auth provider
* Fetch current user
* Handle loading / unauthenticated states

Deliverables:

* App reacts correctly to auth state
* Protected routes enforced

---

## PHASE 3 — Core Prompt CRUD

### Task 3.1 — Create Prompt Form [DONE]

Fields:

* Title
* Content (textarea)
* Description
* Category + Subcategory (required)
* Tags (optional)
* Visibility (private default)

Deliverables:

* Prompt saves successfully
* Validation enforced

---

### Task 3.2 — Edit Prompt [DONE]

* Owner-only access
* Save creates revision
* Visibility toggle works

Deliverables:

* Revisions stored
* Non-owners blocked

---

### Task 3.3 — Delete Prompt [IN PROGRESS]

* Owner-only
* Hard delete (MVP)

Deliverables:

* Prompt removed [DONE]
* Related revisions removed (cascade) [DONE]
* Non-owners blocked (spec created, needs testing)

---

## PHASE 4 — Variable Engine (CORE DIFFERENTIATOR)

### Task 4.1 — Variable Parser

Rules:

* Syntax: `{{variable_name}}`
* Lowercase + underscores
* Deduplicate
* Escape: `\{{not_a_var}}`

Deliverables:

* Parser returns ordered variable list
* Edge cases handled

---

### Task 4.2 — Variable UI

* Render input fields per variable
* Live preview with values filled
* Missing values show placeholder

Deliverables:

* Preview updates instantly
* UX is stable for 1–20 variables

---

### Task 4.3 — Copy Actions

Buttons:

* Copy template
* Copy filled prompt
* Copy as Markdown

Deliverables:

* Clipboard works
* Visual confirmation shown

---

## PHASE 5 — Browse, Search, Categories

### Task 5.1 — Category & Subcategory System

* Seed system categories
* Dropdown selection on create/edit
* Enforced 1 subcategory per prompt

Deliverables:

* Categories visible
* Prompts correctly classified

---

### Task 5.2 — Browse & Featured Feed

* Homepage shows Featured prompts
* Featured controlled via table or flag
* Exclude unlisted/flagged prompts

Deliverables:

* Clean first impression
* No “Newest spam wall”

---

### Task 5.3 — Search & Filters

* Search title + description
* Filter by category
* Optional tag filter

Deliverables:

* Search <500ms
* Results accurate

---

## PHASE 6 — Forking & Attribution

### Task 6.1 — Fork Prompt

* Fork public prompt
* New prompt owned by forker
* Defaults to private

Deliverables:

* Parent ID stored
* Content copied correctly

---

### Task 6.2 — Attribution UI

* “Remixed from X” section
* Link to original prompt
* Fork count computed

Deliverables:

* Attribution visible
* Original not editable by forker

---

## PHASE 7 — Revisions & History

### Task 7.1 — Revision History UI

* Owner-only section
* List last 10 revisions
* Show timestamp + editor

Deliverables:

* History visible
* No data leaks

---

## PHASE 8 — Anti-Spam & Reporting

### Task 8.1 — Public Posting Rules

* New users default to private
* Gate public posting (age or first private prompt)

Deliverables:

* Public spam friction exists

---

### Task 8.2 — Reporting

* Report button on public prompts
* One report per user per prompt
* Hide prompt if threshold exceeded

Deliverables:

* Flags recorded
* Prompt removed from public feeds

---

## PHASE 9 — Docs & Polish

### Task 9.1 — README.md

Include:

* What PromptManager is
* Local setup (Supabase local)
* Cloud setup (Supabase hosted)
* Feature list
* Contribution rules

---

### Task 9.2 — Seed Data

* Insert 20–50 high-quality prompts
* Assign categories
* Mark 10–20 as featured

---

### MVP DEFINITION OF DONE

* All above tasks complete
* RLS verified
* Variables stable
* Can be self-hosted in <15 minutes
* Repo is publishable

---
