# Valid Sample Plugin

A valid sample plugin used for testing repository scripts and verification gates.

## Installation

### npm

Install the package into your project:

```shell
npm install @tradingview/lwc-plugin-valid-sample
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { ValidSamplePlugin } from '@tradingview/lwc-plugin-valid-sample';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.attachPrimitive(new ValidSamplePlugin());
```

## Usage

The plugin has no options; attach it to any series:

```js
series.attachPrimitive(new ValidSamplePlugin());
```
