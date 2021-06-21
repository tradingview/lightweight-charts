# Debug package mode

Every `lightweight-charts` packages includes development and production builds for every type of module (esm, cjs, standalone).

Below you can read about the difference between these builds and how to enable development mode while debugging.

## Development build

A development (or debug) build is suitable for debugging purposes and could be useful while development.

It includes, but not be limited to:

- Additional data checks, which allow you handle incorrect usage of the library
- Readable name of methods, functions and classes
- Although it is a bundle of the code, it is close to the source code (what might be useful to debug issues)
- A bundle is not minified

This allows you to make your debug/development process easier if you faced an issue.

## Production build

A production build is well optimized to be used in the production:

- It doesn't have any unnecessary run-time checks of the data
- It has small size (it's minified with advanced optimizations - note that it is NOT just like a general minification with `uglify-es` or `terser`)

## How to enable development mode

By default, your bundler probably will use production build of the library, because of `main` and `module` fields in [`package.json`](../package.json) file.

If you'd like to enable debug mode instead of production while development, you need to configure your bundler so it will use different resolve algorithm for the package.

Below you can find tips how to set up development build over production one for some popular bundlers (for other bundlers configuration will be similar).

### Webpack

If you're using Webpack, you need to configure [`resolve.alias`](https://webpack.js.org/configuration/resolve/#resolvealias) config option:

```js
// webpack.config.js

module.exports = {
    // ...
    resolve: {
        alias: {
            // you can add this alias while dev mode only if you'd like
            'lightweight-charts': 'lightweight-charts/dist/lightweight-charts.esm.development.js',
        },
    },
};
```

### Rollup

If you're using Rollup, you need to use [`@rollup/plugin-alias`](https://github.com/rollup/plugins/tree/master/packages/alias) plugin:

```js
// rollup.config.js

import alias from '@rollup/plugin-alias';

module.exports = {
    // ...
    plugins: [
        alias({
            entries: [
                // you can add this alias while dev mode only if you'd like
                { find: 'lightweight-charts', replacement: 'lightweight-charts/dist/lightweight-charts.esm.development.js' },
            ],
        }),
    ],
};
```

### Parcel

If you're using Parcel, you need to set up [`alias` field](https://parceljs.org/module_resolution.html#aliases) in the `package.json` file:

**package.json:**

```json
{
  "alias": {
    "lightweight-charts": "lightweight-charts/dist/lightweight-charts.esm.development.js"
  }
}
```
