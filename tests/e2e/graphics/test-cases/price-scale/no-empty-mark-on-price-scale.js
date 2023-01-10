function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const series = chart.addLineSeries();

	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
	]);

	return new Promise(resolve => {
		requestAnimationFrame(
			() => {
				series.setData([]);

				requestAnimationFrame(
					() => {
						series.applyOptions({
							priceFormat: {
								type: 'custom',
								formatter: priceValue => priceValue.toFixed(2),
								minMove: 0.01,
							},
						});

						requestAnimationFrame(
							() => {
								series.setData([
									{ time: '1990-04-24', value: 0 },
									{ time: '1990-04-25', value: 1 },
									{ time: '1990-04-26', value: 2 },
								]);

								resolve();
							}
						);
					}
				);
			}
		);
	});
}
