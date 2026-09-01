# Infinite history

This sample showcases the capability of Lightweight Charts™ to manage and display
an ever-expanding dataset, resembling a live feed that loads older data when the
user scrolls back in time. The example depicts a chart that initially loads a
limited amount of data, but later fetches additional data as required.

Key to this functionality is the
[`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange)
method. This function is triggered when the visible data range changes, in this
case, when the user scrolls beyond the initially loaded data.

By checking if the amount of unseen data on the left of the screen falls below a
certain threshold (in this example, 10 units), it's determined whether
additional data needs to be loaded. New data is appended through a simulated
delay using `setTimeout`.

This kind of infinite history functionality is typical of financial charts which
frequently handle large and continuously expanding datasets.

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

function generateLineData(numberOfPoints = 500, endDate) {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = endDate || new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	date.setUTCDate(date.getUTCDate() - numberOfPoints - 1);
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = date.getTime() / 1000;
		const value = samplePoint(i);
		res.push({
			time,
			value,
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function randomBar(lastClose) {
	const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	const high = +randomNumber(
		Math.max(open, close),
		Math.max(open, close) * 1.1
	).toFixed(2);
	const low = +randomNumber(
		Math.min(open, close) * 0.9,
		Math.min(open, close)
	).toFixed(2);
	return {
		open,
		high,
		low,
		close,
	};
}

function generateCandleData(numberOfPoints = 250, endDate) {
	const lineData = generateLineData(numberOfPoints, endDate);
	let lastClose = lineData[0].value;
	return lineData.map(d => {
		const candle = randomBar(lastClose);
		lastClose = candle.close;
		return {
			time: d.time,
			low: candle.low,
			high: candle.high,
			open: candle.open,
			close: candle.close,
		};
	});
}

class Datafeed {
	constructor() {
		this._earliestDate = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
		this._data = [];
	}

	getBars(numberOfExtraBars) {
		const historicalData = generateCandleData(
			numberOfExtraBars,
			this._earliestDate
		);
		this._data = [...historicalData, ...this._data];
		this._earliestDate = new Date(historicalData[0].time * 1000);
		return this._data;
	}
}

const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const container = document.getElementById('container');
const chart = createChart(container, chartOptions);

const series = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});

const datafeed = new Datafeed();

series.setData(datafeed.getBars(200));

chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
	if (logicalRange.from < 10) {
		// load more data
		const numberBarsToLoad = 50 - logicalRange.from;
		const data = datafeed.getBars(numberBarsToLoad);
		setTimeout(() => {
			series.setData(data);
		}, 250); // add a loading delay
	}
});
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
