<!-- markdownlint-disable no-inline-html first-line-h1 -->

<div align="center">
  <a href="https://www.tradingview.com/lightweight-charts/" target="_blank">
    <img width="200" src="https://github.com/tradingview/lightweight-charts/raw/master/.github/logo.svg?sanitize=true" alt="Lightweight Charts logo">
  </a>

  <h1>Lightweight Charts™</h1>

  [![CircleCI][ci-img]][ci-link]
  [![npm version][npm-version-img]][npm-link]
  [![npm bundle size][bundle-size-img]][bundle-size-link]
  [![Dependencies count][deps-count-img]][bundle-size-link]
  [![Downloads][npm-downloads-img]][npm-link]
</div>

<!-- markdownlint-enable no-inline-html -->

[Demos][demo-url] | [Documentation](https://tradingview.github.io/lightweight-charts/) | [Discord community](https://discord.gg/UC7cGkvn4U) | [Reddit](https://www.reddit.com/r/TradingView/)

TradingView Lightweight Charts™ are one of the smallest and fastest financial HTML5 charts.

The Lightweight Charts™ library is the best choice for you if you want to display financial data as an interactive chart on your web page without affecting your web page loading speed and performance.

It is the best choice for you if you want to replace static image charts with interactive ones.
The size of the library is close to static images but if you have dozens of image charts on a web page then using this library can make the size of your web page smaller.

Take a look at [awesome-tradingview](https://github.com/tradingview/awesome-tradingview?tab=readme-ov-file#lightweight-charts) for related projects created by our community members.

## Installing

### es6 via npm

```bash
npm install lightweight-charts
```

```js
import { createChart, LineSeries } from 'lightweight-charts';

const chart = createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addSeries(LineSeries);
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
const lineSeries = chart.addSeries(LightweightCharts.LineSeries);
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

### Build Variants

|Dependencies included|Mode|ES module|IIFE (`window.LightweightCharts`)|
|-|-|-|-|
|No|PROD|`lightweight-charts.production.mjs`|N/A|
|No|DEV|`lightweight-charts.development.mjs`|N/A|
|Yes (standalone)|PROD|`lightweight-charts.standalone.production.mjs`|`lightweight-charts.standalone.production.js`|
|Yes (standalone)|DEV|`lightweight-charts.standalone.development.mjs`|`lightweight-charts.standalone.development.js`|

## Development

See [BUILDING.md](./BUILDING.md) for instructions on how to build `lightweight-charts` from source.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License.
You may obtain a copy of the License at LICENSE file.
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This software incorporates several parts of tslib (<https://github.com/Microsoft/tslib>, (c) Microsoft Corporation) that are covered by BSD Zero Clause License.

This license requires specifying TradingView as the product creator.
You shall add the "attribution notice" from the NOTICE file and a link to <https://www.tradingview.com/> to the page of your website or mobile application that is available to your users.
As thanks for creating this product, we'd be grateful if you add it in a prominent place.
You can use the [`attributionLogo`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutOptions#attributionLogo) chart option for displaying an appropriate link to <https://www.tradingview.com/> on the chart itself, which will satisfy the link requirement.

[demo-url]: https://www.tradingview.com/lightweight-charts/

[ci-img]: https://img.shields.io/circleci/build/github/tradingview/lightweight-charts.svg
[ci-link]: https://circleci.com/gh/tradingview/lightweight-charts

[npm-version-img]: https://badge.fury.io/js/lightweight-charts.svg
[npm-downloads-img]: https://img.shields.io/npm/dm/lightweight-charts.svg
[npm-link]: https://www.npmjs.com/package/lightweight-charts

[bundle-size-img]: https://badgen.net/bundlephobia/minzip/lightweight-charts
[deps-count-img]: https://img.shields.io/badge/dynamic/json.svg?label=dependecies&color=brightgreen&query=$.dependencyCount&uri=https%3A%2F%2Fbundlephobia.com%2Fapi%2Fsize%3Fpackage%3Dlightweight-charts
[bundle-size-link]: https://bundlephobia.com/result?p=lightweight-charts
