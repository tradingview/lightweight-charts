function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		autoSize: true,
		layout: {
			attributionLogo: false,
			background: {
				type: 'solid',
				color: '#0D0D0D',
			},
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: true,
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineWidth: 2,
		topColor: 'rgba(54, 204, 130, 0.48)',
		bottomColor: 'rgba(54, 204, 130, 0.48)',
		lineColor: 'rgba(54, 204, 130, 1)',
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			mainSeries.setData(generateData());
			requestAnimationFrame(() => {
				resolve();
			});
		});
	});
}

function generateData() {
	return [
		{
			time: 1678967123,
			value: 10,
		},
		{
			time: 1678986010,
			value: 10,
		},
		{
			time: 1680105855,
			value: 10,
		},
		{
			time: 1680105856,
			value: 1,
		},
		{
			time: 1682445639,
			value: 19,
		},
		{
			time: 1683716547,
			value: 19,
		},
		{
			time: 1683723297,
			value: 17,
		},
		{
			time: 1683725501,
			value: 16,
		},
	];
}

window.ignoreMouseMove = true;
