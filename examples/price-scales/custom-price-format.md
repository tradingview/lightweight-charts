# Custom price format

```js
// Prices in US dollars, shortened: 1250000000 becomes $1.25B.
const currencyFormat = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	maximumFractionDigits: 2,
});

const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
	},
	localization: {
		priceFormatter: price => currencyFormat.format(price),
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

// Sample data: a seeded random walk around 1.2 billion, so the chart looks the
// same on every load.
function generateValues(count = 120) {
	let seed = 17;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let value = 1.2e9;
	const points = [];
	for (let i = 0; i < count; i++) {
		value *= 1 + (random() - 0.48) * 0.03;
		points.push({ time, value });
		time += day;
	}
	return points;
}
```

## How it works

The chart turns each price into text with a function you give it. Here the function shortens large values to dollar amounts such as $1.25B.

1. [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) with `notation: 'compact'` does the formatting. It is created once and reused for every label.
2. [`localization.priceFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions#priceformatter) gives the chart the function. The price scale labels, the crosshair label, and the last value label all use it.

These lines are highlighted in the code.

## Tips

- To change only the number of decimals, set [`priceFormat`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon#priceformat) on the series instead, with `precision` and `minMove`.
- To format the prices of one series only, use `priceFormat` with `type: 'custom'` and a `formatter` function on that series.

## Resources

- [`LocalizationOptions.priceFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions#priceformatter)
- [`PriceFormatCustom`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceFormatCustom)
- Related examples: [Custom locale](https://tradingview.github.io/lightweight-charts/examples/styling/custom-locale.md), [Price scale modes](https://tradingview.github.io/lightweight-charts/examples/price-scales/price-scale-modes.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
