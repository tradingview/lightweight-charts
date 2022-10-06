function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function generateBarData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		const step = (i % 20) / 1000;
		const base = i / 5;
		res.push({
			time: time.getTime() / 1000,
			open: base * (1 - step),
			high: base * (1 + 2 * step),
			low: base * (1 - 2 * step),
			close: base * (1 + step),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			mode: LightweightCharts.PriceScaleMode.IndexedTo100,
		},
	});
	const lineSeries = chart.addLineSeries({
		visible: false,
		baseLineVisible: true,
	});
	const data = generateData();
	lineSeries.setData(data);
	lineSeries.setMarkers([
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'yellow', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'orange', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'yellow', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'red', shape: 'arrowDown' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'red', shape: 'arrowDown' },
	]);

	const candleSeries = chart.addCandlestickSeries({
		visible: false,
		baseLineVisible: true,
	});
	candleSeries.setData(generateBarData());

	const areaSeries = chart.addAreaSeries({
		visible: false,
		baseLineVisible: true,
	});
	areaSeries.setData(generateData());

	const barSeries = chart.addBarSeries({
		visible: false,
		baseLineVisible: true,
	});
	barSeries.setData(generateBarData());

	const histrogramSeries = chart.addHistogramSeries({
		lineWidth: 1,
		color: '#ff0000',
		visible: false,
		baseLineVisible: true,
	});
	histrogramSeries.setData(generateData());
}
