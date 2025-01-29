// remove-start
// Lightweight Charts™ Example: Yield Curve Chart with Update Markers
// https://tradingview.github.io/lightweight-charts/tutorials/demos/yield-curve-with-update-markers

// remove-end

// hide-start
const curve1 = [
	{ time: 1, value: 5.378 },
	{ time: 2, value: 5.372 },
	{ time: 3, value: 5.271 },
	{ time: 6, value: 5.094 },
	{ time: 12, value: 4.739 },
	{ time: 24, value: 4.237 },
	{ time: 36, value: 4.036 },
	{ time: 60, value: 3.887 },
	{ time: 84, value: 3.921 },
	{ time: 120, value: 4.007 },
	{ time: 240, value: 4.366 },
	{ time: 360, value: 4.29 },
];
const curve2 = [
	{ time: 1, value: 5.381 },
	{ time: 2, value: 5.393 },
	{ time: 3, value: 5.425 },
	{ time: 6, value: 5.494 },
	{ time: 12, value: 5.377 },
	{ time: 24, value: 4.883 },
	{ time: 36, value: 4.554 },
	{ time: 60, value: 4.241 },
	{ time: 84, value: 4.172 },
	{ time: 120, value: 4.084 },
	{ time: 240, value: 4.365 },
	{ time: 360, value: 4.176 },
];
// hide-end

const chartOptions = {
	autoSize: true,
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
	yieldCurve: {
		baseResolution: 12,
		minimumTimeRange: 10,
		startTimeRange: 3,
	},
	handleScroll: false,
	handleScale: false,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	timeScale: {
		minBarSpacing: 3,
	},
};

const container = document.getElementById('container');
const chart = createYieldCurveChart(container, chartOptions);

const series1 = chart.addSeries(LineSeries, {
	lineType: 2,
	color: '#26c6da',
	pointMarkersVisible: true,
	lineWidth: 2,
});
const priceChangeMarkers = createUpDownMarkers(series1);
priceChangeMarkers.setData(curve1);

const series2 = chart.addSeries(LineSeries, {
	lineType: 2,
	color: 'rgb(164, 89, 209)',
	pointMarkersVisible: true,
	lineWidth: 1,
});
series2.setData(curve2);

chart.timeScale().fitContent();

chart.timeScale().subscribeSizeChange(() => {
	chart.timeScale().fitContent();
});

setInterval(() => {
	curve1
		.filter(() => Math.random() < 0.1)
		.forEach(data => {
			const shift = (Math.random() > 0.5 ? -1 : 1) * Math.random() * 0.01 * data.value;
			priceChangeMarkers.update(
				{
					...data,
					value: data.value + shift,
				},
				true
			);
		});
}, 5000);
