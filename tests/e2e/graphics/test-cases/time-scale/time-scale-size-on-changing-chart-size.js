// Ignore the mouse movement check because height of chart is too thin
window.ignoreMouseMove = true;

async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { width: 150 });

	const timeScale = chart.timeScale();

	const series = chart.addLineSeries();
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
	]);

	await new Promise(resolve => setTimeout(resolve, 1000));

	const originalWidth = timeScale.width();

	let changedWidth;

	timeScale.subscribeSizeChange((width, height) => {
		changedWidth = width;
	});

	chart.applyOptions({
		width: 200,
	});

	await new Promise(resolve => setTimeout(resolve, 1000));

	console.assert(originalWidth > 0, 'Width of visible time axis should not be 0');
	console.assert(timeScale.width() > originalWidth, 'Width of invisible time axis should be 0');
	console.assert(changedWidth > originalWidth, 'Width of invisible time axis should be 0 (from event)');
}
