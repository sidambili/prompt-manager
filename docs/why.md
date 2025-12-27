
## Why PromptManager Exists

The modern AI stack has a gap.

On one end, you have **chat interfaces** where prompts are disposable.
On the other, you have **observability platforms** built for production ML systems.

What’s missing is everything in between.

### The Missing Layer

Most AI builders spend their time here:

* writing prompts
* tweaking wording
* reusing fragments
* adapting prompts across tools
* sharing prompts with teammates
* figuring out which version worked best

But there is no tool designed specifically for that job.

So people use Notion.

Or spreadsheets.

Or comments in code.

PromptManager exists to replace that workaround.

---

## PromptManager vs Observability Tools

This question comes up often, so let’s address it clearly.

### Observability tools (like Arize or Langfuse) are built to answer:

* How is my model performing in production?
* Are outputs drifting over time?
* What happened during inference?
* How do prompts behave at scale?

They assume:

* models are already deployed
* telemetry pipelines exist
* teams are operating production systems

### PromptManager is built to answer:

* Where is my prompt?
* Which version should I use?
* How do I reuse this safely?
* How do I share this with others?
* How do I parameterize this without copy-paste?

These are **authoring and reuse problems**, not observability problems.

---

## A Simple Mental Model

* PromptManager: **write, organize, reuse prompts**
* Observability tools: **monitor prompts after deployment**

PromptManager lives upstream.

Many teams may use both.
Most individual builders only need PromptManager.

---

## Why Open Source

Prompt workflows are deeply personal.

PromptManager is open source so:

* you can self-host it
* you own your data
* you can adapt it to your workflow
* it can grow with the community instead of locking users in

---

## The Real Competition

PromptManager is not trying to beat enterprise ML platforms.

Its real competition is:

* Notion
* Google Docs
* Markdown files
* “I’ll remember this later”

PromptManager exists to be better than those.

---

# 3. One-Sentence ICP (Crystal Clear, Arize-Exclusive)

Here’s the one sentence you can use internally, in docs, or even on the website:

> **PromptManager is for builders and automation engineers who write and reuse prompts daily but do not operate production ML observability stacks.**

Alternative versions depending on tone:

* **“PromptManager serves people who author prompts, not teams who monitor models.”**
* **“PromptManager is built for prompt creators before prompts ever reach production.”**
* **“If you manage prompts in Notion today, PromptManager is for you.”**

Arize’s ICP explicitly excludes this group.
