# Compare multiple series

This Multi-Series Comparison Example illustrates how an assortment of data
series can be integrated into a single chart for comparisons. Simply use the
charting API `addSeries` to create multiple series.

If you would like an unique price scales for each individual series,
particularly when dealing with data series with divergent value ranges, then
take a look at the [Two Price Scales Example](https://tradingview.github.io/lightweight-charts/tutorials/how_to/two-price-scales.md).

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

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
