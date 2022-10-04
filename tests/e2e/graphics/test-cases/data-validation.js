function runTestCase(container) {
	if (window.BUILD_MODE === 'production') {
		// Ignore the mouse movement check because we don't run this test on production
		window.ignoreMouseMove = true;

		// don't run this test on production build.
		return;
	}

	try {
		LightweightCharts.createChart('non-existed-id');
		console.assert(false, 'should fail if passed container id does not exist');
	} catch (e) {
		// passed
	}

	const chart = window.chart = LightweightCharts.createChart(container);
	const lineSeries = chart.addLineSeries();
	const barSeries = chart.addBarSeries();

	try {
		lineSeries.setData([
			{ time: 1 },
			{ time: 0, value: 0 },
		]);

		console.assert(false, 'should fail if series data is not ordered');
	} catch (e) {
		// passed
	}

	try {
		lineSeries.setMarkers([
			{ time: 1 },
			{ time: 0, value: 0 },
		]);

		console.assert(false, 'should fail if series markers is not ordered');
	} catch (e) {
		// passed
	}

	try {
		lineSeries.setData([
			{ time: 0 },
			{ time: 0, value: 0 },
			{ time: 1, value: 1 },
		]);

		console.assert(false, 'should fail if series data has duplicates');
	} catch (e) {
		// passed
	}

	try {
		lineSeries.setData([
			{ time: 0, value: '0' },
		]);

		console.assert(false, 'should fail if series data item value type is not number');
	} catch (e) {
		// passed
	}

	try {
		barSeries.setData([
			{ time: 0, open: 0, high: '1', low: 0, close: '0' },
		]);

		console.assert(false, 'should fail if series data item value type is not numbers');
	} catch (e) {
		// passed
	}

	try {
		lineSeries.setData([
			{ time: '0' },
		]);

		console.assert(false, 'should fail if series data item has invalid time');
	} catch (e) {
		// passed
	}

	try {
		lineSeries.setData([
			{ time: '2020-1-1' },
		]);

		console.assert(false, 'should fail if series data item has invalid business day string format');
	} catch (e) {
		// passed
	}

	// should pass - several markers could be on the same bar
	lineSeries.setMarkers([
		{
			color: 'green',
			position: 'belowBar',
			shape: 'arrowDown',
			time: 0,
		},
		{
			color: 'green',
			position: 'aboveBar',
			shape: 'arrowUp',
			time: 0,
		},
	]);
}
