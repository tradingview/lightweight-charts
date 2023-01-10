function compareAreaData(obj1, obj2) {
	return obj1.time === obj2.time
		&& obj1.value === obj2.value
		&& obj1.lineColor === obj2.lineColor
		&& obj1.topColor === obj2.topColor
		&& obj1.bottomColor === obj2.bottomColor;
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

function compareBaselineData(obj1, obj2) {
	return obj1.time === obj2.time
		&& obj1.value === obj2.value
		&& obj1.topFillColor1 === obj2.topFillColor1
		&& obj1.topFillColor2 === obj2.topFillColor2
		&& obj1.topLineColor === obj2.topLineColor
		&& obj1.bottomFillColor1 === obj2.bottomFillColor1
		&& obj1.bottomFillColor2 === obj2.bottomFillColor2
		&& obj1.bottomLineColor === obj2.bottomLineColor;
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

function checkSeries(series, data, compareItemsFn) {
	const originalData = data.map(item => ({ ...item }));
	const seriesType = series.seriesType();

	series.setData(data);

	console.assert(
		series.dataByIndex(-1) === null,
		`${seriesType} series should return null for logical index (-1) that is outside of data`
	);

	console.assert(
		compareAreaData(series.dataByIndex(-1, LightweightCharts.MismatchDirection.NearestRight), series.dataByIndex(0)),
		`${seriesType} series should return nearest right item if mismatch direction is MismatchDirection.NearestRight`
	);

	console.assert(
		series.dataByIndex(originalData.length) === null,
		`${seriesType} should return null for logical index (${originalData.length}) that is outside of data`
	);

	console.assert(
		compareAreaData(series.dataByIndex(originalData.length, LightweightCharts.MismatchDirection.NearestLeft), series.dataByIndex(originalData.length - 1)),
		`${seriesType} series should return nearest left item if mismatch direction is MismatchDirection.NearestLeft`
	);

	for (let i = 0; i < originalData.length; ++i) {
		const item = series.dataByIndex(i);
		const expectedItem = originalData[i];
		console.assert(
			compareItemsFn(item, expectedItem),
			`incorrect ${seriesType} series item at index ${i}: ${JSON.stringify(item)} !== ${JSON.stringify(expectedItem)}`
		);
	}
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries();
	checkSeries(
		lineSeries,
		[
			{ time: '1990-04-24', value: 0 },
			{ time: '1990-04-25', value: 1 },
			{ time: '1990-04-26', value: 2 },
			{ time: '1990-04-27', value: 3 },
			{ time: '1990-04-28', value: 4, color: 'green' },
			{ time: '1990-04-29', value: 5, color: 'red' },
		],
		compareLineData
	);

	chart.removeSeries(lineSeries);

	const candlestickSeries = chart.addCandlestickSeries();

	checkSeries(
		candlestickSeries,
		generateCandlestickData(),
		compareCandlestickData
	);

	chart.removeSeries(candlestickSeries);

	const areaSeries = chart.addAreaSeries();

	checkSeries(
		areaSeries,
		[
			{ time: '1990-04-24', value: 0 },
			{ time: '1990-04-25', value: 1 },
			{ time: '1990-04-27', value: 2 },
			{ time: '1990-04-28', value: 3, lineColor: '#FF0000', topColor: '#00FF00', bottomColor: '#0000FF' },
			{ time: '1990-04-29', value: 4, lineColor: '#FF0000', topColor: '#00FF00', bottomColor: '#0000FF' },
			{ time: '1990-04-30', value: 5, lineColor: '#FF0000', topColor: '#00FF00', bottomColor: '#0000FF' },
		],
		compareAreaData
	);

	chart.removeSeries(areaSeries);

	const baselineSeries = chart.addBaselineSeries();

	checkSeries(
		baselineSeries,
		[
			{ time: '1990-04-24', value: 0 },
			{ time: '1990-04-25', value: 1 },
			{ time: '1990-04-27', value: 2 },
			{ time: '1990-04-28', value: 3, topFillColor1: '#FFFFFF', topFillColor2: '#000000' },
			{ time: '1990-04-29', value: 4, bottomFillColor1: '#FFFFFF', bottomFillColor2: '#000000' },
			{ time: '1990-04-30', value: 5, topLineColor: '#FF0000', bottomLineColor: '#00FF00' },
		],
		compareBaselineData
	);

	chart.removeSeries(baselineSeries);
}
