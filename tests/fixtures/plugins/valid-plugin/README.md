# Valid Sample Plugin

A valid sample plugin used for testing repository scripts and verification gates.

## Installation

### npm

Install the package into your project:

```shell
npm install @bishopbot/lwc-plugin-valid-sample
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from '@bishopbot/lightweight-charts';
import { ValidSamplePlugin } from '@bishopbot/lwc-plugin-valid-sample';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.attachPrimitive(new ValidSamplePlugin());
```

### CDN

Map the library and the plugin to their CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "@bishopbot/lightweight-charts": "https://unpkg.com/@bishopbot/lightweight-charts@^6/dist/lightweight-charts.standalone.production.mjs",
    "@bishopbot/lwc-plugin-valid-sample": "https://unpkg.com/@bishopbot/lwc-plugin-valid-sample/dist/valid-sample.standalone.js"
  }
}
</script>
```

## Usage

The plugin has no options; attach it to any series:

```js
series.attachPrimitive(new ValidSamplePlugin());
```
