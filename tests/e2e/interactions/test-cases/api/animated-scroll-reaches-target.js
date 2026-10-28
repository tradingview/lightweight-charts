// Regression test for https://tradingview-air.atlassian.net/browse/CLL-422.
//
// The time scale animation used to apply nothing on the frame where it became
// finished, so `scrollToRealTime()` and `scrollToPosition(x, true)` stopped a frame
// short of their target.
//
// The test runs both animated scrolls with the real `requestAnimationFrame` timing
// and passes if the view ends up exactly at the target position.

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 100 + 10 * Math.sin(i / 10),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

let timeScale = null;

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		timeScale: { barSpacing: 6 },
	});

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());

	timeScale = chart.timeScale();

	return new Promise(resolve => requestAnimationFrame(resolve));
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function checkScrollPosition(expected, description) {
	const actual = timeScale.scrollPosition();
	if (actual === null || Math.abs(actual - expected) > 1e-9) {
		throw new Error(`Expected scrollPosition to be ${expected} after ${description}, but got ${actual}.`);
	}
}

// The runner awaits only this hook, so the animations are run and checked here.
async function afterInitialInteractions() {
	// 400ms animation to the default right offset
	timeScale.scrollToPosition(-200, false);
	await wait(100);
	timeScale.scrollToRealTime();
	await wait(1000);
	checkScrollPosition(0, 'scrollToRealTime()');

	// 1000ms animation to the given position
	timeScale.scrollToPosition(-50, true);
	await wait(1500);
	checkScrollPosition(-50, 'scrollToPosition(-50, true)');
}

function afterFinalInteractions() {
	return Promise.resolve();
}
