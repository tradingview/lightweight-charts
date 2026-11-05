# Line series

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

const series = chart.addSeries(LineSeries, {
	color: '#2962FF',
	lineWidth: 2,
});
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateValues(count = 120) {
	let seed = 11;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let value = 100;
	const points = [];
	for (let i = 0; i < count; i++) {
		value += (random() - 0.48) * 4;
		points.push({ time, value });
		time += day;
	}
	return points;
}
```

## How it works

A line series joins one value per point with a line.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `LineSeries` adds the series to the chart. The options set the line's color and width.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time` and a `value`.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateValues` only makes sample data. Replace it with your own.

## Tips

- Set `lineType` to draw [steps or curves](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/LineType) instead of straight segments, and `lineStyle` for a [dashed or dotted](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/LineStyle) line.
- To update the last point or add a new one as data arrives, use [`update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#update) instead of calling `setData` again.

## Resources

- [Series types: Line](https://tradingview.github.io/lightweight-charts/docs/series-types.md#line)
- [`LineStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions)
- Related examples: [Area series](https://tradingview.github.io/lightweight-charts/examples/series-types/area.md), [Compare multiple series](https://tradingview.github.io/lightweight-charts/examples/series-types/compare-multiple-series.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
