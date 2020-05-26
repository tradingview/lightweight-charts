function generateData(count) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var series = chart.addLineSeries();

	var data = generateData(10);
	series.setData(data);

	chart.timeScale().fitContent();

	var bars1 = series.barsInLogicalRange({ from: 0, to: 9 });
	console.assert(bars1 !== null, 'Bars shouldn\'t be null');

	console.assert(bars1.from === data[0].time, `from date should be the first data item's time, expected=${data[0].time}, actual=${bars1.from}`);
	console.assert(bars1.to === data[9].time, `to date should be the time of the last data item, expected=${data[9].time}, actual=${bars1.to}`);
	console.assert(bars1.barsBefore === 0, `barsBefore should be zero, actual=${bars1.barsBefore}`);
	console.assert(bars1.barsAfter === 0, `barsAfter should be zero, actual=${bars1.barsAfter}`);

	var bars2 = series.barsInLogicalRange({ from: -5, to: 9 });
	console.assert(bars2 !== null, 'Bars shouldn\'t be null');

	console.assert(bars2.from === data[0].time, `from date should be the first data item's time, expected=${data[0].time}, actual=${bars2.from}`);
	console.assert(bars2.to === data[9].time, `to date should be the time of the last data item, expected=${data[9].time}, actual=${bars2.to}`);
	console.assert(bars2.barsBefore === -5, `barsBefore should be -5, actual=${bars2.barsBefore}`);
	console.assert(bars2.barsAfter === 0, `barsAfter should be zero, actual=${bars2.barsAfter}`);

	var bars3 = series.barsInLogicalRange({ from: 5, to: 14 });
	console.assert(bars3 !== null, 'Bars shouldn\'t be null');

	console.assert(bars3.from === data[5].time, `from date should the time of 5th data item, expected=${data[5].time}, actual=${bars3.from}`);
	console.assert(bars3.to === data[9].time, `to date should be the time of the last data item, expected=${data[9].time}, actual=${bars3.to}`);
	console.assert(bars3.barsBefore === 5, `barsBefore should be 5, actual=${bars3.barsBefore}`);
	console.assert(bars3.barsAfter === -5, `barsAfter should be -5, actual=${bars3.barsAfter}`);

	var bars4 = series.barsInLogicalRange({ from: 4, to: 5 });
	console.assert(bars4 !== null, 'Bars shouldn\'t be null');

	console.assert(bars4.from === data[4].time, `from date should the time of 4th data item, expected=${data[4].time}, actual=${bars4.from}`);
	console.assert(bars4.to === data[5].time, `to date should the time of 5th data item, expected=${data[5].time}, actual=${bars4.to}`);
	console.assert(bars4.barsBefore === 4, `barsBefore should be 4, actual=${bars4.barsBefore}`);
	console.assert(bars4.barsAfter === 4, `barsAfter should be 4, actual=${bars4.barsAfter}`);

	var bars5 = series.barsInLogicalRange({ from: -5, to: 14 });
	console.assert(bars5 !== null, 'Bars shouldn\'t be null');

	console.assert(bars5.from === data[0].time, `from date should be the first data item's time, expected=${data[0].time}, actual=${bars5.from}`);
	console.assert(bars5.to === data[9].time, `to date should be the time of the last data item, expected=${data[9].time}, actual=${bars5.to}`);
	console.assert(bars5.barsBefore === -5, `barsBefore should be -5, actual=${bars5.barsBefore}`);
	console.assert(bars5.barsAfter === -5, `barsAfter should be -5, actual=${bars5.barsAfter}`);

	var emptySeries = chart.addLineSeries();
	console.assert(emptySeries.barsInLogicalRange({ from: 0, to: 3 }) === null, 'Bars should be null if series is empty');

	console.assert(series.barsInLogicalRange(null) === null, 'Bars should be null if range is null');
}
