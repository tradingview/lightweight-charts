function generateBar(i, target) {
	var step = (i % 20) / 1000;
	var base = i / 5;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		var item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateBar(i, item);
		res.push(item);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(
		container,
		{
			layout: {
				fontSize: 20,
			},
		}
	);

	var mainSeries = chart.addBarSeries();

	var data = generateData();
	mainSeries.setData(data);

	mainSeries.setMarkers([
		{ time: data[data.length - 50].time, position: 'belowBar', shape: 'arrowUp', text: 'test' },
		{ time: data[data.length - 50].time, position: 'belowBar', shape: 'arrowDown', text: 'test' },
		{ time: data[data.length - 50].time, position: 'belowBar', shape: 'circle', text: 'test' },
		{ time: data[data.length - 50].time, position: 'belowBar', shape: 'square', text: 'test' },
		{ time: data[data.length - 40].time, position: 'aboveBar', shape: 'arrowUp', text: 'test' },
		{ time: data[data.length - 40].time, position: 'aboveBar', shape: 'arrowDown', text: 'test' },
		{ time: data[data.length - 40].time, position: 'aboveBar', shape: 'circle', text: 'test' },
		{ time: data[data.length - 40].time, position: 'aboveBar', shape: 'square', text: 'test' },
		{ time: data[data.length - 30].time, position: 'inBar', shape: 'arrowUp', text: 'test' },
		{ time: data[data.length - 30].time, position: 'inBar', shape: 'arrowDown', text: 'test' },
		{ time: data[data.length - 30].time, position: 'inBar', shape: 'circle', text: 'test' },
		{ time: data[data.length - 30].time, position: 'inBar', shape: 'square', text: 'test' },
		{ time: data[data.length - 20].time, position: 'belowBar', shape: 'square', text: 'test', size: 0 },
		{ time: data[data.length - 20].time, position: 'belowBar', shape: 'square', text: 'test', size: 1 },
		{ time: data[data.length - 20].time, position: 'belowBar', shape: 'square', text: 'test', size: 2 },
		{ time: data[data.length - 20].time, position: 'belowBar', shape: 'square', text: 'test', size: 3 },
		{ time: data[data.length - 10].time, position: 'aboveBar', shape: 'cricle', text: '', size: 0 },
		{ time: data[data.length - 10].time, position: 'aboveBar', shape: 'cricle', text: '', size: 1 },
		{ time: data[data.length - 10].time, position: 'aboveBar', shape: 'cricle', text: '', size: 2 },
		{ time: data[data.length - 10].time, position: 'aboveBar', shape: 'cricle', text: '', size: 3 },
	]);
}
