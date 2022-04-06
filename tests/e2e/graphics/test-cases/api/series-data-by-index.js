function compare(obj1, obj2) {
	return obj1.time === obj2.time && obj1.value === obj2.value;
}

function runTestCase(container) {
	const chart = LightweightCharts.createChart(container);
	const series = chart.addAreaSeries();
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-27', value: 2 },
		{ time: '1990-04-28', value: 3 },
		{ time: '1990-04-29', value: 4 },
		{ time: '1990-04-30', value: 5 },
	]);

	console.assert(series.dataByIndex(-1) === null, 'should return null for logical index that is outside of data');
	console.assert(compare(series.dataByIndex(0), { time: '1990-04-24', value: 0 }), 'incorrect item at index 0: ' + JSON.stringify(series.dataByIndex(0)));
	console.assert(
		compare(series.dataByIndex(-1, LightweightCharts.MismatchDirection.NearestRight), series.dataByIndex(0)),
		'should return nearest right item if mismatch direction is MismatchDirection.NearestRight'
	);

	console.assert(series.dataByIndex(6) === null, 'should return null for logical index that is outside of data');
	console.assert(compare(series.dataByIndex(5), { time: '1990-04-30', value: 5 }), 'incorrect item at index 5: ' + JSON.stringify(series.dataByIndex(5)));
	console.assert(
		compare(series.dataByIndex(6, LightweightCharts.MismatchDirection.NearestLeft), series.dataByIndex(5)),
		'should return nearest left item if mismatch direction is MismatchDirection.NearestLeft'
	);

	chart.applyOptions({
		watermark: {
			color: 'red',
			visible: true,
			text: `${series.dataByIndex(3).time}`,
		},
	});
}
