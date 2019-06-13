# Building Lightweight Charts

The minimal supported version of [NodeJS](https://nodejs.org/) for development is 10.

## Compiling

- `npm run tsc` - compiles the source code only (excluding tests)
- `npm run tsc-watch` - runs the TypeScript compiler in the watch mode for source code (same as `tsc`, but in the watch mode)
- `npm run tsc-all` - compiles everything (source code and tests)
- `npm run tsc-all-watch` - runs the TypeScript compiler in watch mode for source code and tests (same as `tsc-all`, but in watch mode)

## Bundling

- `npm run rollup` - runs Rollup to bundle code
- `npm run build` - compiles source code and bundles it (as one word for `npm run tsc && npm run rollup`)

Note that only the dev version is bundled by default.
To bundle production builds (minified) too just set the `NODE_ENV` variable to `production` and run bundling, e.g. `NODE_ENV=production npm run rollup`.

## Testing

- `npm run lint` - runs lint for the code
- `npm run test` - runs unit-tests

## Tips

- To make sure that your local copy passed all (almost) checks, you can use the `verify` npm script: `npm run verify`.
- If you want to play with locally built package, you can create a `debug.html` page: `cp debug.html.example debug.html`.

    This file (`debug.html`) is under gitignore, so you don't need to worry about changing it and you can modify it as you wish.
