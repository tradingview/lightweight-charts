function inRange(from, value, to) {
	return !isNaN(value) && from < value && value < to;
}

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
			const firstBarCoordinate = timeScale.timeToCoordinate(data[0].time);
			console.assert(inRange(-2, firstBarCoordinate, 2), `First bar coordinate must be around 0, got=${firstBarCoordinate}`);

			const lastBarCoordinate = timeScale.timeToCoordinate(data[data.length - 1].time);
			console.assert(inRange(width - 2, lastBarCoordinate, width + 2), `Last bar coordinate must be around ${width}, got=${lastBarCoordinate}`);

			console.assert(timeScale.timeToCoordinate('1990-04-23') === null, 'Coordinate of time out of data from left should be null');
			console.assert(timeScale.timeToCoordinate('1990-04-29') === null, 'Coordinate of time out of data from right should be null');
			console.assert(timeScale.timeToCoordinate('1990-04-27') === null, 'Coordinate of time out of data inside should be null');

			resolve();
		}, 1000);
	});
}
