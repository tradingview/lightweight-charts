# Yield curve chart with update markers

```js
const curve1 = [
	{ time: 1, value: 5.378 },
	{ time: 2, value: 5.372 },
	{ time: 3, value: 5.271 },
	{ time: 6, value: 5.094 },
	{ time: 12, value: 4.739 },
	{ time: 24, value: 4.237 },
	{ time: 36, value: 4.036 },
	{ time: 60, value: 3.887 },
	{ time: 84, value: 3.921 },
	{ time: 120, value: 4.007 },
	{ time: 240, value: 4.366 },
	{ time: 360, value: 4.29 },
];
const curve2 = [
	{ time: 1, value: 5.381 },
	{ time: 2, value: 5.393 },
	{ time: 3, value: 5.425 },
	{ time: 6, value: 5.494 },
	{ time: 12, value: 5.377 },
	{ time: 24, value: 4.883 },
	{ time: 36, value: 4.554 },
	{ time: 60, value: 4.241 },
	{ time: 84, value: 4.172 },
	{ time: 120, value: 4.084 },
	{ time: 240, value: 4.365 },
	{ time: 360, value: 4.176 },
];

const chartOptions = {
	autoSize: true,
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	yieldCurve: {
		baseResolution: 12,
		minimumTimeRange: 10,
		startTimeRange: 3,
	},
	handleScroll: false,
	handleScale: false,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	timeScale: {
		minBarSpacing: 3,
	},
};

const container = document.getElementById('container');
const chart = createYieldCurveChart(container, chartOptions);

const series1 = chart.addSeries(LineSeries, {
	lineType: 2,
	color: '#26c6da',
	pointMarkersVisible: true,
	lineWidth: 2,
});
const priceChangeMarkers = createUpDownMarkers(series1);
priceChangeMarkers.setData(curve1);

const series2 = chart.addSeries(LineSeries, {
	lineType: 2,
	color: 'rgb(164, 89, 209)',
	pointMarkersVisible: true,
	lineWidth: 1,
});
series2.setData(curve2);

chart.timeScale().fitContent();

chart.timeScale().subscribeSizeChange(() => {
	chart.timeScale().fitContent();
});

setInterval(() => {
	curve1
		.filter(() => Math.random() < 0.1)
		.forEach(data => {
			const shift = (Math.random() > 0.5 ? -1 : 1) * Math.random() * 0.01 * data.value;
			priceChangeMarkers.update(
				{
					...data,
					value: data.value + shift,
				},
				true
			);
		});
}, 5000);
```

## How it works

A [yield curve chart](https://tradingview.github.io/lightweight-charts/docs/chart-types.md#yield-curve-chart) has durations, in months, on the horizontal scale instead of dates. This one shows two curves and marks each change to the first one.

1. [`createYieldCurveChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createYieldCurveChart) creates the chart.
2. Two line series are added with `lineType: 2` for curved lines and `pointMarkersVisible: true` to mark each point.
3. [`createUpDownMarkers`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createUpDownMarkers) is attached to the first series. Its `setData` sets the initial curve.
4. Every five seconds a few points of the first curve change. The markers' `update` applies each change and shows an up or down marker on the point.

## Tips

- Pass the data through the markers' `setData` and `update`, not through the series directly. Otherwise the markers cannot tell what changed.

## Resources

- [Chart types: Yield curve chart](https://tradingview.github.io/lightweight-charts/docs/chart-types.md#yield-curve-chart)
- [`createYieldCurveChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createYieldCurveChart)
- [`createUpDownMarkers`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createUpDownMarkers)
- Related examples: [Realtime updates](https://tradingview.github.io/lightweight-charts/examples/data/realtime-updates.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
