// remove-start
// Lightweight Charts™ Example: Options chart
// https://tradingview.github.io/lightweight-charts/examples/chart-types/options-chart

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
// highlight-next-line
const chart = createOptionsChart(document.getElementById('container'), chartOptions);

// Profit below zero is drawn in red, above zero in green.
const series = chart.addSeries(BaselineSeries, {
	baseValue: { type: 'price', price: 0 },
	topLineColor: BASELINE_TOP_LINE_COLOR,
	topFillColor1: BASELINE_TOP_FILL_COLOR1,
	topFillColor2: BASELINE_TOP_FILL_COLOR2,
	bottomLineColor: BASELINE_BOTTOM_LINE_COLOR,
	bottomFillColor1: BASELINE_BOTTOM_FILL_COLOR1,
	bottomFillColor2: BASELINE_BOTTOM_FILL_COLOR2,
});
// highlight-next-line
series.setData(straddlePayoff({ strike: 100, premium: 8 }));

chart.timeScale().fitContent();

// Sample data: the profit of a long straddle at expiry, one point per
// underlying price. On an options chart, `time` holds that price.
function straddlePayoff({ strike, premium }) {
	const points = [];
	for (let price = 70; price <= 130; price += 0.5) {
		points.push({ time: price, value: Math.abs(price - strike) - premium });
	}
	return points;
}
