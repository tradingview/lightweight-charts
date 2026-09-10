# Vertical line

This plugin has graduated to a published package,
[`@tradingview/lwc-plugin-vertical-line`](https://www.npmjs.com/package/@tradingview/lwc-plugin-vertical-line).
Its source lives in [`packages/lwc-plugin-vertical-line`](../../../../packages/lwc-plugin-vertical-line),
and so do its two pages: the demo (`src/example/index.html`) and the catalogue
preview (`src/example/preview.html`).

`pnpm plugins:build-demos` builds both from the package into the documentation
site, at `/plugin-demos/vertical-line/` and `/plugin-previews/vertical-line/`. The
`example/index.html` left here is a redirect stub to the first of those, so
links to the old gallery URL keep working.
