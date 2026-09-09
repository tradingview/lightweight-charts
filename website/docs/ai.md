---
title: Build with AI
sidebar_label: Build with AI
---

## AI-friendly documentation

The Lightweight Charts™ documentation is structured so that AI coding assistants and other LLM-based tools can read it directly, without scraping HTML, following the [llms.txt] convention.

### llms.txt and the docs map

The documentation root serves two index files:

- [`llms.txt`](pathname:///llms.txt) — a plain-text list of all documentation pages.
- [`docs_map.md`](pathname:///docs_map.md) — the same list, including each page's headings.

### Per-page Markdown

Every documentation page is also published as plain Markdown at its own URL with an `.md` suffix. For example, this page is also available at [ai.md](pathname:///docs/ai.md).

Each page also shows two controls under its title:

- **Copy as Markdown** — copies the page's Markdown to the clipboard.
- **View as Markdown** — opens the page's raw Markdown in a new tab.

### TypeScript definition files

The TypeScript declaration file always matches the latest version and is hosted next to the docs at [`lightweight-charts.d.ts`](pathname:///lightweight-charts.d.ts).

### How to use this with AI tools

- Point an AI coding assistant or IDE at [`llms.txt`](pathname:///llms.txt) so it knows which pages exist, or at a specific page's `.md` URL for detailed content.
- Use the **Copy as Markdown** button to paste a page straight into a chat.

## AI coding assistants

This repository ships an [Agent Skill](https://github.com/tradingview/lightweight-charts/blob/master/.github/skills/lightweight-charts/SKILL.md) for AI coding assistants. It covers the Lightweight Charts™ v5 API conventions, the mental model, and common time, scale, marker, plugin, and wrapper foot-guns.

Install it into your project with the `skills` CLI:

```console
npx skills add https://github.com/tradingview/lightweight-charts
```

This makes the skill available to compatible assistants, such as Claude Code and Codex. They scaffold charts, wire up series and data, and answer API questions against current v5 conventions out of the box instead of relying on outdated snippets and stumbling into common foot-guns.

[llms.txt]: https://llmstxt.org/
