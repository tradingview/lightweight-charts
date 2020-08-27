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

	// left empty space in visible range
	// --------
	//      /\
	//     /  \
	// --------
	data = generateData(61, Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	areaSeries.setData(data);

	const timeScale = chart.timeScale();
	const startRange = timeScale.getVisibleLogicalRange();
	const startTimeRange = timeScale.getVisibleRange();

	// add 3 bars to right
	data = [...data, ...generateData(3, (data[data.length - 1].time + 24 * 60 * 60) * 1000)];
	areaSeries.setData(data);

	// visible logical range should shift to right
	let newRange = timeScale.getVisibleLogicalRange();
	console.assert(newRange.from === startRange.from + 3, `from index should shift to right, expected=${startRange.from + 3}, actual=${newRange.from}`);
	console.assert(newRange.to === startRange.to + 3, `to index should shift to right, expected=${startRange.to + 3}, actual=${newRange.to}`);
	let newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from === startTimeRange.from, `from time shouldn't be the same as previously set, expected=${startTimeRange.from}, actual=${newTimeRange.from}`);
	console.assert(newTimeRange.to !== startTimeRange.to, `to time shouldn't be the same as previously set, expected=${newTimeRange.to}, actual=${startTimeRange.to}`);

	// fill visible range
	// --------
	//  /\  /\
	// /  \/  \
	// --------
	timeScale.setVisibleLogicalRange({ from: 3, to: 20 });
	await whenRangeChanged(timeScale);

	// visible logical range should be changed
	newRange = timeScale.getVisibleLogicalRange();
	console.assert(newRange.from === 3, `from index should be changed, expected=${3}, actual=${newRange.from}`);
	console.assert(newRange.to === 20, `to index should be changed, expected=${20}, actual=${newRange.to}`);

	let timeRangeBeforeSetData = timeScale.getVisibleRange();

	// add 3 bars to right
	data = [...data, ...generateData(3, (data[data.length - 1].time + 24 * 60 * 60) * 1000)];
	areaSeries.setData(data);

	// visible logical range shouldn't be changed
	newRange = timeScale.getVisibleLogicalRange();
	console.assert(newRange.from === 3, `from index should be changed, expected=${3}, actual=${newRange.from}`);
	console.assert(newRange.to === 20, `to index should be changed, expected=${20}, actual=${newRange.to}`);
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

	// add 3 bars to right
	data = [...data, ...generateData(3, (data[data.length - 1].time + 24 * 60 * 60) * 1000)];
	areaSeries.setData(data);

	newRange = timeScale.getVisibleLogicalRange();
	console.assert(newRange.from === 53, `from index should be changed, expected=${53}, actual=${newRange.from}`);
	console.assert(newRange.to === 83, `to index should be changed, expected=${80}, actual=${newRange.to}`);
	// visible time range should be changed
	newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from === timeRangeBeforeSetData.from + 3 * (24 * 60 * 60), `from time should be shift by 3 days, expected=${timeRangeBeforeSetData.from + 3 * (24 * 60 * 60)}, actual=${newTimeRange.from}`);
	console.assert(newTimeRange.to === timeRangeBeforeSetData.to + 3 * (24 * 60 * 60), `to time should be shift by 3 days, expected=${timeRangeBeforeSetData.to + 3 * (24 * 60 * 60)}, actual=${newTimeRange.to}`);
}
