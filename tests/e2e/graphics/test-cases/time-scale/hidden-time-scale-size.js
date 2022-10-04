async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

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
	const originalHeight = timeScale.height();

	let changedWidth;
	let changedHeight;

	timeScale.subscribeSizeChange((width, height) => {
		changedWidth = width;
		changedHeight = height;
	});

	timeScale.applyOptions({
		visible: false,
	});

	await new Promise(resolve => setTimeout(resolve, 1000));

	console.assert(originalWidth > 0, 'Width of visible time axis should not be 0');
	console.assert(originalHeight > 0, 'Height of visible time axis should not be 0');

	console.assert(timeScale.width() === 0, 'Width of invisible time axis should be 0');
	console.assert(timeScale.height() === 0, 'Height of invisible time axis should be 0');

	console.assert(changedWidth === 0, 'Width of invisible time axis should be 0 (from event)');
	console.assert(changedHeight === 0, 'Height of invisible time axis should be 0 (from event)');
}
