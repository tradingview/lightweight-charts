function inRange(from, value, to) {
	return !isNaN(value) && from < value && value < to;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var width = 400;
	var chart = LightweightCharts.createChart(container, {
		width: width,
		height: 200,
		rightPriceScale: {
			visible: false,
		},
		leftPriceScale: {
			visible: false,
		},
	});

	var series = chart.addLineSeries();

	var data = [
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
	];

	series.setData(data);

	var timeScale = chart.timeScale();
	timeScale.setVisibleLogicalRange({ from: 0.5, to: (data.length - 1) - 0.5 });

	return new Promise((resolve) => {
		setTimeout(() => {
			var firstBarCoordinate = timeScale.timeToCoordinate(data[0].time);
			console.assert(inRange(-2, firstBarCoordinate, 2), `First bar coordinate must be around 0, got=${firstBarCoordinate}`);

			var lastBarCoordinate = timeScale.timeToCoordinate(data[data.length - 1].time);
			console.assert(inRange(width - 2, lastBarCoordinate, width + 2), `Last bar coordinate must be around ${width}, got=${lastBarCoordinate}`);

			console.assert(timeScale.timeToCoordinate('1990-04-23') === null, 'Coordinate of time out of data from left should be null');
			console.assert(timeScale.timeToCoordinate('1990-04-29') === null, 'Coordinate of time out of data from right should be null');
			console.assert(timeScale.timeToCoordinate('1990-04-27') === null, 'Coordinate of time out of data inside should be null');

			resolve();
		}, 1000);
	});
}
