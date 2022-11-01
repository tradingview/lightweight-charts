// Ignore the mouse movement check because height of chart is too short
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		width: 600,
		height: 300,
		rightPriceScale: {
			entireTextOnly: true,
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: true,
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData([
		{ time: 1564617660, value: 32.51 },
		{ time: 1564617720, value: 31.11 },
		{ time: 1564617780, value: 27.02 },
		{ time: 1564617840, value: 27.32 },
		{ time: 1564617900, value: 25.17 },
		{ time: 1564617960, value: 28.89 },
		{ time: 1564618020, value: 25.46 },
		{ time: 1564618080, value: 23.92 },
		{ time: 1564618140, value: 22.68 },
		{ time: 1564618200, value: 22.67 },
		{ time: 1564618202, value: 22.67 },
		{ time: 1564618203, value: 20.67 },
		{ time: 1564618204, value: 22.67 },
		{ time: 1564618205, value: 22.67 },
		{ time: 1564618206, value: 32.67 },
		{ time: 1564618207, value: 30.67 },
		{ time: 1564621804, value: 22.67 },
		{ time: 1564621805, value: 22.67 },
	]);

	chart.timeScale().fitContent();
}
