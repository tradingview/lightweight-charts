# Realtime updates

```js
let randomFactor = 25 + Math.random() * 25;
const samplePoint = i =>
	i *
		(0.5 +
			Math.sin(i / 1) * 0.2 +
			Math.sin(i / 2) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 50) * 0.5) +
	200 +
	i * 2;

function generateData(
	numberOfCandles = 500,
	updatesPerCandle = 5,
	startAt = 100
) {
	const createCandle = (val, time) => ({
		time,
		open: val,
		high: val,
		low: val,
		close: val,
	});

	const updateCandle = (candle, val) => ({
		time: candle.time,
		close: val,
		open: candle.open,
		low: Math.min(candle.low, val),
		high: Math.max(candle.high, val),
	});

	randomFactor = 25 + Math.random() * 25;
	const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	const numberOfPoints = numberOfCandles * updatesPerCandle;
	const initialData = [];
	const realtimeUpdates = [];
	let lastCandle;
	let previousValue = samplePoint(-1);
	for (let i = 0; i < numberOfPoints; ++i) {
		if (i % updatesPerCandle === 0) {
			date.setUTCDate(date.getUTCDate() + 1);
		}
		const time = date.getTime() / 1000;
		let value = samplePoint(i);
		const diff = (value - previousValue) * Math.random();
		value = previousValue + diff;
		previousValue = value;
		if (i % updatesPerCandle === 0) {
			const candle = createCandle(value, time);
			lastCandle = candle;
			if (i >= startAt) {
				realtimeUpdates.push(candle);
			}
		} else {
			const newCandle = updateCandle(lastCandle, value);
			lastCandle = newCandle;
			if (i >= startAt) {
				realtimeUpdates.push(newCandle);
			} else if ((i + 1) % updatesPerCandle === 0) {
				initialData.push(newCandle);
			}
		}
	}

	return {
		initialData,
		realtimeUpdates,
	};
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
	// Fill the element the chart is created in, whatever its size.
	autoSize: true,
};
const container = document.getElementById('container');
// The chart takes the space above the buttons, which are added further down.
container.style.display = 'flex';
container.style.flexDirection = 'column';
const chartElement = document.createElement('div');
chartElement.style.flex = '1';
chartElement.style.minHeight = '0';
container.appendChild(chartElement);
const chart = createChart(chartElement, chartOptions);

const series = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});

const data = generateData(2500, 20, 1000);

series.setData(data.initialData);
chart.timeScale().fitContent();
chart.timeScale().scrollToPosition(5);

// simulate real-time data
function* getNextRealtimeUpdate(realtimeData) {
	for (const dataPoint of realtimeData) {
		yield dataPoint;
	}
	return null;
}
const streamingDataProvider = getNextRealtimeUpdate(data.realtimeUpdates);

const intervalID = setInterval(() => {
	const update = streamingDataProvider.next();
	if (update.done) {
		clearInterval(intervalID);
		return;
	}
	series.update(update.value);
}, 100);

const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        gap: 8px;
        padding: 8px;
        background-color: ${'white'};
    }
    .buttons-container button {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,
            sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 510;
        line-height: 24px; /* 150% */
        letter-spacing: -0.32px;
        padding: 8px 24px;
        color: ${'rgba(19, 23, 34, 1)'};
        background-color: ${'rgba(240, 243, 250, 1)'};
        border-radius: 8px;
        cursor: pointer;
    }

    .buttons-container button:hover {
        background-color: ${'rgba(224, 227, 235, 1)'};
    }

    .buttons-container button:active {
        background-color: ${'rgba(209, 212, 220, 1)'};
    }
`;

const stylesElement = document.createElement('style');
stylesElement.innerHTML = styles;
container.appendChild(stylesElement);

const buttonsContainer = document.createElement('div');
buttonsContainer.classList.add('buttons-container');
const button = document.createElement('button');
button.innerText = 'Go to realtime';
button.addEventListener('click', () => chart.timeScale().scrollToRealTime());
buttonsContainer.appendChild(button);

container.appendChild(buttonsContainer);
```

## How it works

The chart starts with historical candles and then receives a new price every 100 ms, as from a live feed.

1. [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) sets the initial candles.
2. A timer passes each new price to [`update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#update). An item with the time of the last candle changes that candle; an item with a later time adds a new one.
3. The **Go to realtime** button calls [`scrollToRealTime`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#scrolltorealtime), which brings the latest candle back into view after you scroll away.

`generateData` only makes sample data. In your project the updates come from your data source.

## Tips

- Use `update` for live data. Calling `setData` on every tick redraws the whole series and resets the user's scroll.

## Resources

- [`ISeriesApi.update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#update)
- [`ITimeScaleApi.scrollToRealTime`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#scrolltorealtime)
- Related examples: [Infinite history](https://tradingview.github.io/lightweight-charts/examples/data/infinite-history.md), [Yield curve with updates](https://tradingview.github.io/lightweight-charts/examples/chart-types/yield-curve-with-update-markers.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
