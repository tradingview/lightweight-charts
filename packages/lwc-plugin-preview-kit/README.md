# Preview kit

Private, never published. Shared layout and controls for the catalogue preview
pages of the plugin packages: `src/example/preview.html` and `preview.ts` of
every `packages/lwc-plugin-*`, declared as `lwcPlugin.preview` and built to
`/plugin-previews/<slug>/` by `pnpm plugins:build-demos`.

A preview page is not the plugin's demo. The demo (`lwcPlugin.demo`) is the
page a developer opens on its own: it carries edge cases, whitespace runs,
negative values and every option the plugin has. A preview is what the
catalogue frames next to the README, so it shows the plugin at its best in a
short frame and nothing else.

Two entry points:

- `@tradingview/lwc-plugin-preview-kit/preview.css` — the whole layout. One
  compact `#controls` row above a `#chart` that fills the rest of the frame.
  Light only (`color-scheme: light`), because the page is framed inside a site
  that also has a dark theme. Nothing is restyled after load, so the chart is
  created at its final size and does not jump.
- `@tradingview/lwc-plugin-preview-kit/preview-controls` — `mountControls(defs)`
  builds the control row from `select`, `checkbox` and `button` declarations,
  and `addRefreshButton(onRefresh)` adds a "New data" button for the previews
  whose sample data is random. Plain DOM, no framework.

A preview page is therefore two elements and a script:

```html
<div id="controls"></div>
<div id="chart"></div>
<script type="module" src="./preview.ts"></script>
```

Add it to a package with `@tradingview/lwc-plugin-preview-kit: workspace:*` in
`devDependencies` — `create-lwc-plugin --workspace` does this for you — and
declare `lwcPlugin.preview` (and `previewHeight`, when 330 px is not enough).
