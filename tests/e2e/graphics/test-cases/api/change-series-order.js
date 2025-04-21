function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const areaSeries1 = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#2962FF',
		topColor: '#2962FF',
		bottomColor: 'rgba(41, 98, 255, 0.28)',
		priceFormat: {
			type: 'custom',
			minMove: 0.01,
			formatter: price => price.toFixed(1),
		},
	});

	areaSeries1.setData([
		{ time: '2018-12-22', value: 32.51 },
		{ time: '2018-12-23', value: 31.11 },
		{ time: '2018-12-24', value: 27.02 },
		{ time: '2018-12-25', value: 27.32 },
		{ time: '2018-12-26', value: 25.17 },
		{ time: '2018-12-27', value: 28.89 },
		{ time: '2018-12-28', value: 25.46 },
		{ time: '2018-12-29', value: 23.92 },
		{ time: '2018-12-30', value: 22.68 },
		{ time: '2018-12-31', value: 22.67 },
	]);

	const areaSeries2 = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#ff29b4',
		topColor: '#510a60',
		bottomColor: 'rgba(166,104,168,0.28)',
		priceFormat: {
			type: 'custom',
			minMove: 0.01,
			formatter: price => `$${price.toFixed(3)}`,
		},
	});

	areaSeries2.setData([
		{ time: '2018-12-22', value: 22.51 },
		{ time: '2018-12-23', value: 31.11 },
		{ time: '2018-12-24', value: 33.02 },
		{ time: '2018-12-25', value: 29.32 },
		{ time: '2018-12-26', value: 20.17 },
		{ time: '2018-12-27', value: 26.89 },
		{ time: '2018-12-28', value: 23.46 },
		{ time: '2018-12-29', value: 29.92 },
		{ time: '2018-12-30', value: 24.68 },
		{ time: '2018-12-31', value: 20.67 },
	]);

	const areaSeries3 = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#10ec1b',
		topColor: '#10ec1b',
		bottomColor: 'rgba(16,236,27,0.2)',
		priceFormat: {
			type: 'custom',
			minMove: 0.01,
			formatter: price => `${price.toFixed(0)}%`,
		},
	});

	areaSeries3.setData([
		{ time: '2018-12-22', value: 10 },
		{ time: '2018-12-23', value: 33 },
		{ time: '2018-12-24', value: 22 },
		{ time: '2018-12-25', value: 15 },
		{ time: '2018-12-26', value: 27 },
		{ time: '2018-12-27', value: 25 },
		{ time: '2018-12-28', value: 13 },
		{ time: '2018-12-29', value: 18 },
		{ time: '2018-12-30', value: 16 },
		{ time: '2018-12-31', value: 25 },
	]);

	chart.timeScale().fitContent();

	console.assert(areaSeries1.seriesOrder() === 0, `areaSeries1 order should be 0, actual: ${areaSeries1.seriesOrder()}`);
	console.assert(areaSeries2.seriesOrder() === 1, `areaSeries2 order should be 1, actual: ${areaSeries2.seriesOrder()}`);
	console.assert(areaSeries3.seriesOrder() === 2, `areaSeries3 order should be 2, actual: ${areaSeries3.seriesOrder()}`);

	areaSeries2.setSeriesOrder(0);

	console.assert(areaSeries1.seriesOrder() === 1, `areaSeries1 order should be 1, actual: ${areaSeries1.seriesOrder()}`);
	console.assert(areaSeries2.seriesOrder() === 0, `areaSeries2 order should be 0, actual: ${areaSeries2.seriesOrder()}`);
	console.assert(areaSeries3.seriesOrder() === 2, `areaSeries3 order should be 2, actual: ${areaSeries3.seriesOrder()}`);

	areaSeries3.setSeriesOrder(0);

	console.assert(areaSeries1.seriesOrder() === 2, `areaSeries1 order should be 2, actual: ${areaSeries1.seriesOrder()}`);
	console.assert(areaSeries2.seriesOrder() === 1, `areaSeries2 order should be 1, actual: ${areaSeries2.seriesOrder()}`);
	console.assert(areaSeries3.seriesOrder() === 0, `areaSeries3 order should be 0, actual: ${areaSeries3.seriesOrder()}`);

	areaSeries3.applyOptions({ priceScaleId: 'left' });
	chart.priceScale('left').applyOptions({ visible: true });

	console.assert(areaSeries1.seriesOrder() === 2, `areaSeries1 order should be 2, actual: ${areaSeries1.seriesOrder()}`);
	console.assert(areaSeries2.seriesOrder() === 1, `areaSeries2 order should be 1, actual: ${areaSeries2.seriesOrder()}`);
	console.assert(areaSeries3.seriesOrder() === 0, `areaSeries3 order should be 0, actual: ${areaSeries3.seriesOrder()}`);
}
