# AGENT.md

This file is the entry point for coding agents working in the Lightweight Charts repository.

Use this document to understand how to approach the repo, how to route a task, and when to open the other project context files:

- [SKILL.md](./SKILL.md) — task playbook, mental model, canonical workflows, and common mistakes.
- [REFERENCE.md](./REFERENCE.md) — generated index of docs, examples, APIs, migrations, wrappers, and topics.

Recommended reading order:

1. Read `AGENT.md` first for repo-level operating rules.
2. Read the relevant part of `SKILL.md` for problem-solving guidance.
3. Use `REFERENCE.md` to route to the right canonical docs/examples/API pages.
4. Read the minimum set of source files and canonical docs needed for the task.
5. Then propose or implement changes.

## Purpose

Lightweight Charts is a charting library with a relatively compact codebase but a large conceptual surface area: chart creation, series APIs, time and price scales, panes, formatting, plugins, wrappers, migrations, and rendering behavior.

This file exists to prevent agents from doing three bad things:

- guessing APIs from naming alone,
- overloading context with too much documentation too early,
- and making changes that ignore project conventions, migration constraints, or rendering behavior.

## What each file is for

| File | Role | Read when |
|---|---|---|
| `AGENT.md` | Repo operating manual | Always start here |
| `SKILL.md` | Task playbook and foot-guns | When answering questions, writing code, or debugging behavior |
| `REFERENCE.md` | Search/index layer | When you need the canonical doc/example/API topic to read next |

## Agent workflow

### 1. Classify the task before reading everything

Classify the request into one primary category:

- Concept explanation
- API lookup
- Example-driven implementation
- Bug diagnosis
- Migration/upgrade
- Wrapper/framework integration
- Plugin/custom rendering
- Formatting/localization/time handling

Do not load the whole project mentally at once. Route first, then read narrowly.

### 2. Route the task

Use this map:

| Task type | Start with | Then use `REFERENCE.md` to find |
|---|---|---|
| “How do I use X?” | `SKILL.md` | `How To`, `Demos`, relevant API interfaces/types |
| “Why is this chart behaving oddly?” | `SKILL.md` | `Time scale`, `Price scale`, `Series`, `Panes`, `Plugins`, `Migrations` |
| “What API should I call?” | `SKILL.md` | `Functions`, `Interfaces`, `Type Aliases`, `Docs` |
| “How do I upgrade?” | `SKILL.md` | `Migrations`, release notes, affected APIs |
| “How do I build a custom renderer/plugin?” | `SKILL.md` | `Plugins`, `Custom Series Types`, `Pane Primitives`, renderer interfaces |
| “React/Vue/Web Components?” | `SKILL.md` | `React`, `Vue.js`, `Web Components`, `Demos` |

### 3. Prefer canonical sources over intuition

Before answering or changing code:

- Prefer official examples over inferred usage.
- Prefer typed API docs over blog-style summaries.
- Prefer migration pages when behavior differs by version.
- Prefer repo-local conventions over generic chart-library habits.

If there is a conflict between a guessed pattern and a canonical example, the canonical example wins.

### 4. Read narrowly, then act

Only read the docs and source needed for the task.

Good:

- Open `SKILL.md` section on time handling.
- Use `REFERENCE.md` to locate `Time scale`, `Time zones`, `Time`, `BusinessDay`, `UTCTimestamp`, and a relevant demo.
- Inspect the code that consumes those APIs.

Bad:

- Load the entire API catalog before understanding the question.
- Guess options from similarly named chart libraries.
- Refactor unrelated code while debugging one rendering issue.

## Project-level rules

### Do not guess API shape

This project exposes many similarly named types and options. Do not assume that:

- option names are interchangeable across chart, series, pane, and plugin APIs,
- time handling matches another library,
- autoscale behavior is implicit,
- or wrapper APIs expose all web APIs identically.

Confirm using `REFERENCE.md` and the canonical doc/example pages.

### Keep answers and patches minimal

Prefer the smallest correct change that matches existing style.

- Do not introduce abstractions unless repetition or complexity truly requires it.
- Do not rename broadly unless the task explicitly calls for it.
- Do not rewrite working examples into a different style just because it looks cleaner.

### Be migration-aware

If a task touches behavior that may vary across versions, check migrations and release notes before recommending code.

Typical migration-sensitive areas:

- chart creation and series APIs,
- time scale and price scale behavior,
- plugin/primitives APIs,
- type names and wrappers.

### Respect rendering-specific constraints

Many bugs are not “logic bugs” but chart-behavior misunderstandings.

When diagnosing issues, verify whether the problem is actually about:

- time scale range,
- price scale options,
- autoscale,
- localization/formatting,
- markers and whitespace data,
- pane layout,
- plugin rendering,
- or version-specific behavior.

## Verification checklist

Before finalizing an answer, patch, or PR draft, verify:

- The task was routed through the right `SKILL.md` section.
- The recommendation matches canonical docs/examples from `REFERENCE.md`.
- Version-sensitive behavior was checked against migrations if relevant.
- No API names were guessed from memory.
- The change is scoped to the user’s problem.
- The explanation distinguishes library behavior from user-code mistakes.

If code is changed, also verify:

- tests/build/checks still pass,
- examples still make conceptual sense,
- and docs comments or usage notes stay aligned with the implementation.

## How to link the three files

Place all three files in the same directory and use relative links:

- `AGENT.md` links to [`SKILL.md`](./SKILL.md) and [`REFERENCE.md`](./REFERENCE.md)
- `SKILL.md` links back to [`AGENT.md`](./AGENT.md) and [`REFERENCE.md`](./REFERENCE.md)
- `REFERENCE.md` should link back to [`AGENT.md`](./AGENT.md) and [`SKILL.md`](./SKILL.md) in a short “How to use this index” note at the top

Recommended top-of-file pattern for `REFERENCE.md`:

```md
> Start with [AGENT.md](./AGENT.md) for repo rules and [SKILL.md](./SKILL.md) for task playbooks. Use this file only as the routing/index layer.
```

## Maintainer intent

This setup is optimized for both contributors and AI agents:

- `AGENT.md` keeps repo guidance short and maintainable.
- `SKILL.md` captures recurring high-value knowledge and foot-guns.
- `REFERENCE.md` stays generated and searchable, not overloaded with policy.
