function generateLineData(count) {
	const data = [];
	const dayMs = 24 * 60 * 60 * 1000;
	let baseValue = 100;

	for (let i = 0; i < count; i++) {
		const step = (i % 20) / 1000;
		const variation = (step - 0.005) * 4;
		baseValue = baseValue * (1 + variation);
		baseValue = Math.max(50, Math.min(200, baseValue));

		data.push({
			time: dayMs + i * 60 * 1000, // 1-minute intervals
			value: Math.round(baseValue * 100) / 100,
		});
	}

	return data;
}

async function runTestCase(container) {
	const desiredBars = 8000; // Number of bars visible in chart
	const barSpacing = container.clientWidth / desiredBars;

	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			enableConflation: true,
			precomputeConflationOnInit: true,
			barSpacing: barSpacing,
			minBarSpacing: barSpacing,
		},
		layout: { attributionLogo: false },
	});

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		title: 'Line Series',
		lineWidth: 1,
		conflationThresholdFactor: 4,
	});

	const lineData = generateLineData(desiredBars);
	lineSeries.setData(lineData);
	chart.timeScale().fitContent();

	await new Promise(resolve => setTimeout(resolve, 0));
}
