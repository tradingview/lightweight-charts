/*
	We expect the black markers to be drawn above the area series
 */

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2962FF',
	});

	const lineData = [
		{ time: '2018-12-22', value: 32.51 },
		{ time: '2018-12-23', value: 31.11 },
		{ time: '2018-12-24', value: 27.02 },
		{ time: '2018-12-25', value: 27.32 },
		{ time: '2018-12-26', value: 25.17 },
		{ time: '2018-12-27', value: 28.89 },
		{ time: '2018-12-28', value: 25.46 },
		{ time: '2018-12-29', value: 23.92 },
		{ time: '2018-12-30', value: 22.68 },
		{ time: '2018-12-31', value: 22.67 },
	];

	lineSeries.setData(lineData);

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: 'red',
		topColor: 'orange',
		bottomColor: 'yellow',
	});

	areaSeries.setData([
		{ time: '2018-12-22', value: 42.51 },
		{ time: '2018-12-23', value: 41.11 },
		{ time: '2018-12-24', value: 37.02 },
		{ time: '2018-12-25', value: 37.32 },
		{ time: '2018-12-26', value: 35.17 },
		{ time: '2018-12-27', value: 38.89 },
		{ time: '2018-12-28', value: 35.46 },
		{ time: '2018-12-29', value: 33.92 },
		{ time: '2018-12-30', value: 32.68 },
		{ time: '2018-12-31', value: 32.67 },
	]);

	const seriesMarkers = LightweightCharts.createSeriesMarkers(lineSeries);
	seriesMarkers.applyOptions?.({
		zOrder: 'aboveSeries',
	});
	const markers = lineData.map(d => ({
		time: d.time,
		price: d.value,
		color: 'black',
		position: 'inBar',
		shape: 'circle',
	}));
	seriesMarkers.setMarkers(markers);
	chart.timeScale().fitContent();
}
