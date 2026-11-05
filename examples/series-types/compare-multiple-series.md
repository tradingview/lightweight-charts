# Compare multiple series

```js
let randomFactor = 25 + Math.random() * 25;
const samplePoint = i =>
	i *
		(0.5 +
			Math.sin(i / 10) * 0.2 +
			Math.sin(i / 20) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 500) * 0.5) +
	200;

function generateLineData(numberOfPoints = 500) {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = (date.getTime() / 1000);
		const value = samplePoint(i);
		res.push({
			time,
			value,
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}
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

const lineSeriesOne = chart.addSeries(LineSeries, { color: '#2962FF' });

const lineSeriesTwo = chart.addSeries(LineSeries, { color: 'rgb(225, 87, 90)' });

const lineSeriesThree = chart.addSeries(LineSeries, { color: 'rgb(242, 142, 44)' });

const lineSeriesOneData = generateLineData();
const lineSeriesTwoData = generateLineData();
const lineSeriesThreeData = generateLineData();

lineSeriesOne.setData(lineSeriesOneData);
lineSeriesTwo.setData(lineSeriesTwoData);
lineSeriesThree.setData(lineSeriesThreeData);

chart.timeScale().fitContent();
```

## How it works

A chart can hold any number of series. Here three line series share the right price scale, so their values compare directly.

1. [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries) is called once per series, each with its own color.
2. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) gives each series its data.

## Tips

- When the series have very different value ranges, give each its own scale. See [Two price scales](https://tradingview.github.io/lightweight-charts/examples/price-scales/two-price-scales.md).

## Resources

- [Series types](https://tradingview.github.io/lightweight-charts/docs/series-types.md)
- [`IChartApi.addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries)
- Related examples: [Line series](https://tradingview.github.io/lightweight-charts/examples/series-types/line.md), [Two price scales](https://tradingview.github.io/lightweight-charts/examples/price-scales/two-price-scales.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
