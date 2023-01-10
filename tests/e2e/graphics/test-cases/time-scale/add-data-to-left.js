function generateData(count, from, empty = false) {
	const res = [];
	const time = new Date(from);
	for (let i = 0; i < count; ++i) {
		if (!empty) {
			res.push({
				time: time.getTime() / 1000,
				value: i,
			});
		} else {
			res.push({
				time: time.getTime() / 1000,
			});
		}

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function whenRangeChanged(timeScale) {
	return new Promise(resolve =>
		timeScale.subscribeVisibleLogicalRangeChange(() =>
			setTimeout(() => {
				resolve();
			}, 200)
		)
	);
}

let data = [];
let chart = null;
let areaSeries = null;
const ONE_DAY_IN_SEC = 24 * 60 * 60;

function createChart(container) {
	chart = window.chart = LightweightCharts.createChart(container);
}

function createOneSeries() {
	areaSeries = chart.addAreaSeries();
	data = generateData(61, Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	areaSeries.setData(data);
}

async function shiftTimeScale({ from, to }) {
	const timeScale = chart.timeScale();
	timeScale.setVisibleLogicalRange({ from, to });
	await whenRangeChanged(timeScale);
}

function addDataToLeft() {
	data = [...generateData(3, (data[0].time - ONE_DAY_IN_SEC * 3) * 1000), ...data];
	areaSeries.setData(data);
}

function getRanges() {
	return {
		logicalRange: chart.timeScale().getVisibleLogicalRange(),
		timeRange: chart.timeScale().getVisibleRange(),
	};
}

function checkVisibleRange(
	{ timeRange: oldTimeRange, logicalRange: oldLogicalRange },
	what
) {
	const {
		timeRange: newTimeRange,
		logicalRange: newLogicalRange,
	} = getRanges();

	if (what === 'time range shouldn`t be changed') {
		console.assert(
			newTimeRange.from === oldTimeRange.from,
			`from time should be the same as previously set, expected=${oldTimeRange.from}, actual=${newTimeRange.from}`
		);
		console.assert(
			newTimeRange.to === oldTimeRange.to,
			`to time should be the same as previously set, expected=${oldTimeRange.to}, actual=${newTimeRange.to}`
		);
		return;
	}

	if (what === "time range: {from} should shift to left and {to} shouldn't changed") {
		console.assert(
			newTimeRange.from === oldTimeRange.from - 3 * ONE_DAY_IN_SEC,
			`from should shift to left by 3 days, expected=${oldTimeRange.from - 3 * ONE_DAY_IN_SEC}, actual=${newTimeRange.from}`
		);
		console.assert(
			newTimeRange.to === oldTimeRange.to,
			`to time should be the same as previously set, expected=${oldTimeRange.to}, actual=${newTimeRange.to}`
		);
		return;
	}

	if (what === 'logical range shouldn`t be changed') {
		console.assert(
			newLogicalRange.from === oldLogicalRange.from,
			`from index should be changed, expected=${oldLogicalRange.from}, actual=${newLogicalRange.from}`
		);
		console.assert(
			newLogicalRange.to === oldLogicalRange.to,
			`to index should be changed, expected=${oldLogicalRange.to}, actual=${newLogicalRange.to}`
		);
		return;
	}

	if (what === 'time range should be shift to right') {
		console.assert(
			newTimeRange.from === oldTimeRange.from + 3 * ONE_DAY_IN_SEC,
			`from time should be shift by 3 days, expected=${
				oldTimeRange.from + 3 * ONE_DAY_IN_SEC
			}, actual=${newTimeRange.from}`
		);
		console.assert(
			newTimeRange.to === oldTimeRange.to + 3 * ONE_DAY_IN_SEC,
			`to time should be shift by 3 days, expected=${
				oldTimeRange.to + 3 * ONE_DAY_IN_SEC
			}, actual=${newTimeRange.to}`
		);
		return;
	}

	if (what === 'logical range should be shift to right') {
		console.assert(
			newLogicalRange.from === oldLogicalRange.from + 3,
			`from index should be changed, expected=${
				oldLogicalRange.from + 3
			}, actual=${newLogicalRange.from}`
		);
		console.assert(
			newLogicalRange.to === oldLogicalRange.to + 3,
			`to index should be changed, expected=${oldLogicalRange.to + 3}, actual=${
				newLogicalRange.to
			}`
		);
		return;
	}

	throw new Error('unhadled check');
}

async function runTestCase(container) {
	createChart(container);
	createOneSeries();

	// shift timescale (right end of line out of chart, left end of line is visible)
	// --------
	//      /\
	//     /  \
	// --------
	await shiftTimeScale({ from: -10, to: 20 });
	let ranges = getRanges();
	// add data to left
	addDataToLeft();
	// check viewport position
	checkVisibleRange(ranges, "time range: {from} should shift to left and {to} shouldn't changed");
	checkVisibleRange(ranges, 'logical range should be shift to right');

	// shift timescale (right end of line is visible, left end of line out of chart)
	// ---------
	//  /\
	// /  \
	// ---------
	await shiftTimeScale({ from: 50, to: 80 });
	ranges = getRanges();
	// add data to right
	addDataToLeft();
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');

	// shift timescale (right end of line is visible, left end of line is visible)
	// ------------
	//      /\  /
	//     /  \/
	// ------------
	await shiftTimeScale({ from: -10, to: 100 });
	ranges = getRanges();
	// add data to right
	addDataToLeft();
	// check viewport position
	checkVisibleRange(ranges, "time range: {from} should shift to left and {to} shouldn't changed");
	checkVisibleRange(ranges, 'logical range should be shift to right');

	// shift timescale (right end of line out of chart, left end of line out of chart)
	// --------
	//  /\  /\
	// /  \/  \
	// --------
	await shiftTimeScale({ from: 3, to: 20 });
	ranges = getRanges();
	// add data to right
	addDataToLeft();
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');
}
