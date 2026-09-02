# @tradingview/lwc-toolkit

Shared helpers and the `PluginBase` class for Lightweight Charts™ plugins.

This package is **private and never published to npm**. Plugin packages and
the plugin examples depend on it with `"@tradingview/lwc-toolkit": "workspace:*"`,
and its code is inlined into each plugin's bundle at build time, so plugin
consumers never see it as a dependency.

The compiled output in `dist/` deliberately keeps the one-file-per-module
structure (no bundling) and the package sets `"sideEffects": false`, so
bundlers can tree-shake unused helpers out of plugin bundles.

Build it with:

```bash
pnpm --filter @tradingview/lwc-toolkit build
```

On a fresh checkout, build the library first (`pnpm build:prod` in the
repository root) — this package compiles against the `lightweight-charts`
typings from the root `dist/`.

The `plugin-examples` scripts run this automatically before building.

Note: consumers use the compiled `dist/` output, so after editing the sources
here re-run the build (or restart `pnpm dev` in `plugin-examples`, which
rebuilds this package first) — helper edits are not hot-reloaded.
