# Click to add markers

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
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});
const data = generateBars();
series.setData(data);
chart.timeScale().fitContent();

// The times of the marked bars. Two are marked from the start.
const markedTimes = new Set([data[40].time, data[75].time]);
const markers = createSeriesMarkers(series);

function updateMarkers() {
	// Markers must be sorted by time.
	const times = [...markedTimes].sort((a, b) => a - b);
	markers.setMarkers(times.map(time => ({
		time,
		position: 'aboveBar',
		color: '#2962FF',
		shape: 'arrowDown',
	})));
}
updateMarkers();

chart.subscribeClick(param => {
	// `time` is undefined for a click outside the data, such as on empty space.
	if (param.time === undefined) {
		return;
	}
	// A second click on a marked bar removes its marker.
	if (markedTimes.has(param.time)) {
		markedTimes.delete(param.time);
	} else {
		markedTimes.add(param.time);
	}
	updateMarkers();
});

// Sample data: daily bars, a seeded random walk, so the chart looks the same
// on every load.
function generateBars(count = 100) {
	let seed = 13;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const bars = [];
	let time = Date.UTC(2024, 0, 1) / 1000;
	let close = 100;
	for (let i = 0; i < count; i++) {
		const open = close;
		close = open + (random() - 0.48) * 4;
		const high = Math.max(open, close) + random() * 2;
		const low = Math.min(open, close) - random() * 2;
		bars.push({ time, open, high, low, close });
		time += 24 * 60 * 60;
	}
	return bars;
}
```

## How it works

The chart reports every click with the time of the bar under the cursor. Here a click on a bar adds a marker to it, and a second click removes it.

1. [`subscribeClick`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribeclick) calls the handler on each click. Its [`MouseEventParams`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams) carry the `time` of the bar under the cursor.
2. The handler adds the time to a set of marked times, or removes it when the bar is marked already.
3. `updateMarkers` turns the set into markers and passes them to `setMarkers` of the [`createSeriesMarkers`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createSeriesMarkers) plugin.

The click handler is highlighted in the code. `generateBars` only makes sample data. Replace it with your own.

## Tips

- The same parameters have `point`, the click position in pixels, and `seriesData`, the values of every series at that time. Use them to show the details of the clicked bar.
- To tell the price at the click position, pass `param.point.y` to the series' [`coordinateToPrice`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#coordinatetoprice).
- [`subscribeDblClick`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribedblclick) works the same way for double clicks.

## Resources

- [`IChartApi.subscribeClick`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribeclick)
- [`MouseEventParams`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams)
- Related examples: [Series markers](https://tradingview.github.io/lightweight-charts/examples/markers-and-lines/series-markers.md), [Floating tooltip](https://tradingview.github.io/lightweight-charts/examples/tooltips-and-legends/floating-tooltip.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
