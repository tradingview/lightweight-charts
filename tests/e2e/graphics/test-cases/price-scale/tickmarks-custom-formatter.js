function findValuablePrecision(values, maxPrecision) {
	let precision = maxPrecision;
	for (; precision > 0; precision--) {
		const precisionMultiplier = Math.pow(10, precision);
		const multiplied = values.map(v => Math.round(v * precisionMultiplier));
		if (multiplied.some(v => v % 10)) {
			break;
		}
	}
	return precision;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container));

	const data = Array.from({ length: 10 }).map((_, index) => ({ time: index * 10000, value: 10 - index, color: index % 2 ? '#ff0000' : '#0000ff' }));

	const series = chart.addSeries(
		LightweightCharts.LineSeries,
		{
			priceFormat: {
				type: 'custom',
				formatter: val => val.toFixed(8),
				tickmarksFormatter: vals => {
					const precision = findValuablePrecision(vals, 4);
					return vals.map(n => n.toFixed(precision));
				},
				minMove: 0.0001,
			},
		}
	);
	series.setData(data);

	chart.timeScale().fitContent();
}
