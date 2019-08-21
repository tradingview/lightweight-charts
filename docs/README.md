# Getting started

## Installation

The first thing you need to do to use `lightweight-charts` is to install it from [npm](https://www.npmjs.com/):

`npm install --save lightweight-charts`

### Using a standalone version

The npm package is shipped with [a standalone version](https://unpkg.com/lightweight-charts@latest/dist/lightweight-charts.standalone.production.js).
It puts all exports from `esm` version to `window.LightweightCharts` object and can be used, for example, in [JSFiddle](https://jsfiddle.net/) or in similar services.

## Create your first chart

### In modules environment

_Note: the package is shipped with TypeScript declarations, so `lightweight-charts` can be easily used in TypeScript code._

After installing the package just add the following code to your JavaScript file:

```javascript
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

### In non-modules environment

1. You need to be sure that a standalone version has been added to the page where you want to use `lightweight-charts`.

    Simply add a `script` tag to your page:

    ```html
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    ```

1. Add the following code to the web page (for example, add it to a `script` tag in the HTML code of the page):

    ```javascript
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

    [JSFiddle](https://jsfiddle.net/TradingView/gemn0ud6/)

That's it! Your first chart is ready and we can now proceed.

## What's next

- [Series basics](./series-basics.md)
- [Customization](./customization.md)
- [Time Scale](./time-scale.md)
