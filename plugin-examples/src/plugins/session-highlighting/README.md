# Session highlighting

This plugin has graduated to a published package,
[`@tradingview/lwc-plugin-session-highlighting`](https://www.npmjs.com/package/@tradingview/lwc-plugin-session-highlighting).
Its source lives in [`packages/lwc-plugin-session-highlighting`](../../../../packages/lwc-plugin-session-highlighting),
and so do its two pages: the demo (`src/example/index.html`) and the catalog
preview (`src/example/preview.html`).

`pnpm plugins:build-demos` builds both from the package into the documentation
site, at `/plugin-demos/session-highlighting/` and `/plugin-previews/session-highlighting/`.
The `example/index.html` left here is a redirect stub to the first of those, so
links to the old gallery URL keep working.
