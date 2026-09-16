# Build with AI

## AI coding assistants

The Lightweight Charts™ repository ships two [Agent Skills](https://github.com/tradingview/lightweight-charts/tree/master/.github/skills) for AI coding assistants, such as Claude Code and Codex. The skills give the assistant current v5 knowledge to work from, instead of outdated snippets it may remember from training:

- [`lightweight-charts`](https://github.com/tradingview/lightweight-charts/blob/master/.github/skills/lightweight-charts/SKILL.md) is about *using* the library. It covers the v5 API conventions, the mental model, and common time, scale, marker, plugin, and wrapper foot-guns.
- [`lightweight-charts-plugin-authoring`](https://github.com/tradingview/lightweight-charts/blob/master/.github/skills/lightweight-charts-plugin-authoring/SKILL.md) is about *writing* a [plugin](https://tradingview.github.io/lightweight-charts/docs/plugins/intro.md). The skill helps choose between a custom series and a primitive, build on `@tradingview/lwc-toolkit`, and learn from the official plugin packages. It also warns about the common autoscale, whitespace, and hit-test traps. The `create-lwc-plugin` wizard offers to install this skill into a new plugin project.

Install either or both with the `skills` CLI; add `--skill <name>` to pick one of the two:

```console
npx skills add tradingview/lightweight-charts
```

## AI-friendly documentation

The Lightweight Charts™ documentation is structured so that AI coding assistants and other LLM-based tools can read it directly, without scraping HTML, following the [llms.txt] convention.

### llms.txt and the docs map

The documentation root serves two index files:

- [`llms.txt`](https://tradingview.github.io/lightweight-charts/llms.txt) — a plain-text list of all documentation pages.
- [`docs_map.md`](https://tradingview.github.io/lightweight-charts/docs_map.md) — the same list, including each page's headings.

### Per-page Markdown

Every documentation page is also published as plain Markdown at its own URL with an `.md` suffix. For example, this page is also available at [ai.md](https://tradingview.github.io/lightweight-charts/docs/ai.md).

Each page also shows two controls under its title:

- **Copy as Markdown** — copies the page's Markdown to the clipboard.
- **View as Markdown** — opens the page's raw Markdown in a new tab.

### TypeScript definition files

The TypeScript declaration file always matches the latest version and is hosted next to the docs at [`lightweight-charts.d.ts`](https://tradingview.github.io/lightweight-charts/lightweight-charts.d.ts).

### How to use this with AI tools

- Point an AI coding assistant or IDE at [`llms.txt`](https://tradingview.github.io/lightweight-charts/llms.txt) so it knows which pages exist, or at a specific page's `.md` URL for detailed content.
- Use the **Copy as Markdown** button to paste a page straight into a chat.

[llms.txt]: https://llmstxt.org/

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
