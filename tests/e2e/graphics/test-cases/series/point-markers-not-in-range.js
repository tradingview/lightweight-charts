function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	mainSeries.applyOptions({
		color: '#0000FF',
	});
	const secondarySeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#FF0000',
		pointMarkersVisible: true,
	});

	const data = [
		{ value: 0, time: 1642425322 },
		{ value: 8, time: 1642511722 },
		{ value: 10, time: 1642598122 },
		{ value: 20, time: 1642684522 },
		{ value: 3, time: 1642770922 },
		{ value: 43, time: 1642857322 },
		{ value: 41, time: 1642943722 },
		{ value: 43, time: 1643030122 },
		{ value: 56, time: 1643116522 },
		{ value: 46, time: 1643202922 },
	];
	const data2 = [
		{ value: 18, time: 1643025322 },
		{ value: 20, time: 1643116522 },
		{ value: 21, time: 1643202922 },
	];

	mainSeries.setData(data);
	secondarySeries.setData(data2);
	chart.timeScale().setVisibleLogicalRange({ from: 0, to: 4 });
}
