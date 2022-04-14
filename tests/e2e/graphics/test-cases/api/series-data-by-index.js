function compareAreaData(obj1, obj2) {
	return obj1.time === obj2.time && obj1.value === obj2.value;
}

function compareLineData(obj1, obj2) {
	return obj1.time === obj2.time
		&& obj1.value === obj2.value
		&& obj1.color === obj2.color;
}

function compareCandlestickData(obj1, obj2) {
	return obj1.time === obj2.time
		&& obj1.value === obj2.value
		&& obj1.color === obj2.color
		&& obj1.borderColor === obj2.borderColor
		&& obj1.wickColor === obj2.wickColor;
}

function generateCandlestickData() {
	const result = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));

	for (let i = 0; i < 10; i++) {
		result.push({
			time: time.getTime() / 1000,
			open: 4 + i,
			high: 9 + i,
			low: i,
			close: 7 + i,
			color: i < 5 ? undefined : 'red',
			borderColor: i === 7 ? 'blue' : undefined,
			wickColor: i > 3 ? 'green' : undefined,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return result;
}

function runTestCase(container) {
	const chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries();
	lineSeries.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-27', value: 3 },
		{ time: '1990-04-28', value: 4, color: 'green' },
		{ time: '1990-04-29', value: 5, color: 'red' },
	]);

	console.assert(
		compareLineData(lineSeries.dataByIndex(0), { time: '1990-04-24', value: 0 }),
		`objects should be equal: ${JSON.stringify(lineSeries.dataByIndex(0))} !== ${JSON.stringify({ time: '1990-04-24', value: 0 })}`
	);
	console.assert(
		compareLineData(lineSeries.dataByIndex(5), { time: '1990-04-29', value: 5, color: 'red' }),
		`objects should be equal: ${JSON.stringify(lineSeries.dataByIndex(5))} !== ${JSON.stringify({ time: '1990-04-29', value: 5, color: 'red' })}`
	);

	chart.removeSeries(lineSeries);

	const candlestickSeries = chart.addCandlestickSeries();
	candlestickSeries.setData(generateCandlestickData());

	console.assert(
		compareCandlestickData(candlestickSeries.dataByIndex(0), { time: 1514764800, open: 4, high: 9, low: 0, close: 7 }),
		`objects should be equal: ${JSON.stringify(candlestickSeries.dataByIndex(0))} !== ${JSON.stringify({ time: 1514764800, open: 4, high: 9, low: 0, close: 7 })}`
	);

	console.assert(
		compareCandlestickData(
			candlestickSeries.dataByIndex(7),
			{
				time: 1515369600,
				open: 11,
				high: 16,
				low: 7,
				close: 14,
				color: 'red',
				borderColor: 'blue',
				wickColor: 'green',
			}
		),
		`objects should be equal: ${JSON.stringify(candlestickSeries.dataByIndex(7))} !== ${JSON.stringify({
			time: 1515369600,
			open: 11,
			high: 16,
			low: 7,
			close: 14,
			color: 'red',
			borderColor: 'blue',
			wickColor: 'green',
		})}`
	);

	chart.removeSeries(candlestickSeries);

	const areaSeries = chart.addAreaSeries();
	areaSeries.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-27', value: 2 },
		{ time: '1990-04-28', value: 3 },
		{ time: '1990-04-29', value: 4 },
		{ time: '1990-04-30', value: 5 },
	]);

	console.assert(areaSeries.dataByIndex(-1) === null, 'should return null for logical index that is outside of data');
	console.assert(compareAreaData(areaSeries.dataByIndex(0), { time: '1990-04-24', value: 0 }), 'incorrect item at index 0: ' + JSON.stringify(areaSeries.dataByIndex(0)));
	console.assert(
		compareAreaData(areaSeries.dataByIndex(-1, LightweightCharts.MismatchDirection.NearestRight), areaSeries.dataByIndex(0)),
		'should return nearest right item if mismatch direction is MismatchDirection.NearestRight'
	);

	console.assert(areaSeries.dataByIndex(6) === null, 'should return null for logical index that is outside of data');
	console.assert(compareAreaData(areaSeries.dataByIndex(5), { time: '1990-04-30', value: 5 }), 'incorrect item at index 5: ' + JSON.stringify(areaSeries.dataByIndex(5)));
	console.assert(
		compareAreaData(areaSeries.dataByIndex(6, LightweightCharts.MismatchDirection.NearestLeft), areaSeries.dataByIndex(5)),
		'should return nearest left item if mismatch direction is MismatchDirection.NearestLeft'
	);

	chart.applyOptions({
		watermark: {
			color: 'red',
			visible: true,
			text: `${areaSeries.dataByIndex(3).time}`,
		},
	});
}
