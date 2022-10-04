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
			const firstLogicalCoordinate = timeScale.logicalToCoordinate(0);
			console.assert(inRange(-2, firstLogicalCoordinate, 2), `First logical coordinate must be around 0, got=${firstLogicalCoordinate}`);

			const lastLogicalCoordinate = timeScale.logicalToCoordinate(data.length - 1);
			console.assert(inRange(width - 2, lastLogicalCoordinate, width + 2), `Last logical coordinate must be around ${width}, got=${lastLogicalCoordinate}`);

			series.setData([]);
			console.assert(timeScale.logicalToCoordinate(0) === null, 'Coordinate when chart doesn\'t have data should be null');

			resolve();
		}, 1000);
	});
}
