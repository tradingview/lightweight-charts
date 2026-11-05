# Candlestick series

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

const series = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	borderVisible: false,
});
series.setData(generateCandles());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateCandles(count = 120) {
	let seed = 7;
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

A candlestick series draws each period as a body between the open and the close, with wicks out to the high and the low.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) with `CandlestickSeries` adds the series. The options set the colors for rising and falling candles, for both bodies and wicks.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives it the data. Each item has a `time`, `open`, `high`, `low`, and `close`.
3. [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent) fits all the data into view.

`generateCandles` only makes sample data. Replace it with your own.

## Tips

- A data item can set its own `color`, `borderColor`, and `wickColor` to highlight a single candle.
- `borderVisible: false` drops the outline, so the body is filled with one color.
- For candles with rounded bodies, use the [Rounded candles series](https://tradingview.github.io/lightweight-charts/plugins/rounded-candles-series) plugin. It takes the same data and colors as the built-in series, so you can swap one for the other.

## Resources

- [Series types: Candlestick](https://tradingview.github.io/lightweight-charts/docs/series-types.md#candlestick)
- [`CandlestickStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickStyleOptions)
- Related examples: [Bar series](https://tradingview.github.io/lightweight-charts/examples/series-types/bar.md), [Series markers](https://tradingview.github.io/lightweight-charts/examples/markers-and-lines/series-markers.md)
- Plugin: [Rounded candles series](https://tradingview.github.io/lightweight-charts/plugins/rounded-candles-series)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
