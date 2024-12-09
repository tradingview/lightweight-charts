const options = {
	yieldCurve: {
		baseResolution: 1,
		minimumTimeRange: 10,
		startTimeRange: 3,
	},
	layout: {
		attributionLogo: false,
	},
};

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

function interactionsToPerform() {
	return [];
}

let chart;

async function waitNextFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function beforeInteractions(container) {
	chart = LightweightCharts.createYieldCurveChart(container, options);

	const series1 = chart.addSeries(LightweightCharts.AreaSeries, {
		lineType: 2,
		color: 'red',
		pointMarkersVisible: true,
	});
	series1.setData(curve1);
	const series2 = chart.addSeries(LightweightCharts.LineSeries, {
		lineType: 2,
		color: 'green',
		pointMarkersVisible: true,
		lineWidth: 1,
	});
	series2.setData(curve2);

	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(async () => {
			series1.update(
				{
					time: 12,
					value: 4.8,
				},
				true
			);
			series2.update({
				time: 420,
				value: 4,
			});
			await waitNextFrame();
			series1.update({
				time: 360,
			});
			series2.update({
				time: 420,
				value: 4,
			});
			await waitNextFrame();
			series1.update({
				time: 360,
			});
			series2.update({
				time: 420,
				value: 4,
			});
			await waitNextFrame();
			series1.setData(curve1.slice(0, 10));
			await waitNextFrame();
			series2.setData(curve2.slice(0, 9));
			await waitNextFrame();
			resolve();
		});
	});
}

function afterInteractions() {
	chart.takeScreenshot();
	return Promise.resolve();
}
