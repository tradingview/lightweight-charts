# Infinite history

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
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
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

// Estimate how many bars fit in the visible area and load 20% extra bars to allow scrolling
const timeScale = chart.timeScale();
const visibleBars = Math.ceil(timeScale.width() / timeScale.options().barSpacing);
series.setData(datafeed.getBars(visibleBars + (visibleBars * 0.2)));

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

## How it works

The chart starts with only enough data to fill the screen and loads older data as you scroll back, the way a chart backed by a server would.

1. The number of bars that fit on screen is the time scale's [`width`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#width) divided by its `barSpacing`. The chart loads that many bars plus 20%. See [Number of visible bars](https://tradingview.github.io/lightweight-charts/docs/time-scale.md#number-of-visible-bars).
2. [`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange) reports each scroll. When fewer than 10 bars are left to the left of the screen, the handler asks the data feed for more.
3. The data feed returns the older bars together with the ones already loaded, and [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) replaces the series data. A short delay stands in for a network request.

`Datafeed` only makes sample data. Replace `getBars` with a request to your server.

## Resources

- [Time scale: Number of visible bars](https://tradingview.github.io/lightweight-charts/docs/time-scale.md#number-of-visible-bars)
- [`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange)
- Related examples: [Realtime updates](https://tradingview.github.io/lightweight-charts/examples/data/realtime-updates.md), [Range switcher](https://tradingview.github.io/lightweight-charts/examples/data/range-switcher.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
