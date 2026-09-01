# Chart types

Lightweight Charts offers different types of charts to suit various data visualization needs. This article provides an overview of the available chart types and how to create them.

## Standard Time-based Chart

The standard time-based chart is the most common type, suitable for displaying time series data.

- **Creation method**: [`createChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart)
- **Horizontal scale**: Time-based
- **Use case**: General-purpose charting for financial and time series data

```js
import { createChart } from 'lightweight-charts';

const chart = createChart(document.getElementById('container'), options);
```

This chart type uses time values for the horizontal scale and is ideal for most financial and time series data visualizations.

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });

const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

areaSeries.setData(data);

chart.timeScale().fitContent();
```

## Yield Curve Chart

The yield curve chart is specifically designed for displaying yield curves, common in financial analysis.

- **Creation method**: [`createYieldCurveChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createYieldCurveChart)
- **Horizontal scale**: Linearly spaced, defined in monthly time duration units
- **Key differences**:
  - Whitespace is ignored for crosshair and grid lines
  - Specialized for yield curve representation

```js
import { createYieldCurveChart } from 'lightweight-charts';

const chart = createYieldCurveChart(document.getElementById('container'), options);
```

Use this chart type when you need to visualize yield curves or similar financial data where the horizontal scale represents time durations rather than specific dates.

:::tip

If you want to spread out the beginning of the plot further and don't need a linear time scale, you can enforce a minimum spacing around each point by increasing the [`minBarSpacing`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#minbarspacing) option in the TimeScaleOptions. To prevent the rest of the chart from spreading too wide, adjust the `baseResolution` to a larger number, such as `12` (months).

:::

```js
const chartOptions = {
    layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },
    yieldCurve: { baseResolution: 1, minimumTimeRange: 10, startTimeRange: 3 },
    handleScroll: false, handleScale: false,
};

const chart = createYieldCurveChart(document.getElementById('container'), chartOptions);
const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

const curve = [{ time: 1, value: 5.378 }, { time: 2, value: 5.372 }, { time: 3, value: 5.271 }, { time: 6, value: 5.094 }, { time: 12, value: 4.739 }, { time: 24, value: 4.237 }, { time: 36, value: 4.036 }, { time: 60, value: 3.887 }, { time: 84, value: 3.921 }, { time: 120, value: 4.007 }, { time: 240, value: 4.366 }, { time: 360, value: 4.290 }];

lineSeries.setData(curve);

chart.timeScale().fitContent();
```

## Options Chart (Price-based)

The options chart is a specialized type that uses price values on the horizontal scale instead of time.

- **Creation method**: [`createOptionsChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createOptionsChart)
- **Horizontal scale**: Price-based (numeric)
- **Use case**: Visualizing option chains, price distributions, or any data where price is the primary x-axis metric

```js
import { createOptionsChart } from 'lightweight-charts';

const chart = createOptionsChart(document.getElementById('container'), options);
```

This chart type is particularly useful for financial instruments like options, where the price is a more relevant x-axis metric than time.

```js
const chartOptions = {
    layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },
};

const chart = createOptionsChart(document.getElementById('container'), chartOptions);
const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

const data = [];
for (let i = 0; i < 1000; i++) {
    data.push({
        time: i * 0.25,
        value: Math.sin(i / 100) + i / 500,
    });
}

lineSeries.setData(data);

chart.timeScale().fitContent();
```

## Custom Horizontal Scale Chart

For advanced use cases, Lightweight Charts allows creating charts with custom horizontal scale behavior.

- **Creation method**: [`createChartEx`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChartEx)
- **Horizontal scale**: Custom-defined
- **Use case**: Specialized charting needs with non-standard horizontal scales

```js
import { createChartEx, defaultHorzScaleBehavior } from 'lightweight-charts';

const customBehavior = new (defaultHorzScaleBehavior())();
// Customize the behavior as needed

const chart = createChartEx(document.getElementById('container'), customBehavior, options);
```

This method provides the flexibility to define custom horizontal scale behavior, allowing for unique and specialized chart types.

## Choosing the Right Chart Type

- Use `createChart` for most standard time-based charting needs.
- Choose `createYieldCurveChart` when working specifically with yield curves or similar financial data.
- Opt for `createOptionsChart` when you need to visualize data with price as the primary horizontal axis, such as option chains.
- Use `createChartEx` when you need a custom horizontal scale behavior that differs from the standard time-based or price-based scales.

Each chart type provides specific functionality and is optimized for different use cases. Consider your data structure and visualization requirements when selecting the appropriate chart type for your application.

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
