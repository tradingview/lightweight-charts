# SKILL.md

This file teaches coding agent how to think about Lightweight Charts tasks.

Read [lightweight-charts.agent.md](../../agents/lightweight-charts.agent.md) first for repo-level rules.
Use [lightweight-charts-api.md](../../references/lightweight-charts-api.md) as the routing/index layer to find the exact canonical docs, examples, and APIs referenced below.

## What this file is for

`SKILL.md` is not a full API dump.

It exists to provide:

- the mental model of the library,
- a routing map from user problem -> correct docs/examples,
- canonical implementation patterns,
- common foot-guns,
- and safe answer-generation rules.

If `lightweight-charts-api.md` tells you **where** to look, `SKILL.md` tells you **how to think**.

## Mental model

When reasoning about Lightweight Charts, think in layers:

1. **Chart** — container-level object and global options.
2. **Series** — data visualization primitives added to a chart.
3. **Scales** — time scale and price scale govern range, positioning, formatting, zoom, and visibility.
4. **Data model** — time values, whitespace data, single-value vs OHLC shapes, markers, updates.
5. **Interaction** — crosshair, scrolling, scaling, hovering, tooltips, subscriptions.
6. **Layout** — panes, overlay scales, margins, chart size, watermark placement.
7. **Extension** — plugins, custom series, pane primitives, series primitives, custom renderers.
8. **Wrapper/framework layer** — React, Vue, Web Components, or native wrappers.

Most user problems are caused by misunderstanding one of these layers or mixing them together.

## Routing map by problem

### 1. Basic chart creation or series usage

Use when the task is:

- creating a chart,
- adding a line/area/bar/candlestick/histogram series,
- setting data,
- updating data,
- or customizing appearance.

Open from `lightweight-charts-api.md`:

- `Docs` -> Getting started, Chart types, Series, Series types
- `Functions` -> `createChart`, related factory functions
- `Interfaces` -> `IChartApi`, `ISeriesApi`, series options interfaces
- `How To` / `Demos` -> practical usage patterns

### 2. Time handling and range behavior

Use when the task mentions:

- time scale,
- visible range,
- logical range,
- business day vs UTC timestamp,
- timezones,
- infinite history,
- scroll/zoom behavior,
- or “chart looks offset / cropped / reset”.

Open from `lightweight-charts-api.md`:

- `Docs` -> `Time scale`, `Time zones`, `Working with time zones`
- `Interfaces` / `Type Aliases` -> `ITimeScaleApi`, `Time`, `BusinessDay`, `UTCTimestamp`, range handlers
- `Demos` -> Infinite history, range switcher, realtime updates
- `Migrations` when behavior changed across versions

Rule of thumb:

- If the bug “looks visual”, it may still be a time-model or range problem.
- Verify the time type, ordering, gaps, whitespace points, and range APIs before blaming rendering.

### 3. Price formatting, locale, and display issues

Use when the task mentions:

- price format,
- custom formatter,
- locale,
- tick labels,
- currency/percentage formatting,
- or unexpected axis labels.

Open from `lightweight-charts-api.md`:

- `Customization` -> `Price format`, `Chart colors`, related examples
- `Demos` -> `Custom locale`
- `Interfaces` / `Type Aliases` -> `LocalizationOptions`, `PriceFormat`, `PriceFormatterFn`, tick formatter types

Rule of thumb:

- Formatting bugs often come from choosing the wrong formatter layer: chart-level locale, price format option, or custom formatter callback.

### 4. Price scale, panes, and layout

Use when the task mentions:

- autoscale,
- pane layout,
- two price scales,
- overlay series,
- inverted scale,
- margins,
- or price/volume composition.

Open from `lightweight-charts-api.md`:

- `Docs` -> `Price scale`, `Panes`
- `How To` -> `Two Price Scales`, `Price and volume on a single chart`, `Inverted Price Scale`
- `Interfaces` / `Type Aliases` -> `IPriceScaleApi`, `PriceScaleOptions`, `AutoScaleMargins`, `AutoscaleInfo`, pane APIs

Rule of thumb:

- Many layout issues are actually scale-assignment issues.
- Check which series is attached to which price scale before changing styling or margins.

### 5. Markers, tooltips, crosshair, and interaction

Use when the task mentions:

- series markers,
- crosshair,
- hover state,
- legend,
- tooltip,
- programmatic positioning,
- or interaction callbacks.

Open from `lightweight-charts-api.md`:

- `How To` -> `Add Series Markers`, `Set crosshair position`, `Legends`, `Tooltips`
- `Functions` -> markers APIs
- `Interfaces` / `Type Aliases` -> marker types, mouse event params, hovered items

Rule of thumb:

- Interaction bugs usually involve either the wrong event data interpretation or the wrong assumption about visible range and data alignment.

### 6. Realtime data and history loading

Use when the task mentions:

- streaming updates,
- appending bars,
- loading older history,
- incremental updates,
- or “data disappears / jumps after update”.

Open from `lightweight-charts-api.md`:

- `Demos` -> `Realtime updates`, `Infinite history`, `Whitespace data`
- `Interfaces` -> series APIs, data-change handlers, range-change handlers
- `Docs` -> time scale and series behavior

Rule of thumb:

- Keep straight the difference between replacing the full dataset, appending new points, and prepending older history.
- Confirm monotonic time ordering.

