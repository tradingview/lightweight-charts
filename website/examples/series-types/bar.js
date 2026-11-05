// remove-start
// Lightweight Charts™ Example: Bar series
// https://tradingview.github.io/lightweight-charts/examples/series-types/bar

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

const series = chart.addSeries(BarSeries, {
	upColor: BAR_UP_COLOR,
	downColor: BAR_DOWN_COLOR,
});
series.setData(generateCandles());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateCandles(count = 120) {
	let seed = 3;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let close = 100;
	const candles = [];
	for (let i = 0; i < count; i++) {
		const open = close;
		close = open + (random() - 0.5) * 6;
		const high = Math.max(open, close) + random() * 2.5;
		const low = Math.min(open, close) - random() * 2.5;
		candles.push({ time, open, high, low, close });
		time += day;
	}
	return candles;
}
