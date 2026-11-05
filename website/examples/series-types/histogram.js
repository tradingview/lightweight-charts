// remove-start
// Lightweight Charts™ Example: Histogram series
// https://tradingview.github.io/lightweight-charts/examples/series-types/histogram

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

const series = chart.addSeries(HistogramSeries, {
	color: HISTOGRAM_COLOR,
	priceFormat: { type: 'volume' },
});
series.setData(generateVolumes());

chart.timeScale().fitContent();

// Sample data: seeded random volumes, colored by whether the price went up or down.
function generateVolumes(count = 120) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	const bars = [];
	for (let i = 0; i < count; i++) {
		const rising = random() > 0.48;
		bars.push({
			time,
			value: Math.round(500000 + random() * 1500000),
			color: rising ? BAR_UP_COLOR : BAR_DOWN_COLOR,
		});
		time += day;
	}
	return bars;
}
