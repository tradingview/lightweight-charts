function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries);

	lineSeries.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-27', value: 3 },
		{ time: '1990-04-28', value: 4, color: 'green' },
		{ time: '1990-04-29', value: 5, color: 'red' },
	]);

	chart.timeScale().fitContent();
	chart.timeScale().scrollToPosition(-1);

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const lastValueInView = lineSeries.lastValueData(false);
			console.assert(
				lastValueInView.noData === false,
				'expected to find data for last value in view'
			);
			console.assert(
				lastValueInView.price === 4,
				`expected to find price 4 as last value in view, but found ${lastValueInView.price}`
			);
			console.assert(
				lastValueInView.color === 'green',
				`expected to find color green as last value in view, but found ${lastValueInView.color}`
			);

			const lastValueGlobal = lineSeries.lastValueData(true);
			console.assert(
				lastValueGlobal.noData === false,
				'expected to find data for last value globally'
			);
			console.assert(
				lastValueGlobal.price === 5,
				`expected to find price 5 as last value globally, but found ${lastValueGlobal.price}`
			);
			console.assert(
				lastValueGlobal.color === 'red',
				`expected to find color red as last value globally, but found ${lastValueGlobal.color}`
			);

			resolve();
		});
	});
}
