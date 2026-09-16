# Accessibility

This plugin has graduated to a published package,
[`@tradingview/lwc-plugin-accessibility`](https://www.npmjs.com/package/@tradingview/lwc-plugin-accessibility).
Its source lives in [`packages/lwc-plugin-accessibility`](../../../../packages/lwc-plugin-accessibility),
and so do its two pages: the demo (`src/example/index.html`) and the catalogue
preview (`src/example/preview.html`).

`pnpm plugins:build-demos` builds both from the package into the documentation
site, at `/plugin-demos/accessibility/` and `/plugin-previews/accessibility/`. The
`example/index.html` left here is a redirect stub to the first of those, so
links to the old gallery URL keep working.
