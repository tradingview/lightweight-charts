# Plugin catalogue data

The `lwc-plugin-catalogue` Docusaurus plugin gives the catalogue pages their data. Every page can read the entry summaries with `usePluginCatalogue()` from `src/hooks/use-plugin-catalogue.ts` (`CatalogueGlobalData` in `types.d.ts`). The full entry of each plugin, README included, is written as `<slug>.json` through `createData` in `contentLoaded`, for the per-plugin pages to load through their route.

The data is produced by `scripts/plugins/catalogue.mjs` (`pnpm plugins:catalogue` prints it), which:

1. enumerates the non-private packages under `packages/lwc-plugin-*` and validates each against the package contract, the same check as `pnpm plugins:validate`. Any problem fails the docs build; a partial catalogue is never shipped.
2. asks the npm registry for each package, in parallel, with three attempts on network errors and 5xx answers. A package that has never been published is listed in `unpublished` by name and gets no entry. A published one becomes an entry in `plugins`.

Where each field of an entry comes from:

- from the published release on the registry, so that the page describes what `npm install` delivers: `version`, `publishedAt`, `peerRange` (null if the published manifest declares none), `description`, `license`, `keywords`, `deprecated` (the `npm deprecate` message), `readme` (falling back to the workspace README, with a warning, when the registry holds none)
- from the workspace, because they curate the entry rather than describe the artefact: `lwcPlugin` (title, category, lifecycle, origin, author, demo, tags), `repository.url`
- derived: `slug` (unique, the URL segment), `npmUrl`, `repository.directory` and `demoPath` (repo-relative POSIX paths of the package and of its demo page source), and `pendingVersion`, set when the workspace version is newer than the published one. Pages should show a pending release rather than hide the entry.

Failure behaviour: if the registry cannot be reached, or answers with anything other than the packument or a 404, the build fails. Entries whose published state could not be confirmed are never emitted. Every `docusaurus build` and `docusaurus start`, including the website job in CI, therefore needs the registry. For local work on the site without network, set `LWC_CATALOGUE_OFFLINE=1`: no request is made and every package counts as unpublished, so the catalogue is empty rather than wrong; the script refuses this mode when `CI` is set. `LWC_CATALOGUE_REGISTRY` overrides the registry URL; the script uses plain `fetch`, so proxy settings from `.npmrc` do not apply to it.
