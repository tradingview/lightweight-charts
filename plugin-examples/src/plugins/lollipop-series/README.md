# Lollipop series

This plugin has graduated to a published package,
[`@tradingview/lwc-plugin-lollipop-series`](https://www.npmjs.com/package/@tradingview/lwc-plugin-lollipop-series).
Its source lives in [`packages/lwc-plugin-lollipop-series`](../../../../packages/lwc-plugin-lollipop-series),
and so do its two pages: the demo (`src/example/index.html`) and the catalog
preview (`src/example/preview.html`).

`pnpm plugins:build-demos` builds both from the package into the documentation
site, at `/plugin-demos/lollipop-series/` and `/plugin-previews/lollipop-series/`. The
`example/index.html` left here is a redirect stub to the first of those, so
links to the old gallery URL keep working.
