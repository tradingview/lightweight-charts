# Lightweight Charts API.md

> Start with [lightweight-charts.agent.md](../agents/lightweight-charts.agent.md) for repo rules and [SKILL.md](../skills/lightweight-charts/SKILL.md) for task playbooks.
> This file is a compact index of canonical sources — use it to route to the right folder or file, not to enumerate every page.

## Repo guidance

- [lightweight-charts.agent.md](../agents/lightweight-charts.agent.md) — repo operating rules
- [SKILL.md](../skills/lightweight-charts/SKILL.md) — task playbook, mental model, and foot-guns

## Docs

- `website/docs/` — chart types, price scale, time scale, time zones, panes, release notes, getting started
- `website/docs/migrations/` — upgrade guides (v2→v3, v3→v4, v4→v5)

## Tutorials

- `website/tutorials/` — step-by-step guides for customization, how-to, demos, accessibility, analysis indicators
- `website/tutorials/customization/` — chart/series/crosshair/scale styling
- `website/tutorials/how_to/` — legends, tooltips, price lines, markers, panes, watermarks
- `website/tutorials/demos/` — real-time updates, range switcher, infinite history, custom locale, compare series

## Plugin examples

- `plugin-examples/` — custom series, pane primitives, series primitives, pixel-perfect rendering

## Framework and platform wrappers

- `website/tutorials/react/` — React integration (simple + advanced)
- `website/tutorials/vuejs/` — Vue.js wrapper component
- `website/tutorials/webcomponents/` — Web Components custom element
- `website/docs/android.md` — Android wrapper
- `website/docs/ios.md` — iOS wrapper

## API and typings

All exported API surface (interfaces, type aliases, enums, functions, variables) and JSDoc-backed type information:

- Local build output: `dist/typings.d.ts`
- Published fallback: `https://unpkg.com/lightweight-charts/dist/typings.d.ts`

Prefer reading `typings.d.ts` over website API pages — the docs site generates those pages from this single canonical file.

## Website (online fallback)

- [Latest docs site](https://tradingview.github.io/lightweight-charts/)
- [Plugins](https://tradingview.github.io/lightweight-charts/docs/plugins/intro)
