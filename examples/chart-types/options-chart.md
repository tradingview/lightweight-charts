# Options chart

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
const chart = createOptionsChart(document.getElementById('container'), chartOptions);

// Profit below zero is drawn in red, above zero in green.
const series = chart.addSeries(BaselineSeries, {
	baseValue: { type: 'price', price: 0 },
	topLineColor: 'rgba( 38, 166, 154, 1)',
	topFillColor1: 'rgba( 38, 166, 154, 0.28)',
	topFillColor2: 'rgba( 38, 166, 154, 0.05)',
	bottomLineColor: 'rgba( 239, 83, 80, 1)',
	bottomFillColor1: 'rgba( 239, 83, 80, 0.05)',
	bottomFillColor2: 'rgba( 239, 83, 80, 0.28)',
});
series.setData(straddlePayoff({ strike: 100, premium: 8 }));

chart.timeScale().fitContent();

// Sample data: the profit of a long straddle at expiry, one point per
// underlying price. On an options chart, `time` holds that price.
function straddlePayoff({ strike, premium }) {
	const points = [];
	for (let price = 70; price <= 130; price += 0.5) {
		points.push({ time: price, value: Math.abs(price - strike) - premium });
	}
	return points;
}
```

## How it works

An options chart has prices on the horizontal scale instead of dates. The chart here shows the profit of a long straddle: a call and a put at the same strike, bought for a premium of 8 in total.

1. [`createOptionsChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createOptionsChart) creates the chart. It takes the same options as `createChart`.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives the series its points. On this chart, `time` holds a price, a plain number.
3. A [baseline series](https://tradingview.github.io/lightweight-charts/docs/series-types.md#baseline) with `baseValue` at `0` draws the profit in green and the loss in red.

`straddlePayoff` only makes sample data. Replace it with your own.

## Tips

- [`localization.precision`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceChartLocalizationOptions#precision) sets the number of decimals in the labels of the horizontal scale.
- For a horizontal scale that is neither time nor price, see [Custom horizontal scale](https://tradingview.github.io/lightweight-charts/examples/chart-types/custom-horizontal-scale.md).

## Resources

- [Chart types: Options chart](https://tradingview.github.io/lightweight-charts/docs/chart-types.md#options-chart-price-based)
- [`createOptionsChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createOptionsChart)
- Related examples: [Yield curve with updates](https://tradingview.github.io/lightweight-charts/examples/chart-types/yield-curve-with-update-markers.md), [Baseline series](https://tradingview.github.io/lightweight-charts/examples/series-types/baseline.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
