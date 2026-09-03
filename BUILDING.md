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

- `pnpm plugins:validate` - checks each package against the package contract: the `@tradingview/lwc-plugin-` name, a licence, public `publishConfig`, a `lightweight-charts` peer range, the `lightweight-charts-plugin` keyword, the `lwcPlugin` block against `scripts/plugins/lwc-plugin-metadata.schema.json`, and the README sections and demo page the plugin catalogue renders
- `pnpm plugins:check-compat` - builds the library from the workspace, then typechecks and builds every plugin against it. `--floor` instead installs each plugin's minimum declared peer version from npm into a temporary project and typechecks against that
- `pnpm plugins:smoke` - packs each plugin, installs the tarball together with the published library into a temporary Vite project, compiles the README integration snippet, and checks that the bundle contains the plugin but not the library or any other plugin
- `pnpm plugins:release` - publishes the packages whose version is newer than the one on npm. `--dry-run` does everything except publish; `--check-only` only checks that `CHANGELOG.md` has an entry for the new version

### Publishing plugin packages

Publishing is manual. CI runs the release script only with `--dry-run` or `--check-only`, has no npm credentials, and the script refuses to publish when the `CI` environment variable is set.

From a clean checkout of `master`, with publish rights for the `@tradingview` scope:

```bash
pnpm plugins:release --dry-run
pnpm plugins:release
```

The dry run builds, packs and verifies every package with a new version. The real run repeats that and asks for confirmation before publishing each package. A failing package is reported at the end and does not stop the others.

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
