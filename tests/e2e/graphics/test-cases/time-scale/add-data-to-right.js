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
const ONE_DAY_IN_SEC = 24 * 60 * 60;

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

	// add 3 bars to right
	data = [...data, ...generateData(3, (data[data.length - 1].time + ONE_DAY_IN_SEC) * 1000)];
	areaSeries.setData(data);

	// visible logical range should shift to right
	let newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === startRange.from + 3, `from index should shift to right, expected=${startRange.from + 3}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === startRange.to + 3, `to index should shift to right, expected=${startRange.to + 3}, actual=${newLogicalRange.to}`);
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
	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 3, `from index should be changed, expected=${3}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 20, `to index should be changed, expected=${20}, actual=${newLogicalRange.to}`);

	let timeRangeBeforeSetData = timeScale.getVisibleRange();

	// add 3 bars to right
	data = [...data, ...generateData(3, (data[data.length - 1].time + ONE_DAY_IN_SEC) * 1000)];
	areaSeries.setData(data);

	// visible logical range shouldn't be changed
	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 3, `from index should be changed, expected=${3}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 20, `to index should be changed, expected=${20}, actual=${newLogicalRange.to}`);
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
	data = [...data, ...generateData(3, (data[data.length - 1].time + ONE_DAY_IN_SEC) * 1000)];
	areaSeries.setData(data);

	newLogicalRange = timeScale.getVisibleLogicalRange();
	console.assert(newLogicalRange.from === 53, `from index should be changed, expected=${53}, actual=${newLogicalRange.from}`);
	console.assert(newLogicalRange.to === 83, `to index should be changed, expected=${80}, actual=${newLogicalRange.to}`);
	// visible time range should be changed
	newTimeRange = timeScale.getVisibleRange();
	console.assert(newTimeRange.from === timeRangeBeforeSetData.from + 3 * (ONE_DAY_IN_SEC), `from time should be shift by 3 days, expected=${timeRangeBeforeSetData.from + 3 * (ONE_DAY_IN_SEC)}, actual=${newTimeRange.from}`);
	console.assert(newTimeRange.to === timeRangeBeforeSetData.to + 3 * (ONE_DAY_IN_SEC), `to time should be shift by 3 days, expected=${timeRangeBeforeSetData.to + 3 * (ONE_DAY_IN_SEC)}, actual=${newTimeRange.to}`);
}
