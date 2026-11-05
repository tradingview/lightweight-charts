# Histogram series

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

const series = chart.addSeries(HistogramSeries, {
	color: '#26a69a',
	priceFormat: { type: 'volume' },
});
series.setData(generateVolumes());

chart.timeScale().fitContent();

// Sample data: seeded random volumes, colored by whether the price went up or down.
function generateVolumes(count = 120) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	const bars = [];
	for (let i = 0; i < count; i++) {
		const rising = random() > 0.48;
		bars.push({
			time,
			value: Math.round(500000 + random() * 1500000),
			color: rising ? '#26a69a' : '#ef5350',
		});
		time += day;
	}
	return bars;
}
```

## How it works

A histogram series draws one column per point, from a base value up to the point's value.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `HistogramSeries` adds the series. `priceFormat: { type: 'volume' }` shortens large numbers on the price scale, as in `1.4M`.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time` and a `value`, and here also its own `color`, so rising and falling periods differ.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateVolumes` only makes sample data. Replace it with your own.

## Tips

- `base` sets the value the columns start from. It is `0` by default.
- To draw volume under a price series on the same chart, see [Price and volume](https://tradingview.github.io/lightweight-charts/examples/price-scales/price-and-volume.md).
- For a softer look, use the [Pretty histogram series](https://tradingview.github.io/lightweight-charts/plugins/pretty-histogram-series) plugin. It rounds the corners of the columns, sets their width, and can color them by sign or fade them into a second color.

## Resources

- [Series types: Histogram](https://tradingview.github.io/lightweight-charts/docs/series-types.md#histogram)
- [`HistogramStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HistogramStyleOptions)
- Related examples: [Price and volume](https://tradingview.github.io/lightweight-charts/examples/price-scales/price-and-volume.md)
- Plugin: [Pretty histogram series](https://tradingview.github.io/lightweight-charts/plugins/pretty-histogram-series)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
