# Moving average indicator

This example demonstrates the implementation of a moving average (MA) indicator
using Lightweight Charts™. It effectively shows how to overlay a line series
representing the moving average on a candlestick series.

Initial rendering involves the creation of a candlestick series using randomly
generated data. The `calculateMovingAverageSeriesData` function subsequently
computes the 20-period MA data from the candlestick data. For each point, if
less than 20 data points precede it, the function creates a whitespace data
point. If 20 or more data points precede it, it calculates the MA for that
period.

The MA data set forms a line series, which is placed underneath the candlestick
series (by creating the line series first). As a result, users can view the
underlying price data (via the candlestick series) in conjunction with the
moving average trend line which provides valuable analytical insight.

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

const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

const barData = generateCandleData(500);

function calculateMovingAverageSeriesData(candleData, maLength) {
	const maData = [];

	for (let i = 0; i < candleData.length; i++) {
		if (i < maLength) {
			// Provide whitespace data points until the MA can be calculated
			maData.push({ time: candleData[i].time });
		} else {
			// Calculate the moving average, slow but simple way
			let sum = 0;
			for (let j = 0; j < maLength; j++) {
				sum += candleData[i - j].close;
			}
			const maValue = sum / maLength;
			maData.push({ time: candleData[i].time, value: maValue });
		}
	}

	return maData;
}

const maData = calculateMovingAverageSeriesData(barData, 20);

const maSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1 });
maSeries.setData(maData);

const candlestickSeries = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});
candlestickSeries.setData(barData);
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
