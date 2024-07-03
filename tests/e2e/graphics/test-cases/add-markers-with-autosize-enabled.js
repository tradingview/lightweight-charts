function generateCandle(i, target) {
	const step = (i % 2) / 150;
	const base = i / 5;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 50; ++i) {
		const item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		if (i % 30 !== 0) {
			generateCandle(i, item);
		}
		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { autoSize: true, layout: { attributionLogo: false } });

	const series = chart.addCandlestickSeries();

	const data = generateData();
	series.setData(data);

	const datesForMarkers = [data[data.length - 39], data[data.length - 19]];
	let indexOfMinPrice = 0;
	for (let i = 1; i < datesForMarkers.length; i++) {
		if (datesForMarkers[i].high < datesForMarkers[indexOfMinPrice].high) {
			indexOfMinPrice = i;
		}
	}
	const markers = [
		{
			time: data[data.length - 48].time,
			position: 'aboveBar',
			color: '#f68410',
			shape: 'circle',
			text: 'D',
			id: 'D',
		},
	];
	for (let i = 0; i < datesForMarkers.length; i++) {
		if (i !== indexOfMinPrice) {
			markers.push({
				time: datesForMarkers[i].time,
				position: 'aboveBar',
				color: '#e91e63',
				shape: 'arrowDown',
				text: 'Sell @ ' + Math.floor(datesForMarkers[i].high + 2),
				id: 'Sell',
			});
		} else {
			markers.push({
				time: datesForMarkers[i].time,
				position: 'belowBar',
				color: '#2196F3',
				shape: 'arrowUp',
				text: 'Buy @ ' + Math.floor(datesForMarkers[i].low - 2),
				id: 'Buy',
			});
		}
	}
	series.setMarkers(markers);
}
