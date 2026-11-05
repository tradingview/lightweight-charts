# Area series

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

const series = chart.addSeries(AreaSeries, {
	lineColor: '#2962FF',
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineWidth: 2,
});
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateValues(count = 120) {
	let seed = 29;
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

An area series is a line with the space below it filled.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `AreaSeries` adds the series. `lineColor` and `lineWidth` set the line; the fill is a gradient from `topColor` to `bottomColor`.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time` and a `value`.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateValues` only makes sample data. Replace it with your own.

## Tips

- Set the same color with a lower opacity as both `topColor` and `bottomColor` for a flat fill instead of a gradient.
- `invertFilledArea: true` fills the space above the line instead of below it.

## Resources

- [Series types: Area](https://tradingview.github.io/lightweight-charts/docs/series-types.md#area)
- [`AreaStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AreaStyleOptions)
- Related examples: [Line series](https://tradingview.github.io/lightweight-charts/examples/series-types/line.md), [Baseline series](https://tradingview.github.io/lightweight-charts/examples/series-types/baseline.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
