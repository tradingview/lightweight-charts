function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 30; ++i) {
		const currentTime = time.getTime() / 1000;
		time.setUTCDate(time.getUTCDate() + 1);

		// Create a gap by pushing WhitespaceData (an empty point with just a time).
		// This ensures the time scale has indices for these days, creating a gap in the series data's TimePointIndex array.
		if (i > 10 && i < 20) {
			res.push({ time: currentTime });
			continue;
		}

		res.push({
			time: currentTime,
			value: 10 + Math.sin(i / 5) * 5,
		});
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: false,
		},
		timeScale: {
			barSpacing: 20,
		},
	});

	const data = generateData();

	// Line Series with connectGaps: false
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		lineWidth: 2,
		connectGaps: false,
		title: 'Line (No Gaps)',
	});
	lineSeries.setData(data);

	// Area Series with connectGaps: false (offset for visibility)
	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		topColor: 'rgba(33, 150, 243, 0.4)',
		bottomColor: 'rgba(33, 150, 243, 0.1)',
		lineColor: '#2196F3',
		connectGaps: false,
		title: 'Area (No Gaps)',
	});
	areaSeries.setData(data.map(d => d.value !== undefined ? { ...d, value: d.value + 10 } : d));

	// Baseline Series with connectGaps: false
	const baselineSeries = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 30 },
		topFillColor1: 'rgba(38, 166, 154, 0.28)',
		topFillColor2: 'rgba(38, 166, 154, 0.05)',
		topLineColor: 'rgba(38, 166, 154, 1)',
		bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
		bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
		bottomLineColor: 'rgba(239, 83, 80, 1)',
		connectGaps: false,
		title: 'Baseline (No Gaps)',
	});
	baselineSeries.setData(data.map(d => d.value !== undefined ? { ...d, value: d.value + 20 } : d));

	chart.timeScale().fitContent();
}
