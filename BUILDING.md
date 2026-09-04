# Building Lightweight Charts™

The minimal supported version of [NodeJS](https://nodejs.org/) for development is 22.3.

The repository is a [pnpm](https://pnpm.io/) workspace: the library itself, the `website`, `plugin-examples`, `indicator-examples` and the packages under `packages/` are installed together with a single `pnpm install` run in the root directory.

The required pnpm version is pinned in the `packageManager` field of the root `package.json` and is provided by [Corepack](https://nodejs.org/api/corepack.html), which ships with NodeJS:

```bash
corepack enable
pnpm install
```

## Compiling

- `pnpm tsc` - compiles the source code only (excluding tests)
- `pnpm tsc-watch` - runs the TypeScript compiler in the watch mode for source code (same as `tsc`, but in the watch mode)
- `pnpm tsc-verify` - compiles everything (source code and tests) with composite projects config to ensure that no invalid imports or cyclic deps are found

## Bundling

- `pnpm rollup` - runs Rollup to bundle code
- `pnpm build` - compiles source code and bundles it (as one word for `pnpm tsc && pnpm rollup`)
- `pnpm build:prod` - the same as `pnpm build`, but also bundles production (minified) builds

## Testing

- `pnpm lint` - runs lint for the code
- `pnpm test` - runs unit-tests

There are several included e2e tests available which can be run individually. Please have a read through the following document for further information: [/tests/README.md](./tests/README.md)

## Scaffolding a plugin package

Official plugins live in their own workspace package under `packages/lwc-plugin-<name>` and are scaffolded with the same tool we recommend to community authors, `create-lwc-plugin`, in its `--workspace` mode:

```bash
pnpm scaffold-plugin
```

Run it from the repository root, or add `-w` (`pnpm -w scaffold-plugin`) when running from inside another workspace package such as `website` — otherwise pnpm looks for the script in that package and reports it as not found.

The script builds the local copy of the tool and runs it, so it always reflects your working tree. Note that `pnpm create lwc-plugin` does download the published package from npm and will not pick up any local changes to the templates or the wizard.

Workspace mode differs from the standalone mode community authors use: it scopes the package name to `@tradingview/`, depends on the library and the shared plugin utilities through `workspace:*`, marks the plugin as an official catalogue entry, and seeds a `CHANGELOG.md`, `LICENSE` and `NOTICE`. The folder path the wizard asks for is relative to the repository root regardless of where it was started from.

After scaffolding, install the new package's dependencies and check that it builds:

```bash
pnpm install
pnpm --filter @tradingview/lwc-plugin-<name> build
```

Two further notes:

- To try the standalone (community) experience instead, run the tool without the flag from a scratch directory outside the repository — it scaffolds into the current directory: `node <repo>/packages/create-lwc-plugin/index.js`.
- When iterating on the tool itself rather than scaffolding a package, `pnpm --filter create-lwc-plugin dev` builds a stub that loads the TypeScript sources at run time, so `node packages/create-lwc-plugin/index.js` picks up source edits without a rebuild. See [/packages/create-lwc-plugin/BUILDING.md](./packages/create-lwc-plugin/BUILDING.md).

## Plugin packages

The scripts in `scripts/plugins/` check and publish the official plugin packages under `packages/lwc-plugin-*` (private packages are skipped). Each accepts `--filter <name>` to target one package, `--path <dir>` to target any directory, and `--help`.

- `pnpm plugins:validate` - checks each package against the package contract: the `@tradingview/lwc-plugin-` name, a valid `version`, a `description`, a licence, public `publishConfig`, a `lightweight-charts` peer range, the `lightweight-charts-plugin` keyword, the `lwcPlugin` block against `scripts/plugins/lwc-plugin-metadata.schema.json`, no leftover scaffold placeholders, and the parts the plugin catalogue renders: a README with a description, `### npm` and `### CDN` tabs under Installation and a usage example, plus the demo page declared in `lwcPlugin.demo`
- `pnpm plugins:check-compat` - builds the library and the toolkit from the workspace, then runs every plugin's own typecheck and build against them. `--floor` instead installs each plugin's minimum declared peer version from npm into a temporary project and typechecks against that
- `pnpm plugins:check-stale` - rebuilds every published plugin against the workspace toolkit and compares its `dist/` byte for byte with the version on npm. A plugin whose output changed without a version bump fails the check; see "Releasing the toolkit" below for why
- `pnpm plugins:smoke` - packs each plugin, installs the tarball together with the published library into a temporary Vite project, compiles the README integration snippet, and checks that the bundle contains the plugin but not the library or any other plugin
- `pnpm plugins:release` - publishes the packages whose version is newer than the one on npm; a version behind the registry is an error. `--dry-run` does everything except publish; `--check-only` validates the metadata and checks that `CHANGELOG.md` has an entry for a new version, without building or packing

CI runs three gates on every pull request, in the CircleCI `plugins` job: `plugins:validate`, `plugins:check-compat` and `plugins:release --check-only`. Two GitHub Actions workflows cover the checks that need the npm registry: the release dry run after every push to `master`, the floor check on `master` pushes that touch `packages/` or the scripts, and the smoke test on `release/*` branches and `v*` tags, where it installs that build of the library. Each of the three can also be started by hand from the Actions tab, optionally for a single package. Nothing in CI publishes: no npm credentials exist there, the release script refuses to publish when the `CI` environment variable is set, and the dry-run job asserts that refusal on every run. `plugins:check-stale` is run by hand as part of the toolkit release procedure below.

Plugin and toolkit releases are tagged with their npm identifier, `@tradingview/lwc-plugin-<name>@X.Y.Z` and `@tradingview/lwc-toolkit@X.Y.Z`, next to the library's `vX.Y.Z` tags.

### Releasing a plugin package

1. Prerequisites: Node 22 or later, publish rights for the `@tradingview` scope (`npm whoami` shows the account), and a clean checkout of `master`. `pnpm publish` refuses to run from another branch or with uncommitted changes.
1. Bump `version` in the package's `package.json` and add a `## X.Y.Z` entry to its `CHANGELOG.md`. Land this through a normal pull request: CI validates the metadata and the changelog entry, and the publish happens from `master` after the merge.
1. Build the library and the toolkit: `pnpm build`, then `pnpm --filter @tradingview/lwc-toolkit build`. Plugin builds resolve both through the workspace, with entry points in `dist/` folders that do not exist on a clean checkout. Every script that builds a plugin does this itself as well; running it first surfaces a library build problem before anything else.
1. Run the checks: `pnpm plugins:validate`, `pnpm plugins:check-compat` and `pnpm plugins:smoke`. Add `--filter <name>` to limit them to the package being released. The smoke test can also be started from the Actions tab, as the `smoke` check of the "Plugin packages" workflow.
1. Dry run: `pnpm plugins:release --dry-run`. It reports every package whose version is newer than the one on npm, builds, packs and verifies each of them, and publishes nothing.
1. Publish: `pnpm plugins:release`. Confirm each package at its prompt. A package that fails is reported at the end and does not stop the others.
1. Tag each published package and push the tags:

    ```bash
    git tag @tradingview/lwc-plugin-<name>@X.Y.Z
    git push origin --tags
    ```

    A GitHub release is optional; the changelog entry is the release note.

### Releasing the toolkit

Plugins bundle `@tradingview/lwc-toolkit` into their own `dist/` when they are built, so a toolkit change only reaches users once every affected plugin is rebuilt and published. `pnpm plugins:check-stale` tells you which plugins those are, by comparing a fresh build of each published plugin with the version on npm. The comparison is byte for byte, which the template build makes reliable: fixed file names, no sourcemaps, no timestamps. Keep it that way. Upgrading Vite, TypeScript or dts-bundle-generator changes the output of every plugin and rightly forces a round of releases.

1. Prerequisites as above.
1. Run `pnpm plugins:check-stale`. It builds the library and the toolkit from your working tree, rebuilds every published plugin against them, and compares the output with npm. For every plugin it reports as changed, bump its `version` and add a `CHANGELOG.md` entry describing the toolkit change. A plugin whose output it reports as identical does not need a release.
1. Bump `version` in `packages/lwc-toolkit/package.json` and add its `CHANGELOG.md` entry. Land the toolkit and plugin bumps together through a pull request.
1. From `master`, build what will be published: `pnpm build`, then `pnpm --filter @tradingview/lwc-toolkit typecheck` and `pnpm --filter @tradingview/lwc-toolkit build`. `pnpm publish` ships the `dist/` that is on disk and does not rebuild it, so this step has to run on the merged commit.
1. Check the package the way CI does, in `packages/lwc-toolkit`: `pnpm dlx publint@0.3.14 --strict` and `pnpm dlx @arethetypeswrong/cli@0.18.5 --pack . --ignore-rules no-resolution cjs-resolves-to-esm`.
1. Dry run, then publish: `pnpm --filter @tradingview/lwc-toolkit publish --access public --dry-run`, then the same command without `--dry-run`.
1. Tag it, `git tag @tradingview/lwc-toolkit@X.Y.Z`, and push the tags.
1. Release the plugins bumped in step 2 by following "Releasing a plugin package" from its build step onward. Their bundled toolkit changed, so the checks step applies to them in full.

## Tips

- You can use the following command to make sure that your local copy passes all (almost) available checks:

    `pnpm verify`

- If you want to play with a locally built package, follow the instructions in [/debug/README.md](./debug/README.md) to create a sandbox for developing in.

## Deploying a new version

1. Update any documentation pages which refer to a specific version. For example, the `Android` and `iOS` pages (only if the mobile package version is also updated).
1. Run `pnpm docusaurus docs:version MAJ.MIN` in `website` folder to create new versioned docs.
  Note that there is not patch version in docs, only major and minor parts.
1. (optional) Remove docs for the oldest version (see <https://docusaurus.io/docs/versioning#deleting-an-existing-version>).
1. Handle the new version in `import-lightweight-charts-version.ts`: add a package reference for that version to `website/package.json` (e.g. `"lightweight-charts-MAJ.MIN": "npm:lightweight-charts@~MAJ.MIN.0"`) and a import of that package in a matching case statement.
1. Bump `lightweight-charts` package version in `website/package.json` file.
1. Add all created files to git and commit changes.
  Note that at this step the website cannot work since it uses unpublished so far version. It will be fixed in the next steps.
1. Create a git tag for this version with the format `vMAJ.MIN.PATCH` (see other tags).
1. Run `pnpm prepare-release` in the root folder.
1. Run `pnpm dlx publint` and ensure that there aren't any issues with the generated `package.json`.
1. Run `npm publish` to publish changes to npm.
1. Revert changes made in `package.json` file after `prepare-release` script.
1. Bump the library's version in root `package.json` file to the next one (either major or minor depending on the planning and expected breaking changes).
1. Push the changes back to github (don't forget to push tags).
1. Create and publish a release on github.
1. Check that none of the tutorials pages are using links to 'next' api interfaces. If you find any then you should be able to update the link to use the new 'current' release we have just released.
1. Close the milestone.

## Deploying a pre-release version

These steps are similar to those listed above except that we don't need to do anything related to the documentation site. There isn't typically anything to commit to the repo when doing these steps.

1. Checkout master branch.
1. Update `package.json`, set version to a prerelease version, e.g. 2.0.0-rc1, 3.1.5-rc4,...
1. Run `pnpm prepare-release` in the root folder.
1. Run `pnpm dlx publint@latest` and ensure that there aren't any issues with the generated `package.json`.
1. Run `npm publish --tag next` to publish changes to npm. Use `--dry-run` if you are unsure.
1. Assign the same version number to a git tag for the latest commit in GitHub.
1. (Optional) Create and publish a release on github.
1. Discard any changes locally, to ensure you don't commit the modified package.json at a later stage.
