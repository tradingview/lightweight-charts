// remove-start
// Lightweight Charts™ Example: Area series
// https://tradingview.github.io/lightweight-charts/examples/series-types/area

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

const series = chart.addSeries(AreaSeries, {
	lineColor: LINE_LINE_COLOR,
	topColor: AREA_TOP_COLOR,
	bottomColor: AREA_BOTTOM_COLOR,
	lineWidth: 2,
});
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: a seeded random walk, so the chart looks the same on every load.
function generateValues(count = 120) {
	let seed = 29;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let value = 100;
	const points = [];
	for (let i = 0; i < count; i++) {
		value += (random() - 0.48) * 4;
		points.push({ time, value });
		time += day;
	}
	return points;
}
