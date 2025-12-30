# PromptManager

**A prompt library and reuse system for builders, not an observability platform**

PromptManager is an open-source platform for **writing, organizing, versioning, and reusing AI prompts** across tools like Cursor, n8n, ChatGPT, Claude, and custom agents.

It treats prompts like **first-class artifacts**, not telemetry.

### What PromptManager is

* A personal and team prompt library
* A way to reuse prompts with variables (`{{variable_name}}`)
* A GitHub-style workflow for prompts: versioning, forking, remixing
* A clean, searchable system for prompts you actually write and use
* Built for automation engineers, developers, and AI builders

### What PromptManager is not

* Not an LLM observability tool
* Not a model monitoring platform
* Not a production analytics system
* Not built for tracking embeddings, drift, or inference metrics

If you are deploying models at scale and need to observe them in production, tools like **Arize AI** or **Langfuse** are excellent choices.

PromptManager exists **before** that stage.

---

## Why PromptManager Exists

Most people building with AI today manage prompts in:

* Notion
* Google Docs
* Markdown files
* Spreadsheets
* Random snippets scattered across projects

These tools were never designed for prompts.

They don’t understand:

* variables
* reuse
* prompt evolution
* forking and remixing
* how prompts flow across tools and workflows

PromptManager exists to solve that gap.

It gives builders a place to **author, evolve, reuse, and share prompts** without needing production infrastructure, tracing pipelines, or ML ops knowledge.

---

## Key Features

* Prompt CRUD (create, edit, delete)
* Variables with live preview (`{{variable_name}}`)
* Categories and subcategories for structured browsing
* Tags for flexible organization
* Prompt forking with attribution
* Revision history for every prompt
* Markdown and clipboard export
* Public or private prompt libraries
* Self-hostable with Supabase

---

## Who This Is For

* Automation engineers using n8n, Make, Zapier
* Developers building AI features or agents
* Solo builders and small teams
* People who write prompts daily and want them organized
* Anyone tired of losing their “good prompts” in docs

---

## Who This Is Not For

* ML teams monitoring production models
* Companies needing drift detection or embedding analysis
* Organizations already deep into ML observability stacks

PromptManager complements observability tools.
It does not compete with them.

---

## Getting Started

See the main [README.md](../README.md) for setup and deployment instructions.

For self-hosted deployments, refer to [SELF_HOSTING.md](./SELF_HOSTING.md)

---
