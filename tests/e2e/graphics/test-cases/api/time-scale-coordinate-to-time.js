// Ignore the mouse movement check because height of chart is too short
window.ignoreMouseMove = true;

function runTestCase(container) {
	const width = 400;
	const chart = window.chart = LightweightCharts.createChart(container, {
		width: width,
		height: 200,
		rightPriceScale: {
			visible: false,
		},
		leftPriceScale: {
			visible: false,
		},
	});

	const series = chart.addLineSeries();

	const data = [
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
	];

	series.setData(data);

	const timeScale = chart.timeScale();
	timeScale.setVisibleLogicalRange({ from: 0.5, to: (data.length - 1) - 0.5 });

	return new Promise(resolve => {
		setTimeout(() => {
			const timeAtZeroCoordinate = timeScale.coordinateToTime(0);
			console.assert(timeAtZeroCoordinate === data[0].time, `Time at zero coordinate must be the first bar time, got=${timeAtZeroCoordinate}`);

			const timeAtWidthCoordinate = timeScale.coordinateToTime(width);
			console.assert(timeAtWidthCoordinate === data[data.length - 1].time, `Time at ${width} coordinate must be the last bar time, got=${timeAtWidthCoordinate}`);

			console.assert(timeScale.coordinateToTime(-100) === null, 'Coordinate of time out of data from left should be null');
			console.assert(timeScale.coordinateToTime(width + 100) === null, 'Coordinate of time out of data from right should be null');

			console.assert(timeScale.coordinateToTime(30) === data[0].time, 'Should align coordinate to the bar');

			resolve();
		}, 1000);
	});
}
