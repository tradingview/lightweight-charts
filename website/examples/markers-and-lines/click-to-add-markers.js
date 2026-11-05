// remove-start
// Lightweight Charts™ Example: Click to add markers
// https://tradingview.github.io/lightweight-charts/examples/markers-and-lines/click-to-add-markers

// remove-end
const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
	grid: {
		vertLines: { color: CHART_GRID_COLOR },
		horzLines: { color: CHART_GRID_COLOR },
	},
};
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(document.getElementById('container'), chartOptions);

const series = chart.addSeries(CandlestickSeries, {
	upColor: BAR_UP_COLOR,
	downColor: BAR_DOWN_COLOR,
	borderVisible: false,
	wickUpColor: BAR_UP_COLOR,
	wickDownColor: BAR_DOWN_COLOR,
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
		color: LINE_LINE_COLOR,
		shape: 'arrowDown',
	})));
}
updateMarkers();

// highlight-start
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
// highlight-end

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
