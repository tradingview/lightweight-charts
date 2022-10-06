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

let data1 = [];
let data2 = [];
let chart = null;
let areaSeries1 = null;
let areaSeries2 = null;
const ONE_DAY_IN_SEC = 24 * 60 * 60;

function createChart(container) {
	chart = window.chart = LightweightCharts.createChart(container);
}

function createFirstSeries() {
	areaSeries1 = chart.addAreaSeries();
	data1 = generateData(61, Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	areaSeries1.setData(data1);
}

function createSecondSeries() {
	areaSeries2 = chart.addAreaSeries({
		lineColor: 'red',
	});
	data2 = [...generateData(20, Date.UTC(2022, 0, 1, 0, 0, 0, 0), true), ...generateData(61, Date.UTC(2022, 1, 1, 0, 0, 0, 0))];
	areaSeries2.setData(data2);
}

async function shiftTimeScale({ from, to }) {
	const timeScale = chart.timeScale();
	timeScale.setVisibleLogicalRange({ from, to });
	await whenRangeChanged(timeScale);
}

function addDataToLeft(data, areaSeries) {
	data.unshift(...generateData(3, (data[0].time - ONE_DAY_IN_SEC * 3) * 1000));
	areaSeries.setData(data);
}

function addWhitespaceToLeft(data, areaSeries) {
	data.unshift(...generateData(3, (data[0].time - ONE_DAY_IN_SEC * 3) * 1000, true));
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
	// createChart
	// create one series
	createChart(container);
	createFirstSeries();
	createSecondSeries();

	// shift timescale (right end of line out of chart, left end of line is visible)
	// --------
	//      /\
	//     /  \
	// --------
	await shiftTimeScale({ from: -10, to: 20 });
	let ranges = getRanges();
	// add data to right
	addDataToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, "time range: {from} should shift to left and {to} shouldn't changed");
	checkVisibleRange(ranges, 'logical range should be shift to right');

	// shift timescale (right end of line is visible, left end of line out of chart)
	// ---------
	//  /\
	// /  \
	// ---------
	await shiftTimeScale({ from: 50, to: 200 });
	ranges = getRanges();
	// add data to right
	addDataToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');
	// add data whitespace to right
	ranges = getRanges();
	addWhitespaceToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');
	// fix range
	addDataToLeft(data1, areaSeries1);

	// shift timescale (right end of line is visible, left end of line is visible)
	// ------------
	//      /\  /
	//     /  \/
	// ------------
	await shiftTimeScale({ from: -10, to: 200 });
	ranges = getRanges();
	// add data to right
	addDataToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, "time range: {from} should shift to left and {to} shouldn't changed");
	checkVisibleRange(ranges, 'logical range should be shift to right');

	// shift timescale (right end of line out of chart, left end of line out of chart)
	// --------
	//  /\  /\
	// /  \/  \
	// --------
	await shiftTimeScale({ from: 3, to: 100 });
	ranges = getRanges();
	// add data to right
	addDataToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');
	// add data whitespace to right
	ranges = getRanges();
	addWhitespaceToLeft(data1, areaSeries1);
	// check viewport position
	checkVisibleRange(ranges, 'time range shouldn`t be changed');
	checkVisibleRange(ranges, 'logical range should be shift to right');
	// fix range
	addDataToLeft(data1, areaSeries1);
}
