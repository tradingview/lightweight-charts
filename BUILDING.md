# Building Lightweight Charts

The minimal supported version of [NodeJS](https://nodejs.org/) for development is 16.16.

**Note:** you need to run `npm install` in both the root directory and the `website` directory before you can run the lint tests.

## Compiling

- `npm run tsc` - compiles the source code only (excluding tests)
- `npm run tsc-watch` - runs the TypeScript compiler in the watch mode for source code (same as `tsc`, but in the watch mode)
- `npm run tsc-verify` - compiles everything (source code and tests) with composite projects config to ensure that no invalid imports or cyclic deps are found

## Bundling

- `npm run rollup` - runs Rollup to bundle code
- `npm run build` - compiles source code and bundles it (as one word for `npm run tsc && npm run rollup`)
- `npm run build:prod` - the same as `npm run build`, but also bundles production (minified) builds

## Testing

- `npm run lint` - runs lint for the code
- `npm run test` - runs unit-tests

There are several included e2e tests available which can be run individually. Please have a read through the following document for further information: [/tests/README.md](./tests/README.md)

## Tips

- You can use the following command to make sure that your local copy passes all (almost) available checks:

    `npm run verify`

- If you want to play with a locally built package, you can create a `debug.html` page: `cp debug.html.example debug.html`.

    This file (`debug.html`) is under gitignore, so you don't need to worry about changing it and you can modify it as you wish.

## Deploying a new version

1. Run `npm run docusaurus docs:version MAJ:MIN` in `website` folder to create new versioned docs.
  Note that there is not patch version in docs, only major and minor parts.
1. (optional) Remove docs for the oldest version (see <https://docusaurus.io/docs/versioning#deleting-an-existing-version>).
1. Handle the new version in `import-lightweight-charts-version.ts`: add a package reference for that version to `website/package.json` (e.g. `"lightweight-charts-MAJ.MIN": "npm:lightweight-charts@~MAJ.MIN.0"`) and a import of that package in a matching case statement.
1. Bump `lightweight-charts` package version in `website/package.json` file.
1. Add all created files to git and commit changes.
  Note that at this step the website cannot work since it uses unpublished so far version. It will be fixed in the next steps.
1. Create a git tag for this version with the format `vMAJ.MIN.PATCH` (see other tags).
1. Run `npm run prepare-release` in the root folder.
1. Run `npm publish` to publish changes to npm.
1. Revert changes made in `package.json` file after `prepare-release` script.
1. Bump the library's version in root `package.json` file to the next one (either major or minor depending on the planning and expected breaking changes).
1. Push the changes back to github (don't forget to push tags).
1. Create and publish a release on github.
1. Close the milestone.
