function generateData() {
	return [
		{
			time: 1609459200,
			open: 582.4318996548693,
			high: 629.0270919149829,
			close: 653.9862222622528,
			low: 649.8195162930119,
		},
		{
			time: 1609545600,
			open: 653.9862222622528,
			high: 662.5318815834194,
			close: 726.3543777035026,
			low: 660.2117195174267,
		},
		{
			time: 1609632000,
			open: 726.3543777035026,
			high: 726.7763417947443,
			close: 651.9789728671345,
			low: 591.3945553317442,
		},
		{
			time: 1609718400,
			open: 651.9789728671345,
			high: 703.385951882818,
			close: 556.6425667709269,
			low: 534.0018327807486,
		},
		{
			time: 1609804800,
			open: 556.6425667709269,
			high: 581.8874211861685,
			close: 654.5410321091291,
			low: 628.1294964484096,
		},
	];
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 40,
			timeVisible: true,
		},
	});

	const candlestick = chart.addCandlestickSeries({
		upColor: 'green',
		downColor: 'red',
	});

	const data = generateData();
	candlestick.setData(data);

	chart.timeScale().setVisibleRange({
		from: data[0].time,
		to: data[data.length - 1].time,
	});

	return new Promise(resolve => {
		setTimeout(() => {
			candlestick.applyOptions({
				upColor: 'blue',
				downColor: 'orange',
				wickUpColor: 'blue',
				wickDownColor: 'orange',
			});

			resolve();
		}, 100);
	});
}
