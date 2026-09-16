# Plugin catalogue data

The `lwc-plugin-catalogue` Docusaurus plugin gives the catalogue pages their data. Every page can read the entry summaries with `usePluginCatalogue()` from `src/hooks/use-plugin-catalogue.ts` (`CatalogueGlobalData` in `types.d.ts`). The full entry of each plugin, README included, is written as `<slug>.json` through `createData` in `contentLoaded`, for the per-plugin pages to load through their route.

The data is produced by `scripts/plugins/catalogue.mjs` (`pnpm plugins:catalogue` prints it), which:

1. enumerates the non-private packages under `packages/lwc-plugin-*` and validates each against the package contract, the same check as `pnpm plugins:validate`. Any problem fails the docs build; a partial catalogue is never shipped.
2. asks the npm registry for each package, in parallel, with three attempts on network errors, 5xx and 429 answers. A package that has never been published is listed in `unpublished` by name and gets no entry. A published one becomes an entry in `plugins`, and its tarball is downloaded, checked against the integrity the registry published for it, and read for the README of that exact version: the packument's own `readme` field belongs to whichever version was published last, which is not always the latest release. Reading the tarball uses the `tar` command, which is available on every supported platform, so it is a build-time dependency of the site.

Where each field of an entry comes from:

- from the published release on the registry, so that the page describes what `npm install` delivers: `version`, `publishedAt`, `peerRange` (null if the published manifest declares none), `description`, `license`, `keywords`, `deprecated` (the `npm deprecate` message), `readme` (from the release tarball, falling back to the workspace README, with a warning, when the tarball holds none)
- from the workspace, because they curate the entry rather than describe the artefact: `lwcPlugin` (title, category, lifecycle, origin, author, demo, preview, previewHeight, tags), `repository.url`
- derived: `slug` (unique, the URL segment), `npmUrl`, `repository.directory`, `demoPath` and `previewPath` (repo-relative POSIX paths of the package and of its two page sources), `demoUrl` and `previewUrl` (the deployed pages), `previewHeight`, and `pendingVersion`, set when the workspace version is newer than the published one. Pages should show a pending release rather than hide the entry.

Both pages come from the package itself, built by `pnpm plugins:build-demos` (`scripts/plugins/build-demos.mjs`) into `website/static/plugin-demos/<slug>/` and `website/static/plugin-previews/<slug>/`, which is why the website's own `start` and `build` scripts run `pnpm build:demos` first (pnpm does not run `pre*` hooks, so the two chain it explicitly). `demoUrl` and `previewUrl` are site-root relative, so a page has to pass them through `useBaseUrl`. `previewUrl` is null for a package that declares no `lwcPlugin.preview`; the detail page then frames `demoUrl` instead. `demoPath` and `previewPath` still name the sources, for a "view source" link. The old gallery copies at `/plugin-examples/plugins/<slug>/example/` are redirect stubs pointing at `demoUrl`.

## Previewing locally before the packages are published

The catalogue only lists a plugin the registry knows about, so until the packages are on npm the pages come out empty. `scripts/plugins/mock-registry.mjs` stands in for npm: it packs the workspace packages and serves the packuments and tarballs the catalogue asks for, integrity included, so the pages show the release that is about to go out.

```shell
pnpm build:prod                                  # once: the demo pages import the built library
pnpm plugins:mock-registry                       # terminal 1 — packs, then serves on :4873
```

```shell
LWC_CATALOGUE_REGISTRY=http://localhost:4873 \
  pnpm --filter lightweight-charts-website start # terminal 2
```

Then open <http://localhost:3000/lightweight-charts/plugins>. The dev server serves `website/static` as it is, so the framed preview and demo pages work; `pnpm build:demos` runs first, so they are up to date.

To check a production build instead, swap `start` for `build`, then serve it with `pnpm serve-website` — or the website's own `pnpm --filter lightweight-charts-website serve`, which runs the same thing (<http://localhost:3010/lightweight-charts/>). Both replace `docusaurus serve`, which is not equivalent here: the site sets `trailingSlash: false` and `serve` applies that to the static files too, redirecting `/plugin-previews/<slug>/` to the slash-less path. The framed page's relative `./assets/*` URLs then resolve one directory too high and 404, so the preview loads without its chart. GitHub Pages serves the directory itself, and so does `scripts/serve-website.mjs`.

For work that does not involve the catalogue, `LWC_CATALOGUE_OFFLINE=1` skips the registry entirely. The catalogue is then empty rather than wrong: the index shows its empty state and there are no detail routes, so `/plugins/<slug>` is a 404.

Failure behaviour: if the registry cannot be reached, or answers with anything other than the packument or a 404, the build fails. Entries whose published state could not be confirmed are never emitted. Every `docusaurus build` and `docusaurus start`, including the website job in CI, therefore needs the registry. For local work on the site without network, set `LWC_CATALOGUE_OFFLINE=1`: no request is made and every package counts as unpublished, so the catalogue is empty rather than wrong; the script refuses this mode when `CI` is set. `LWC_CATALOGUE_REGISTRY` overrides the registry URL; the script uses plain `fetch`, so proxy settings from `.npmrc` do not apply to it.
