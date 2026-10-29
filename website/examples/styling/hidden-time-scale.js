// remove-start
// Lightweight Charts™ Example: Hidden time scale
// https://tradingview.github.io/lightweight-charts/examples/styling/hidden-time-scale

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

// highlight-start
chart.applyOptions({
	timeScale: {
		visible: false,
	},
});
// highlight-end

const lineSeries = chart.addSeries(LineSeries, { color: LINE_LINE_COLOR });

const data = [
	{ value: 0, time: 1642425322 },
	// hide-start
	{ value: 8, time: 1642511722 },
	{ value: 10, time: 1642598122 },
	{ value: 20, time: 1642684522 },
	{ value: 3, time: 1642770922 },
	{ value: 43, time: 1642857322 },
	{ value: 41, time: 1642943722 },
	{ value: 43, time: 1643030122 },
	{ value: 56, time: 1643116522 },
	{ value: 46, time: 1643202922 },
	// hide-end
];

lineSeries.setData(data);

chart.timeScale().fitContent();
