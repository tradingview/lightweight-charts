// remove-start
// Lightweight Charts™ Example: Watermark Simple
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/watermark

// remove-end
const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
};
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(document.getElementById('container'), chartOptions);

// remove-line
/** @type {import('lightweight-charts').createTextWatermark} */
// highlight-start
createTextWatermark(chart.panes()[0], {
	horzAlign: 'center',
	vertAlign: 'center',
	lines: [
		{
			text: 'Watermark Example',
			color: 'rgba(171, 71, 188, 0.5)',
			fontSize: 24,
		},
	],
});
// highlight-end

const lineSeries = chart.addSeries(AreaSeries, {
	topColor: AREA_TOP_COLOR,
	bottomColor: AREA_BOTTOM_COLOR,
	lineColor: LINE_LINE_COLOR,
	lineWidth: 2,
});

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
