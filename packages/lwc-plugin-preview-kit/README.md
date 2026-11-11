# Preview kit

Private, never published. Shared layout and controls for the catalog preview
pages of the plugin packages: `src/example/preview.html` and `preview.ts` of
every `packages/lwc-plugin-*`, declared as `lwcPlugin.preview` and built to
`/plugin-previews/<slug>/` by `pnpm plugins:build-demos`.

A preview page is not the plugin's demo. The demo (`lwcPlugin.demo`) is the
page a developer opens on its own: it carries edge cases, whitespace runs,
negative values and every option the plugin has. A preview is what the
catalog frames next to the README, so it shows the plugin at its best in a
short frame and nothing else.

Three entry points:

- `@tradingview/lwc-plugin-preview-kit/preview.css` — the whole layout. One
  compact `#controls` row above a `#chart` that fills the rest of the frame.
  Light and dark, keyed on the root element's `data-theme`. Nothing is
  restyled after load, so the chart is created at its final size and does not
  jump.
- `@tradingview/lwc-plugin-preview-kit/preview-theme` — follows the theme of
  the docs page that frames the preview, live: toggling the site theme
  restyles the running preview without reloading it. `?theme=light|dark` in
  the page URL pins a theme instead (a page opened on its own is light).
  `themeChart(chart, onTheme?)` themes the chart's background, text, grid,
  scale borders and crosshair labels now and on every switch; `onTheme` is
  where a preview recolours anything of its own that would not read on the
  other background.
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

The page script is a module and can run after the first paint, so
`src/theme-boot.js` sets the theme before it: `pnpm plugins:build-demos`
inlines it straight after `<meta charset>` of every built preview page (the
build fails without one), which is why a preview page needs no script of its
own in its HTML. It applies the same rules as `preview-theme`; change them in
both places.

Add the kit to a package with `@tradingview/lwc-plugin-preview-kit: workspace:*` in
`devDependencies` — `create-lwc-plugin --workspace` does this for you — and
declare `lwcPlugin.preview` (and `previewHeight`, when 330 px is not enough).
