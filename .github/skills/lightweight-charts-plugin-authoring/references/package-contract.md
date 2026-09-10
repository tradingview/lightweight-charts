# The plugin package contract

What makes a plugin package publishable and catalogue-ready. Upstream,
`pnpm plugins:validate` (`scripts/plugins/validate-metadata.mjs`) enforces all
of it and fails CI otherwise; a project scaffolded by `create-lwc-plugin`
already satisfies every item, so this is mostly a list of what not to break.
The catalogue on the docs site lists the official packages today; the same
contract is what any plugin would need to be listed.

## `package.json`

| Field | Rule | Why |
| --- | --- | --- |
| `name` | starts with `lwc-plugin-` (unscoped), or `@tradingview/lwc-plugin-` for an official package | the unscoped remainder is the catalogue's URL segment and the entry file name |
| `version` | valid semver | the release script compares it with npm |
| `description` | non-empty | shown on the catalogue card |
| `license` | non-empty SPDX id | shown on the detail page |
| `publishConfig.access` | `"public"` | scoped packages default to restricted |
| `peerDependencies.lightweight-charts` | a valid range, `^5.0.0` unless a 5.1 hook is required | the catalogue shows "works with"; consumers install the library themselves |
| `keywords` | includes `lightweight-charts-plugin` | how npm search and the registry find plugins |
| `files` | `dist` (+ `CHANGELOG.md`, `NOTICE` for official) | ship built output only |
| `exports` | `.` and `./standalone`, each with `types` + `default` | the standalone build inlines everything but the library, for CDN import maps |
| `lwcPlugin` | see below | the catalogue's curated metadata |
| `repository.directory` | must equal the package's real path in the repo | the "source" link and the catalogue read it |

## The `lwcPlugin` block

Validated against `scripts/plugins/lwc-plugin-metadata.schema.json`;
unknown keys are errors.

| Key | Required | Values |
| --- | --- | --- |
| `title` | yes | display name |
| `category` | yes | `custom-series` \| `series-primitive` \| `pane-primitive` |
| `lifecycle` | yes | `current` \| `legacy` \| `deprecated` \| `experimental` |
| `origin` | yes | `official` \| `community` (workspace packages must be `official`) |
| `demo` | yes | package-relative path of the dev demo page; the file must exist |
| `author` | no | display name |
| `preview` | no | package-relative path of the catalogue preview page; must exist if declared |
| `previewHeight` | no | integer ≥ 200, CSS px for the preview frame (default 330); only with `preview` |
| `tags` | no | search terms |

## Two pages, not one

- **Demo** (`src/example/index.html` + `example.ts`, `lwcPlugin.demo`): the
  page a developer opens on its own. Put the edge cases here — whitespace
  runs, negatives, every option as a control. `pnpm dev` serves it; upstream,
  `pnpm plugins:build-demos` builds it to `/plugin-demos/<slug>/` on the site.
- **Preview** (`src/example/preview.html` + `preview.ts`, `lwcPlugin.preview`):
  what the catalogue frames next to the README, in a frame ~330 px tall. Show
  the plugin at its best: clean data, two or three controls, no explanatory
  text. Official packages build it with the private
  `@tradingview/lwc-plugin-preview-kit` (layout + `mountControls` /
  `addRefreshButton`); a standalone project has no preview by default.

Neither page is the plugin's tests. Keep them free of assertions.

## README shape

The catalogue renders the README as the page body (its H1 dropped, since the
page header shows the title), with the Installation subsections lifted into
an npm/CDN tab switcher. So:

1. `# <Title>` then a description paragraph.
2. `## Installation` with `### npm` (install command + import example) and
   `### CDN` (an import map pointing `lightweight-charts` and the package at
   their standalone builds, then the same import by name).
3. `## Usage` with at least one `js`/`ts` code block — the release smoke test
   compiles the first snippet after `### npm`, so it must be complete and
   correct.
4. `## Options`, `## Notes` as needed. Headings become anchors and a table of
   contents on the site, so keep them descriptive.

If the series ships a factory, the README's snippets use it, and a line says
the plain class draws continuously (no whitespace detection).

## Tests

Official packages carry `tests/unit/*.spec.ts` (run by the repo's `pnpm test`),
`tests/graphics/*.js` (screenshot comparison against the previous build) and
`tests/interactions/*.js` (async `beforeInteractions(container)` that throws on
a wrong outcome). The e2e runners discover them by folder; a package without
a `tests/<suite>` folder is skipped, never failed.

## CHANGELOG

Keep a Changelog format, one `## <version>` per release. For the **first**
release keep it short: a sentence saying it is the first release (and where
it came from), an `### Added` list of what the package provides, and
`### Deprecated` only if it ships a deprecated alias. No `Fixed` or `Changed`
— nothing has been released to fix or change, and entries written as commit
subjects read badly on npm. The release script only checks that an entry for
the current version exists.

## Scripts a package is expected to have

`dev` (Vite on the demo page), `build` (`tsc` for declarations, then the
shared compile producing `dist/<entry>.js` and `dist/<entry>.standalone.js`
plus bundled `.d.ts`), `typecheck`, and `check-package` (`publint --strict`
and `@arethetypeswrong/cli`). Upstream adds `plugins:check-compat` (build every
plugin against the workspace library) and `plugins:smoke` (install the packed
tarball into a fresh Vite project and compile the README snippet).
