---
name: npm-publish
description: >-
  Use when cutting and publishing a release of this lightweight-charts fork to
  the npm registry under the @bishopbot scope. Covers the three publishable
  surfaces — the root lightweight-charts library, the @bishopbot/lwc-toolkit
  shared package, and the 12 @bishopbot/lwc-plugin-* packages under packages/
  — including feature branches, PR CI gates, merge to master, the local
  release script, version tags, and the grouped GitHub release. Triggers:
  "publish", "release", "cut a release", "bump version", "tag and push",
  "release the plugin", or any question about how this fork ships packages
  to npm.
---

# Publishing releases to npm

This fork is a pnpm workspace, derived from `tradingview/lightweight-charts`. Three things can be published to npm from this repo, all under the **`@bishopbot`** scope (the GitHub org that owns this fork):

| Surface | Path | Publishes as | Cadence |
|---|---|---|---|
| Library | `package.json` (root) | `@bishopbot/lightweight-charts` | Manual; publish it first, the plugins peer on it |
| Toolkit | `packages/lwc-toolkit/` | `@bishopbot/lwc-toolkit` | When a shared primitive changes |
| Plugins | `packages/lwc-plugin-*/` (12 publishable) | `@bishopbot/lwc-plugin-<name>` | Per-package, on demand |
| Wizard | `packages/create-lwc-plugin/` | `@bishopbot/create-lwc-plugin` | Rarely |

> **Why the scope is `@bishopbot`, not `@tradingview`.** This repo is a fork — the GitHub remote is `github.com/bishop-bot/lightweight-charts`, and the npm publish target is the npm org you (the maintainer) own. Upstream `tradingview/lightweight-charts` is still maintained by TradingView and still publishes the original `lightweight-charts` and `@tradingview/lwc-*` packages. Publishing under `@bishopbot` keeps the fork's tarballs and tags separate from the upstream's.

The plugins and toolkit are the surfaces this repo documents a script for. The root library's `package.json` is `private: true` to keep it from publishing accidentally; it ships via `pnpm prepare-release` only when a maintainer intentionally runs it (see step 6).

**The library peer contract.** Every plugin and the toolkit declare
`@bishopbot/lightweight-charts` (`^6.0.0`) as their library peer dependency,
and the upstream `lightweight-charts` (`^5.0.0`) as an **optional** peer, so
a consumer that already depends on the upstream 5.x line is not forced to
change anything. The fork's packages import the scoped name at runtime; the
optional peer only keeps the two lines installable side by side. Publish the
library **before** the plugins: the floor check installs the peer from the
registry, and it fails until `@bishopbot/lightweight-charts` is there.

> **One-time setup, do this once on a fresh machine before your first release.**
>
> ```sh
> # 1. Node 22.3+ (the version in .nvmrc / package.json#engines).
> node --version            # expect v22.x or higher
>
> # 2. Enable pnpm via Corepack (the version is pinned in package.json#packageManager).
> corepack enable
> pnpm --version            # expect 10.34.5
>
> # 3. Log in to npm with an account that is a member of the @bishopbot org.
> #    Either your own account or a bot account; the account must have publish
> #    rights for @bishopbot (set at https://www.npmjs.com/settings/orgs/bishopbot/teams).
> npm login                 # use a token, not a password, if your org enforces 2FA
> npm whoami                # confirm the username matches your maintainer identity
>
> # 4. Verify the registry the publish will land on.
> cat .npmrc                # expect: registry=https://registry.npmjs.org/
>                           #         @bishopbot:registry=https://registry.npmjs.org/
> ```
>
> If `npm whoami` does not return an account that is a member of the `@bishopbot` org, stop. Publishing requires that scope.

---

## 1. Branch and PR

All release work lands through a normal pull request. No direct pushes to `master`.

1. **Branch off the current `master`:**

   ```sh
   git checkout master && git pull --ff-only
   git switch -c release/<surface>-<bump>     # e.g. release/plugin-scatter-patch
   ```

