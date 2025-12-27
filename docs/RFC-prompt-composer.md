
# RFC — PROMPT COMPOSER (POST-MVP)

**RFC ID:** RFC-002
**Title:** Composable Prompt System
**Status:** Draft (Post-MVP)
**Target Version:** v1.2+
**Owner:** PromptManager Core Team

---

## 1. Problem Statement

As prompt libraries grow, users repeat the same building blocks:

* roles
* constraints
* formatting rules
* evaluation criteria

Copy-pasting leads to:

* duplication
* drift
* broken best practices

Users want to **build prompts from smaller, reusable parts**.

---

## 2. Goals

* Allow prompts to be composed from smaller prompts
* Preserve variable integrity
* Track dependencies and updates
* Avoid turning PromptManager into a full IDE

---

## 3. Non-Goals (Important)

* No real-time collaborative editing
* No execution/runtime logic
* No implicit auto-updates without user consent
* No cycles (prompt A cannot include prompt A)

---

## 4. Core Concept

### Prompt = Tree, Not Text

A prompt may contain:

* static text
* variables
* references to other prompts (modules)

Example:

```
{{include:role/expert_marketer}}
{{include:constraints/email_length}}
Write an email about {{topic}}.
{{include:formatting/numbered_list}}
```

---

## 5. Prompt Types

### 5.1 Atomic Prompt

* No dependencies
* Reusable building block
* Examples:

  * Role definitions
  * Formatting rules
  * Safety constraints

### 5.2 Composite Prompt

* References one or more prompts
* Assembled at render time
* Editable as a graph, not raw text

---

## 6. Include Syntax (Proposed)

```
{{include:prompt_id}}
```

or human-readable alias:

```
{{include:constraints.email_length}}
```

Resolution rules:

* Includes resolved depth-first
* Variables merged and deduplicated
* Conflict = error surfaced to user

---

## 7. Variable Resolution Rules

* Variables from all included prompts are merged
* Duplicate names must match type
* Conflicts require user resolution
* Final prompt exposes a single variable panel

---

## 8. Dependency Management

### Metadata Stored

* `prompt_dependencies`

  * parent_prompt_id
  * child_prompt_id
  * order

### Rules

* Circular dependencies blocked
* Max depth (e.g. 5 levels)
* Deleting a prompt warns dependents

---

## 9. UI Design (High-Level)

### Composer View

* Left: Prompt tree (modules)
* Center: Final rendered preview
* Right: Variables panel

### Actions

* Add module
* Reorder modules
* Inline edit atomic prompts
* Expand/collapse modules

---

## 10. Versioning & Safety

* Composite prompts pin module versions by default
* User can “update from source” manually
* Updating a module never silently breaks dependents

---

## 11. Why This Is Post-MVP

This feature:

* introduces graph complexity
* requires dependency resolution
* increases mental load for new users

It should only ship **after PromptManager proves value as a library**, not an IDE.

---

## 12. Future Extensions (Out of Scope)

* Conditional includes
* Prompt templates with logic
* AI-generated compositions
* Team-wide shared modules

