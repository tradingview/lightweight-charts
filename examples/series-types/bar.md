# Bar series

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

const series = chart.addSeries(BarSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
});
series.setData(generateCandles());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateCandles(count = 120) {
	let seed = 3;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let close = 100;
	const candles = [];
	for (let i = 0; i < count; i++) {
		const open = close;
		close = open + (random() - 0.5) * 6;
		const high = Math.max(open, close) + random() * 2.5;
		const low = Math.min(open, close) - random() * 2.5;
		candles.push({ time, open, high, low, close });
		time += day;
	}
	return candles;
}
```

## How it works

A bar series draws each period as a vertical line from the low to the high, with a tick for the open on the left and for the close on the right.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `BarSeries` adds the series. The options set the colors for rising and falling bars.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time`, `open`, `high`, `low`, and `close`, the same as for candlesticks.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateCandles` only makes sample data. Replace it with your own.

## Tips

- `openVisible: false` hides the open tick, for a high-low-close chart.
- `thinBars: false` draws thicker bars when they have room.

## Resources

- [Series types: Bar](https://tradingview.github.io/lightweight-charts/docs/series-types.md#bar)
- [`BarStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarStyleOptions)
- Related examples: [Candlestick series](https://tradingview.github.io/lightweight-charts/examples/series-types/candlestick.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
