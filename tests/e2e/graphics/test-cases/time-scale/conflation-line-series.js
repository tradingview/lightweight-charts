function generateLineData(count) {
	const data = [];
	let basePrice = 100;
	const dayMs = 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		const step = (i % 20) / 1000;
		basePrice = basePrice * (1 + (step - 0.001));
		basePrice = Math.max(50, Math.min(200, basePrice));

		data.push({
			time: dayMs + i * 60 * 1000, // 1-minute intervals
			value: Math.round(basePrice * 100) / 100,
		});
	}

	return data;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			enableConflation: true,
			precomputeConflationOnInit: true,
			barSpacing: container.clientWidth / window.devicePixelRatio / 500000,
			minBarSpacing: container.clientWidth / 3 / 500000, // make all data visible
		},
		layout: { attributionLogo: false },
	});

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		lineWidth: 2,
	});

	// Generate 400k data points
	const data = generateLineData(400000);
	lineSeries.setData(data);

	// Fit all data in view
	chart.timeScale().fitContent();
}
