# Lightweight Charts

[![CircleCI](https://img.shields.io/circleci/build/github/tradingview/lightweight-charts.svg)](https://circleci.com/gh/tradingview/lightweight-charts)
[![npm version](https://badge.fury.io/js/lightweight-charts.svg)](https://www.npmjs.com/package/lightweight-charts)
[![npm bundle size](https://badgen.net/bundlephobia/minzip/lightweight-charts)](https://bundlephobia.com/result?p=lightweight-charts)
![Zero dependencies](https://badgen.net/badge/dependencies/0/green)
[![Downloads](https://img.shields.io/npm/dm/lightweight-charts.svg)](https://www.npmjs.com/package/lightweight-charts)

[Demos](https://www.tradingview.com/lightweight-charts/) | [Documentation](./docs/getting-started.md)

TradingView Lightweight Charts is one of the smallest and fastest financial HTML5 charts.

The Lightweight Charting Library is the best choice for you if you want to display financial data as an interactive chart on your web page without affecting your web page loading speed and performance.

It is the best choice for you if you want to replace static image charts with interactive ones.
The size of the library is close to static images but if you have dozens of image charts on a web page then using this library can make the size of your web page smaller.

## Installing

### es6 via npm

```bash
npm install lightweight-charts
```

```js
import { createChart } from 'lightweight-charts';

const chart = createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addLineSeries();
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

### CDN

You can use [unpkg](https://unpkg.com/):

<https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js>

The standalone version creates `window.LightweightCharts` object with all exports from `esm` version:

```js
const chart = LightweightCharts.createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addLineSeries();
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

## Development

Note that the minimal supported version of [NodeJS](https://nodejs.org/) for development is 10.

### Compiling

- `npm run tsc` - compiles the source code only (excluding tests)
- `npm run tsc-watch` - runs the TypeScript compiler in the watch mode for source code (same as `tsc`, but in the watch mode)
- `npm run tsc-all` - compiles everything (source code and tests)
- `npm run tsc-all-watch` - runs the TypeScript compiler in watch mode for source code and tests (same as `tsc-all`, but in watch mode)

### Bundling

- `npm run rollup` - runs Rollup to bundle code
- `npm run build` - compiles source code and bundles it (as one word for `npm run tsc && npm run rollup`)

Note that only the dev version is bundled by default.
To bundle production builds (minified) too just set the `NODE_ENV` variable to `production` and run bundling, e.g. `NODE_ENV=production npm run rollup`.

### Testing

- `npm run lint` - runs lint for the code
- `npm run test` - runs unit-tests

### Tips

To make sure that your local copy passed all (almost) checks, you can use the `verify` npm script: `npm run verify`.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License.
You may obtain a copy of the License at LICENSE file.
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This software incorporates several parts of tslib (<https://github.com/Microsoft/tslib>, (c) Microsoft Corporation) that are covered by the the Apache License, Version 2.0.

This license requires specifying TradingView as the product creator. You can use one of the following methods to do it:

- do not disable the TradingView branding displaying;
- add the "attribution notice" from the NOTICE file and a link to our website (<https://www.tradingview.com/>) to the page of your website or mobile application that is available to your users;
