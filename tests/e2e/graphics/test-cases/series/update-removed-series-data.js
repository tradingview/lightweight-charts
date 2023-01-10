// Ignore the mouse movement check because height of chart is too short
window.ignoreMouseMove = true;

function runTestCase(container) {
	const data1 = [
		{
			time: 1514764800,
			value: 0,
		},
		{
			time: 1514851200,
			value: 0.29081914410775955,
		},
		{
			time: 1514937600,
			value: 1.6789955502713652,
		},
	];

	const data2 = [
		{
			time: 1514764800,
			value: 0,
		},
		{
			time: 1514851200,
			value: 0.7242371327593901,
		},
		{
			time: 1514937600,
			value: 0.3558113114519652,
		},
	];

	const chart = window.chart = LightweightCharts.createChart(container, {
		width: 600,
		height: 300,
		timeScale: {
			barSpacing: 40,
			timeVisible: true,
		},
	});

	const series1 = chart.addLineSeries({ title: 'Series 1' });
	const series2 = chart.addLineSeries({ title: 'Series 2' });

	return new Promise(resolve => {
		setTimeout(() => {
			series1.setData(data1);

			setTimeout(() => {
				series2.setData(data2);

				setTimeout(() => {
					series1.setData([]);

					setTimeout(() => {
						series2.setData([]);

						setTimeout(() => {
							series1.setData(data1);

							resolve();
						}, 50);
					}, 50);
				}, 50);
			}, 50);
		}, 50);
	});
}
