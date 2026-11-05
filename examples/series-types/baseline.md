# Baseline series

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

const series = chart.addSeries(BaselineSeries, {
	// Values above the base price are drawn in the top colors, values below it in the bottom ones.
	baseValue: { type: 'price', price: 100 },
	topLineColor: 'rgba( 38, 166, 154, 1)',
	topFillColor1: 'rgba( 38, 166, 154, 0.28)',
	topFillColor2: 'rgba( 38, 166, 154, 0.05)',
	bottomLineColor: 'rgba( 239, 83, 80, 1)',
	bottomFillColor1: 'rgba( 239, 83, 80, 0.05)',
	bottomFillColor2: 'rgba( 239, 83, 80, 0.28)',
});
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: a seeded wave around 100, so the values cross the base price.
function generateValues(count = 120) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	const points = [];
	for (let i = 0; i < count; i++) {
		const value = 100 + Math.sin(i / 6) * 6 + (random() - 0.5) * 3;
		points.push({ time, value });
		time += day;
	}
	return points;
}
```

## How it works

A baseline series draws the values above a base price in one set of colors and the values below it in another. It suits profit and loss, or a change against a reference.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `BaselineSeries` adds the series. `baseValue` sets the base price; the `top*` options color the line and fill above it, and the `bottom*` options below it.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time` and a `value`.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateValues` only makes sample data that crosses the base price. Replace it with your own.

## Tips

- `baseValue` can be changed later with [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#applyoptions), for example to compare against the first visible value.

## Resources

- [Series types: Baseline](https://tradingview.github.io/lightweight-charts/docs/series-types.md#baseline)
- [`BaselineStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaselineStyleOptions)
- Related examples: [Area series](https://tradingview.github.io/lightweight-charts/examples/series-types/area.md), [Line series](https://tradingview.github.io/lightweight-charts/examples/series-types/line.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
