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
			const firstLogical = timeScale.coordinateToLogical(0);
			console.assert(firstLogical === 0, `Logical index at zero coordinate must be 0, got=${firstLogical}`);

			const lastLogical = timeScale.coordinateToLogical(width);
			console.assert(lastLogical === data.length - 1, `Logical index at ${width} coordinate must be ${data.length - 1}, got=${lastLogical}`);

			console.assert(timeScale.coordinateToLogical(30) === 0, `Should align coordinate to the logical index 0, got=${timeScale.coordinateToLogical(30)}`);

			series.setData([]);
			console.assert(timeScale.coordinateToLogical(0) === null, 'Logical index when chart doesn\'t have data should be null');

			resolve();
		}, 1000);
	});
}
