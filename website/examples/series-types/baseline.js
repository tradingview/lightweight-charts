// remove-start
// Lightweight Charts™ Example: Baseline series
// https://tradingview.github.io/lightweight-charts/examples/series-types/baseline

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

const series = chart.addSeries(BaselineSeries, {
	// Values above the base price are drawn in the top colors, values below it in the bottom ones.
	baseValue: { type: 'price', price: 100 },
	topLineColor: BASELINE_TOP_LINE_COLOR,
	topFillColor1: BASELINE_TOP_FILL_COLOR1,
	topFillColor2: BASELINE_TOP_FILL_COLOR2,
	bottomLineColor: BASELINE_BOTTOM_LINE_COLOR,
	bottomFillColor1: BASELINE_BOTTOM_FILL_COLOR1,
	bottomFillColor2: BASELINE_BOTTOM_FILL_COLOR2,
});
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: a seeded wave around 100, so the values cross the base price.
function generateValues(count = 120) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	const points = [];
	for (let i = 0; i < count; i++) {
		const value = 100 + Math.sin(i / 6) * 6 + (random() - 0.5) * 3;
		points.push({ time, value });
		time += day;
	}
	return points;
}
