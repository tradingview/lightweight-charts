# User price lines

This plugin has graduated to a published package,
[`@tradingview/lwc-plugin-user-price-lines`](https://www.npmjs.com/package/@tradingview/lwc-plugin-user-price-lines).
Its source lives in [`packages/lwc-plugin-user-price-lines`](../../../../packages/lwc-plugin-user-price-lines),
and so do its two pages: the demo (`src/example/index.html`) and the catalog
preview (`src/example/preview.html`).

`pnpm plugins:build-demos` builds both from the package into the documentation
site, at `/plugin-demos/user-price-lines/` and `/plugin-previews/user-price-lines/`. The
`example/index.html` left here is a redirect stub to the first of those, so
links to the old gallery URL keep working.
