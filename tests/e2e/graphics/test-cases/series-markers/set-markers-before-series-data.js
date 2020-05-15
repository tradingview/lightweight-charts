// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addLineSeries();

	mainSeries.setMarkers([
		{
			time: '2019-04-09',
			position: 'aboveBar',
			color: 'black',
			shape: 'arrowDown',
		},
		{
			time: '2019-05-31',
			position: 'belowBar',
			color: 'red',
			shape: 'arrowUp',
			id: 'id3',
		},
		{
			time: '2019-05-31',
			position: 'belowBar',
			color: 'orange',
			shape: 'arrowUp',
			id: 'id4',
		},
	]);

	mainSeries.setData([{ time: '2018-12-12', value: 24.11 }]);
}
