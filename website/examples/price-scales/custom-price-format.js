// remove-start
// Lightweight Charts™ Example: Custom price format
// https://tradingview.github.io/lightweight-charts/examples/price-scales/custom-price-format

// remove-end
// highlight-start
// Prices in US dollars, shortened: 1250000000 becomes $1.25B.
const currencyFormat = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	maximumFractionDigits: 2,
});
// highlight-end

const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
	grid: {
		vertLines: { color: CHART_GRID_COLOR },
		horzLines: { color: CHART_GRID_COLOR },
	},
	// highlight-start
	localization: {
		priceFormatter: price => currencyFormat.format(price),
	},
	// highlight-end
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

// Sample data: a seeded random walk around 1.2 billion, so the chart looks the
// same on every load.
function generateValues(count = 120) {
	let seed = 17;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let value = 1.2e9;
	const points = [];
	for (let i = 0; i < count; i++) {
		value *= 1 + (random() - 0.48) * 0.03;
		points.push({ time, value });
		time += day;
	}
	return points;
}
