function nextBusinessDay(time) {
	var d = new Date();
	d.setUTCFullYear(time.year);
	d.setUTCMonth(time.month - 1);
	d.setUTCDate(time.day + 1);
	d.setUTCHours(0, 0, 0, 0);
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		day: d.getUTCDate(),
	};
}

function businessDayToTimestamp(time) {
	var d = new Date();
	d.setUTCFullYear(time.year);
	d.setUTCMonth(time.month - 1);
	d.setUTCDate(time.day);
	d.setUTCHours(0, 0, 0, 0);
	return d.getTime() / 1000;
}

function generateCandle(i, target) {
	var step = (i % 20) / 5000;
	var base = i / 5;
	target.open = base;
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	var res = [];
	var time = nextBusinessDay({ day: 1, month: 1, year: 2018 });
	for (var i = 0; i < 500; ++i) {
		time = nextBusinessDay(time);

		var item = {
			time: businessDayToTimestamp(time),
		};
		generateCandle(i, item);
		res.push(item);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 20,
		},
	});

	var mainSeries = chart.addCandleSeries({
		drawBorder: true,
		borderColor: 'blue',
	});

	mainSeries.setData(generateData());
}