### 7. Plugins and custom rendering

Use when the task mentions:

- custom series,
- series primitives,
- pane primitives,
- custom watermarks,
- pixel-perfect rendering,
- or low-level canvas behavior.

Open from `lightweight-charts-api.md`:

- `Plugins` -> introduction, custom series types, pane primitives, series primitives, canvas rendering target, pixel-perfect rendering
- `Interfaces` -> renderer/view/primitive interfaces
- `Functions` -> watermark/plugin creation helpers

Rule of thumb:

- Plugin tasks are not normal chart-option tasks.
- Start from the plugin architecture docs first, then the renderer/view interfaces, then examples.

### 8. Framework wrappers

Use when the task mentions:

- React,
- Vue,
- Web Components,
- Android wrapper,
- iOS wrapper.

Open from `lightweight-charts-api.md`:

- `React`, `Vue.js`, `Web Components`, wrapper docs under `Docs`
- then relevant base chart APIs under `Interfaces` / `Functions`

Rule of thumb:

- Separate framework lifecycle problems from library API problems.
- Confirm whether the issue is mounting, cleanup, resize, prop syncing, or actual chart behavior.

### 9. Migration-sensitive work

Use when the task mentions:

- upgrading versions,
- deprecated APIs,
- changed behavior,
- or code copied from an older example.

Open from `lightweight-charts-api.md`:

- `Migrations` -> `From v2 to v3`, `From v3 to v4`, `From v4 to v5`
- `Release Notes`

Rule of thumb:

- Do not recommend “working code” until version compatibility is checked.

## Canonical answer strategy

When a user asks a question or requests code, answer in this sequence:

1. Identify the primary layer involved: chart, series, scale, data model, layout, plugin, or wrapper.
2. Identify the likely foot-gun category.
3. Use `lightweight-charts-api.md` to open the exact docs/examples/API entities.
4. Prefer one canonical example and one canonical API reference over many weak references.
5. Generate the smallest explanation or code patch that matches the official usage pattern.

This keeps the answer grounded and avoids speculative API generation.

## Common foot-guns

### Time is often the real issue

Symptoms:

- bars render in odd positions,
- visible range behaves strangely,
- realtime updates appear to reset the chart,
- or history loading behaves inconsistently.

Check first:

- wrong `Time` shape,
- mixed `BusinessDay` and `UTCTimestamp` assumptions,
- unsorted timestamps,
- duplicate times,
- whitespace data expectations,
- timezone assumptions.

### Formatting can happen at several layers

Symptoms:

- labels look wrong,
- prices are unexpectedly rounded,
- locale appears ignored,
- or percent/currency formatting is inconsistent.

Check first:

- chart localization options,
- series price format options,
- custom price formatter callbacks,
- tick formatter callbacks.

### Scale ownership is easy to misread

Symptoms:

- series appears on the wrong axis,
- autoscale is surprising,
- pane layout looks broken,
- or price/volume composition feels off.

Check first:

- assigned price scale,
- overlay behavior,
- price scale visibility,
- margins and autoscale provider logic,
- pane configuration.

### Markers and interaction often depend on data alignment

Symptoms:

- markers do not appear,
- tooltips look inconsistent,
- crosshair callbacks seem wrong,
- or hover behavior seems off.

Check first:

- marker time alignment,
- visible range,
- event payload interpretation,
- whether the referenced data point exists in the series timeline.

### Wrapper bugs may not be library bugs

Symptoms:

- chart duplicates,
- resize behavior breaks,
- stale props appear,
- cleanup leaks,
- or event subscriptions accumulate.

Check first:

- mount/unmount lifecycle,
- resize observer / container sizing,
- prop diffing,
- instance reuse,
- cleanup of subscriptions and chart objects.

## Safe code-generation rules

When generating code:

- Prefer official APIs and example structure.
- Keep option objects small and explicit.
- Avoid combining many advanced features in one snippet unless the task requires it.
- Do not invent undocumented options.
- If a task is wrapper-specific, preserve framework lifecycle conventions.
- If a task is plugin-specific, do not answer with ordinary chart options only.

## How to use `Lightweight Charts API.md` well

Do not read it top-to-bottom.

Use it as a router:

- Find the task category.
- Pick the smallest set of relevant docs/examples/API entries.
- Read canonical pages only.
- Return to implementation.

Good retrieval pattern:

- One conceptual doc
- One example/how-to
- One API page
- One migration page if version-sensitive

## How the three files connect

- [lightweight-charts.agent.md](../../agents/lightweight-charts.agent.md) defines repo-level rules and workflow.
- [`SKILL.md`](../../skills/lightweight-charts/SKILL.md) defines mental models, task routing, and foot-guns.
- [`lightweight-charts-api.md`](../../references/lightweight-charts-api.md) provides the searchable map to canonical material.

Recommended usage path:

```text
Task -> AGENT.md -> relevant SKILL.md section -> relevant REFERENCE.md entries -> canonical docs/examples/APIs -> answer or patch
```

## What maintainers get from this design

This split keeps maintenance cost low:

- `lightweight-charts.agent.md` stays short and stable.
- `SKILL.md` changes only when repeated mistakes or important usage patterns emerge.
- `lightweight-charts-api.md` can stay generated and broad without becoming the place for policy or instruction.
