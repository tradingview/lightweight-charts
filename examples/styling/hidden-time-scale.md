# Hidden time scale

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	timeScale: {
		visible: false,
	},
});

const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

const data = [
	{ value: 0, time: 1642425322 },
	{ value: 8, time: 1642511722 },
	{ value: 10, time: 1642598122 },
	{ value: 20, time: 1642684522 },
	{ value: 3, time: 1642770922 },
	{ value: 43, time: 1642857322 },
	{ value: 41, time: 1642943722 },
	{ value: 43, time: 1643030122 },
	{ value: 56, time: 1643116522 },
	{ value: 46, time: 1643202922 },
];

lineSeries.setData(data);

chart.timeScale().fitContent();
```

## How it works

The time scale is the axis with dates under the chart. Hiding it gives the series that space, which suits sparklines and charts stacked under each other.

Set [`visible: false`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HorzScaleOptions#visible) in the time scale options. The example passes it to [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#applyoptions); the call is highlighted in the code.

## Tips

- The chart can still be scrolled and zoomed with the time scale hidden.
- To hide the price scale as well, set `rightPriceScale: { visible: false }`.

## Resources

- [Time scale](https://tradingview.github.io/lightweight-charts/docs/time-scale.md)
- [`HorzScaleOptions.visible`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HorzScaleOptions#visible)
- Related examples: [Sync crosshairs between two charts](https://tradingview.github.io/lightweight-charts/examples/crosshair/sync-crosshairs.md), [Inverted price scale](https://tradingview.github.io/lightweight-charts/examples/price-scales/inverted-price-scale.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
