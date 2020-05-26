function dataItem(date, val) {
	return {
		value: val,
		time: new Date(date).getTime() / 1000,
	};
}

function getData() {
	return [
		dataItem('2019-12-31', 10),
		dataItem('2020-01-01', 20), // year
		dataItem('2020-02-01', 30), // month
		dataItem('2020-02-03', 10), // day
		dataItem('2020-02-03T01:00:00.000Z', 20), // hour
		dataItem('2020-02-03T01:01:00.000Z', 67), // time
		dataItem('2020-02-03T01:01:01.000Z', 99), // seconds
	];
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		timeScale: {
			timeVisible: true,
			secondsVisible: true,
			tickMarkFormatter: function(timePoint, tickMarkType, locale) {
				var date = new Date(timePoint.timestamp * 1000);
				switch (tickMarkType) {
					case LightweightCharts.TickMarkType.Year:
						return 'Y' + date.getUTCFullYear();

					case LightweightCharts.TickMarkType.Month:
						return 'M' + (date.getUTCMonth() + 1);

					case LightweightCharts.TickMarkType.DayOfMonth:
						return 'D' + date.getUTCDate();

					case LightweightCharts.TickMarkType.Time:
						return 'T' + date.getUTCHours() + ':' + date.getUTCMinutes();

					case LightweightCharts.TickMarkType.TimeWithSeconds:
						return 'S' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds();
				}

				throw new Error('unhandled tick mark type ' + tickMarkType);
			},
		},
	});

	var firstSeries = chart.addLineSeries();
	firstSeries.setData(getData());
	chart.timeScale().fitContent();
}
