function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			visible: true,
		},
		leftPriceScale: {
			visible: false,
		},
	});

	const series = chart.addLineSeries({ priceScaleId: 'overlay-scale' });
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
	]);

	return new Promise(resolve => {
		setTimeout(() => {
			const leftPriceScale = chart.priceScale('left');
			const rightPriceScale = chart.priceScale('right');
			const overlayScale = chart.priceScale('overlay-scale');

			console.assert(leftPriceScale.width() === 0, 'Width of invisible price axis should be 0');
			console.assert(rightPriceScale.width() > 0, 'Width of visible price axis should be greater 0');
			console.assert(overlayScale.width() === 0, 'Width of overlay price axis should be 0');

			resolve();
		}, 1000);
	});
}