2. **Make the change.** For a plugin, the minimum diff is:
   - `version` in `packages/lwc-plugin-<name>/package.json` (follow semver).
   - `## X.Y.Z - YYYY-MM-DD` section at the top of `packages/lwc-plugin-<name>/CHANGELOG.md`. Format is [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the entry is the release note.
3. **Write a Conventional Commits message** — this repo's `CONTRIBUTING.md` and the githooks enforce the format. `feat:`, `fix:`, `refactor:`, `feat!:` (breaking) are the common ones.
4. **Run the local pre-flight checks** (the same ones CI runs):

   ```sh
   pnpm install --frozen-lockfile
   pnpm plugins:validate --filter @bishopbot/lwc-plugin-<name>
   pnpm plugins:check-compat --filter @bishopbot/lwc-plugin-<name>
   pnpm plugins:release --filter @bishopbot/lwc-plugin-<name> --check-only
   ```

   Each must exit 0. `--check-only` validates metadata + version + CHANGELOG without building.
5. **Push and open a PR** against `master`. The PR template asks for the change type, tests, and docs. Fill it in.
6. **Wait for CI green** on the PR. Three jobs in CircleCI are the gates for plugin PRs: `plugins:validate`, `plugins:check-compat`, `plugins:release --check-only`. All three must be ✅ before review.
7. **Get review and merge.** Outside contributors need an explicit "help wanted" approval before a feature PR is even reviewed. Use the merge button — do not rebase (the project's `CONTRIBUTING.md` calls this out: rebase during review makes it impossible to follow the change set).

---

## 2. Post-merge: dry-run on `master`

After the PR merges, the `Plugin packages` GitHub Action runs on `master` and exercises every release candidate end-to-end (build, pack, content check) without publishing. Open the action run, find the `release-dry-run` job, and confirm the package you bumped shows up with `✅` next to its version.

> If the dry run reports a failure for your package, the next step (`pnpm plugins:release`) will fail locally. Stop here, fix the cause on a new PR, and re-merge.

---

## 3. Publish from a clean `master` checkout

Publishing is intentionally local. The release script refuses to run when `CI` is set, refuses an uncommitted tree, and refuses a non-`master` branch.

1. **Sync to a clean `master` and rebuild the workspace from scratch:**

   ```sh
   git checkout master && git pull --ff-only
   git status                                 # expect: nothing to commit, working tree clean
   pnpm install --frozen-lockfile
   pnpm build                                 # builds the root library (tsc + rollup + dts)
   pnpm --filter @bishopbot/lwc-toolkit build
   ```

   `pnpm plugins:release` builds the library and the toolkit itself, but doing it first surfaces a build problem in isolation.
2. **Run the dry run for the package(s) you intend to ship:**

   ```sh
   pnpm plugins:release --dry-run --filter @bishopbot/lwc-plugin-<name>
   ```

   You should see `📌 Release candidate: local X.Y.Z > remote (old version)` and `✅ Content and metadata verified successfully`.
3. **Run the real release:**

   ```sh
   pnpm plugins:release --filter @bishopbot/lwc-plugin-<name>
   ```

   The script prompts per package (`Publish @bishopbot/lwc-plugin-<name>@X.Y.Z to npm? (y/N)`). Type `y` and press Enter. A failed package is reported at the end and does not stop the others.
4. **Verify on the registry:**

   ```sh
   npm view @bishopbot/lwc-plugin-<name> version
   ```

   Should print the version you just published.

---

## 4. Tag and push

The published package gets a tag in this repo. Tags are the only durable record of which commit shipped which version; the registry keeps the tarball but the changelog anchor lives here.

1. **Tag the merged commit:**

   ```sh
   git tag @bishopbot/lwc-plugin-<name>@X.Y.Z
   git push origin --tags
   ```

   Tag format is the npm identifier verbatim, with `@` between name and version. (This is unusual but consistent across this repo — see `BUILDING.md` "Plugin packages".)
2. **Do the same for the toolkit** if you also bumped `packages/lwc-toolkit/package.json`:

   ```sh
   git tag @bishopbot/lwc-toolkit@X.Y.Z
   git push origin --tags
   ```

3. **Open a grouped GitHub release** once every package in the round is published:
   - Tag name: `plugins-YYYY-MM-DD` (date of the publish round).
   - **Untick "Set as the latest release"** — the library's `vX.Y.Z` tag keeps the Latest label, the `/releases/latest` URL, and the sidebar.
   - Body: one sentence on what the round was, then a table of `Package | Version` with each version linking to that package's `CHANGELOG.md` at its own tag (e.g. `blob/@bishopbot/lwc-plugin-scatter-series@1.0.1/packages/lwc-plugin-scatter-series/CHANGELOG.md`), not on `master`. Pinning to the tag means the link still describes that version after the next bump.
   - If the round was driven by a toolkit change, say so explicitly in the body and explain that the listed plugins were rebuilt for the toolkit change.

---

## 5. Toolkit-only path (when `@bishopbot/lwc-toolkit` changes but no plugin source changed)

Plugins bundle the toolkit into their own `dist/` at build time, so a toolkit bump only reaches users once every affected plugin is rebuilt and republished. Skip this section unless you are intentionally shipping a toolkit change.

1. **Identify which plugins are affected:**

   ```sh
   pnpm plugins:check-stale
   ```

   This rebuilds every published plugin against the workspace toolkit and compares the output byte-for-byte to the version on npm. A plugin whose `dist/` differs is reported as `changed` and must be republished.
2. **Bump versions in lock-step:** update `version` in `packages/lwc-toolkit/package.json` AND in each affected `packages/lwc-plugin-*/package.json`, with a matching `## X.Y.Z` entry in each `CHANGELOG.md`. Land all of this in a single PR.
3. **Build the toolkit from `master`:**

   ```sh
   git checkout master && git pull --ff-only
   pnpm install --frozen-lockfile
   pnpm build
   pnpm --filter @bishopbot/lwc-toolkit typecheck
   pnpm --filter @bishopbot/lwc-toolkit build
   ```

   `pnpm publish` ships the `dist/` that is on disk; the build must run on the merged commit.
4. **Lint the package the way CI does:**

   ```sh
   pnpm dlx publint@0.3.14 --strict
   pnpm dlx @arethetypeswrong/cli@0.18.5 --pack . \
     --ignore-rules no-resolution cjs-resolves-to-esm
   ```

   Run from `packages/lwc-toolkit/`.
5. **Dry-run, then publish:**

   ```sh
   pnpm --filter @bishopbot/lwc-toolkit publish --access public --dry-run
   pnpm --filter @bishopbot/lwc-toolkit publish --access public
   ```

6. **Tag and continue** with the affected plugins through step 3 of the main flow, then create a single grouped GitHub release that names the toolkit bump as the reason for the plugin re-releases.

---

## 6. Library (root package) path

The root library is `private: true` to prevent accidental publish, and it is published under the scoped name `@bishopbot/lightweight-charts` (the unscoped `lightweight-charts` is owned upstream by TradingView).

The name, the version (`6.0.0`) and the top-level `CHANGELOG.md` are already in the tree. For every release after that:

1. Bump `version` in the root `package.json` and add a `## X.Y.Z` entry to the root `CHANGELOG.md` (Keep a Changelog format, as the plugin changelogs use).
2. Build the release artefact:

   ```sh
   pnpm build:prod              # NODE_ENV=production pnpm build
   pnpm prepare-package-json-for-release
   ```

   `prepare-package-json-for-release` (script `scripts/clean-package-json.js`) strips `private`, `engines`, `devDependencies`, `scripts`, and `packageManager` from the root `package.json` so a published tarball does not leak dev-only fields. The change is on disk and must be reverted before committing if you do not want it tracked. `publishConfig.access` is `public`, and `files` carries `LICENSE`, `NOTICE` and `CHANGELOG.md`, as Apache-2.0 requires.
3. Check what the tarball will contain, then publish from a clean `master`:

   ```sh
   git checkout master && git pull --ff-only
   git status                   # must be clean
   npm pack --dry-run           # dist/, LICENSE, NOTICE, CHANGELOG.md, package.json
   pnpm publish --access public
   ```

4. Tag the library and push:

   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

5. The website `deploy.yml` workflow runs on the `v*` tag push and rebuilds the documentation site. Wait for it to finish before announcing the release.

6. Only then publish the plugins and the toolkit: their floor check resolves the library peer from the registry, and it needs `@bishopbot/lightweight-charts@6.0.0` to be there.

---

## 7. Reference: tag naming

| Tag | Where it is created | Pushes to |
|---|---|---|
| `vX.Y.Z` | Root library release (step 6.5) | Triggers `deploy.yml` for the website |
| `@bishopbot/lwc-plugin-<name>@X.Y.Z` | Per-plugin release (step 4.1) | Anchors the changelog link in the grouped release |
| `@bishopbot/lwc-toolkit@X.Y.Z` | Toolkit release (step 5.6) | Anchors the changelog link in the grouped release |
| `plugins-YYYY-MM-DD` | One per publish round (step 4.3) | The grouped GitHub release tag, never marked Latest |

All tags are pushed with `git push origin --tags`. Do not push individual tags with `:refs/tags/<name>` — `--tags` is the convention used in `BUILDING.md` and matches what the GitHub Actions expect.

---

## 8. Reference: which script does what

| Script | What it does | When to run it |
|---|---|---|
| `pnpm plugins:validate` | Schema and metadata check on every plugin package | PR-time, step 1.4 |
| `pnpm plugins:check-compat` | Typecheck and build every plugin against the workspace library | PR-time, step 1.4 |
| `pnpm plugins:check-compat --floor` | Typecheck each plugin against its minimum declared peer version from npm | Quarterly or before a major version cut |
| `pnpm plugins:check-stale` | Compare each plugin's fresh `dist/` byte-for-byte to npm | Before a toolkit bump, step 5.1 |
| `pnpm plugins:release --check-only` | Validate metadata + version + CHANGELOG only | PR-time and CI, step 1.4 |
| `pnpm plugins:release --dry-run` | Build, pack, verify tarball content, do not publish | Post-merge, step 3.2 |
| `pnpm plugins:release` | Build, pack, verify, and publish with a per-package prompt | Local, step 3.3 |
| `pnpm build` | `tsc` + `rollup` + `bundle-dts` for the root library | Before any release, step 3.1 |
| `pnpm build:prod` | Same as `pnpm build` but with `NODE_ENV=production` (minified) | Library release, step 6.3 |
| `pnpm prepare-package-json-for-release` | Strip dev-only fields from root `package.json` | Library release, step 6.3 |
| `pnpm publish` | Publish the current package (`prepare-release` is a wrapper around this for the root) | Library release, step 6.4 |
| `pnpm --filter @bishopbot/lwc-toolkit publish` | Publish the toolkit | Toolkit release, step 5.5 |

`--filter` accepts the package name, the folder name, or a short name. `--path <dir>` accepts any directory and is for one-off packages that are not in the workspace.

---

## 9. Reference: where the CI gates live

| Gate | Where | Runs on |
|---|---|---|
| `plugins:validate` | CircleCI `plugins` job | Every PR |
| `plugins:check-compat` | CircleCI `plugins` job | Every PR |
| `plugins:release --check-only` | CircleCI `plugins` job | Every PR |
| `release-dry-run` (build + pack + verify, no publish) | GitHub Action `.github/workflows/plugins.yml` | Push to `master` |
| Floor check (compat against minimum peer) | GitHub Action `.github/workflows/plugins-floor.yml` | Push to `master` touching `packages/` or scripts |
| Smoke install (packs plugin, installs next to library, builds a Vite harness) | GitHub Action `.github/workflows/plugins.yml` (`smoke` check) | Push to `release/**` branches and `v*` tags |
| Website deploy | GitHub Action `.github/workflows/deploy.yml` | Push to `master` touching source paths |

Nothing in CI publishes. The release script's `process.env.CI` guard is the second line of defense after the absence of npm credentials in the CI environments.
