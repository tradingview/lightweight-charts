# Yield Curve Chart with Update Markers

This sample demonstrates how to create a yield curve chart with real-time
updates using Lightweight Charts™. The chart displays two
[yield curves](https://tradingview.github.io/lightweight-charts/docs/next/chart-types#yield-curve-chart) and utilizes the
[UpDownMarkersPrimitive](https://tradingview.github.io/lightweight-charts/docs/next/api/functions/createUpDownMarkers) plugin
to show price change markers for updates.

The chart is initialized with historical yield curve data for two series. By
using the `setInterval` function, we simulate real-time updates to the first
curve. These updates are applied using the `update` method provided by the
UpDownMarkersPrimitive, which automatically handles the creation and display of
markers for price changes.

Key features of this demo:

1. Yield curve chart configuration with custom time range settings.
2. Two line series representing different yield curves.
3. Usage of the UpDownMarkersPrimitive plugin for displaying update markers.
4. Simulated real-time updates to demonstrate dynamic data handling.

The UpDownMarkersPrimitive is attached to the first series when created using
`priceChangeMarkers = createUpDownMarkers(series1)`. We then use
`priceChangeMarkers.setData(curve1)` to initialize the data and
`priceChangeMarkers.update(...)` for subsequent updates. This approach allows
the primitive to manage both the series data and the markers, providing a
seamless way to visualize price changes.

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

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
