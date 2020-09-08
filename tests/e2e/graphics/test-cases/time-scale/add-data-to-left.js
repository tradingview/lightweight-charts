function generateData(count, from) {
	const res = [];
	const time = new Date(from);
	for (let i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function whenRangeChanged(timeScale) {
	return new Promise(resolve => timeScale.subscribeVisibleLogicalRangeChange(() => resolve()));
}

let data = [];
let chart = null;
let areaSeries = null;

async function runTestCase(container) {
	chart = LightweightCharts.createChart(
		container
	);

	areaSeries = chart.addAreaSeries();
	data = generateData(61, Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	areaSeries.setData(data);
	const timeScale = chart.timeScale();

	// left empty space in visible range
	// --------
	//      /\
	//     /  \
	// --------
	timeScale.setVisibleLogicalRange({ from: -10, to: 20 });
	await whenRangeChanged(timeScale);

	const startRange = timeScale.getVisibleLogicalRange();
	const startTimeRange = timeScale.getVisibleRange();

	// add 3 bars to left
	data = [...generateData(3, Date.UTC(2017, 11, 29, 0, 0, 0, 0)), ...data];
	areaSeries.setData(data);

	// visible logical range should shift to right
	let newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === startRange.from + 3, `from index should shift to right, expected=${startRange.from + 3}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === startRange.to + 3, `to index should shift to right, expected=${startRange.to + 3}, actual=${newLogicalRange.to}`);
	let newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from !== startTimeRange.from, `from time shouldn't be the same as previously set, expected=${newTimeRange.from}, actual=${startTimeRange.from}`);
	console.assert(newTimeRange.to === startTimeRange.to, `from time should be the same as previously set, expected=${startTimeRange.to}, actual=${newTimeRange.to}`);

	// fill visible range
	// --------
	//  /\  /\
	// /  \/  \
	// --------
	timeScale.setVisibleLogicalRange({ from: 3, to: 20 });
	await whenRangeChanged(timeScale);

	// visible logical range should be changed
	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 3, `from index should be changed, expected=${3}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 20, `to index should be changed, expected=${20}, actual=${newLogicalRange.to}`);

	let timeRangeBeforeSetData = timeScale.getVisibleRange();

	// add 3 bars to left
	data = [...generateData(3, Date.UTC(2017, 11, 26, 0, 0, 0, 0)), ...data];
	areaSeries.setData(data);

	// visible logical range should shift to right
	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 6, `from index should be changed, expected=${6}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 23, `to index should be changed, expected=${23}, actual=${newLogicalRange.to}`);
	// visible time range shouldn't be changed
	newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from === timeRangeBeforeSetData.from, `from time should be the same as previously set, expected=${timeRangeBeforeSetData.from}, actual=${newTimeRange.from}`);
	console.assert(newTimeRange.to === timeRangeBeforeSetData.to, `from time should be the same as previously set, expected=${timeRangeBeforeSetData.to}, actual=${newTimeRange.to}`);

	// right empty space in visible range
	// ---------
	//  /\
	// /  \
	// ---------
	timeScale.setVisibleLogicalRange({ from: 50, to: 80 });
	await whenRangeChanged(timeScale);

	timeRangeBeforeSetData = timeScale.getVisibleRange();

	// add 3 bars to left
	data = [...generateData(3, Date.UTC(2017, 11, 23, 0, 0, 0, 0)), ...data];
	areaSeries.setData(data);

	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 53, `from index should be changed, expected=${53}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 83, `to index should be changed, expected=${80}, actual=${newLogicalRange.to}`);
	// visible time range shouldn't be changed
	newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from === timeRangeBeforeSetData.from, `from time should be the same as previously set, expected=${timeRangeBeforeSetData.from}, actual=${newTimeRange.from}`);
	console.assert(newTimeRange.to === timeRangeBeforeSetData.to, `from time should be the same as previously set, expected=${timeRangeBeforeSetData.to}, actual=${newTimeRange.to}`);
}
