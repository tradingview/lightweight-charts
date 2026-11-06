// Bars appended during an animated scroll (scrollToRealTime, or scrollToPosition(x, true)) must not
// make the view jump. The animation should still finish at the newest bar.
//
// With 50 bars appended about halfway through the 400ms animation, the target (the newest bar) moves
// 50 bars further away, so the remaining frames have to move faster. That is a speed-up, not a
// jump. The test allows the first frame after the append to move up to twice the previous frame's
// distance, then checks that the view keeps moving toward the newest bar until the animation ends.
//
// It deliberately doesn't assert the exact final position. Separately from this PR, the chart widget
// never applies an animation's final position (it only applies frames where finished(time) is false),
// so scrollToRealTime() from -200 stops at about -8 with 16ms frames even without any append.
//
// Fails without the PR (the first frame jumps about 50 bars) and at PR #2157 4571850b82 (about
// 24 bars): shifting the animation's source moves its whole interpolation line, so only part of the
// append is compensated.

// ---- Deterministic harness (identical in every scroll-while-appending case) ----
// Kinetic scrolling and time scale animations read time only from performance.now() and from the
// requestAnimationFrame callback argument. Both are replaced with a manual clock, and the pointer is
// driven with synthetic mouse events, so every move, release and animation frame happens at an exact
// scripted time. The result doesn't depend on machine speed or real timers.
const BAR_SPACING = 6;
const INITIAL_BARS = 500;
const DAY = 24 * 60 * 60;
const START_TIME = Date.UTC(2023, 0, 1) / 1000;

let chart = null;
let series = null;
let barCount = 0;
const seriesData = [];

let fakeTime = 0;
let rafQueue = [];
let nextRafId = 1;
const realRequestAnimationFrame = window.requestAnimationFrame.bind(window);
const realCancelAnimationFrame = window.cancelAnimationFrame.bind(window);

function installFakeClock() {
	fakeTime = performance.now();
	performance.now = () => fakeTime;
	window.requestAnimationFrame = callback => {
		const id = nextRafId++;
		rafQueue.push({ id, callback });
		return id;
	};
	window.cancelAnimationFrame = id => {
		rafQueue = rafQueue.filter(item => item.id !== id);
	};
}

function restoreClock() {
	delete performance.now;
	window.requestAnimationFrame = realRequestAnimationFrame;
	window.cancelAnimationFrame = realCancelAnimationFrame;
	// hand pending frames back to the real scheduler so the chart keeps rendering
	const pending = rafQueue;
	rafQueue = [];
	for (const item of pending) {
		realRequestAnimationFrame(item.callback);
	}
}

function advance(ms) {
	fakeTime += ms;
}

function runFrame(ms = 16) {
	advance(ms);
	const callbacks = rafQueue;
	rafQueue = [];
	for (const item of callbacks) {
		item.callback(fakeTime);
	}
}

function nextBar() {
	const bar = { time: START_TIME + barCount * DAY, value: 100 + 10 * Math.sin(barCount / 10) };
	barCount++;
	seriesData.push(bar);
	return bar;
}

// appends bars one at a time with series.update(), the way a live feed (and the #1521 repro) does
function appendBars(count) {
	for (let i = 0; i < count; i++) {
		series.update(nextBar());
	}
}

// Logical indices of existing bars don't change when bars are appended to the right, so the
// right edge of the visible logical range only moves when the view itself moves.
function rightEdge() {
	return chart.timeScale().getVisibleLogicalRange().to;
}

function expectClose(actual, expected, tolerance, what) {
	if (!(Math.abs(actual - expected) <= tolerance)) {
		throw new Error(`${what}: expected ${expected.toFixed(2)} ± ${tolerance}, got ${actual.toFixed(2)} (off by ${(actual - expected).toFixed(2)} bars)`);
	}
}

// The fake clock is installed before the chart is created so that every frame the chart requests
// goes through the manual queue. If a real frame were already pending, later invalidations would merge
// into it and the scripted frames would never draw.
function createTestChart(container, options = {}) {
	installFakeClock();
	chart = LightweightCharts.createChart(container, {
		...options,
		timeScale: { barSpacing: BAR_SPACING, ...options.timeScale },
	});
	series = chart.addSeries(LightweightCharts.LineSeries);
	for (let i = 0; i < INITIAL_BARS; i++) {
		nextBar();
	}
	series.setData(seriesData.slice());
	runFrame();
	runFrame();
	return Promise.resolve();
}

function runScenario(scenario) {
	try {
		scenario();
	} finally {
		restoreClock();
	}
}

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function afterFinalInteractions() {
	return Promise.resolve();
}
// ---- end of harness ----

function beforeInteractions(container) {
	return createTestChart(container);
}

function afterInitialInteractions() {
	runScenario(() => {
		const timeScale = chart.timeScale();
		timeScale.scrollToPosition(-200, false);
		runFrame();
		expectClose(timeScale.scrollPosition(), -200, 0.01, 'precondition: scrolled 200 bars into history');

		// 400ms animation back to the newest bar; run 12 frames (192ms, about 48%)
		timeScale.scrollToRealTime();
		const edges = [rightEdge()];
		for (let i = 0; i < 12; i++) {
			runFrame();
			edges.push(rightEdge());
		}
		const lastStep = edges[12] - edges[11];
		if (lastStep < 1) {
			throw new Error(`precondition: the scroll animation should be running, but the last frame moved ${lastStep.toFixed(3)} bars`);
		}

		appendBars(50);
		expectClose(rightEdge(), edges[12], 0.5, 'view right after 50 bars are appended mid-animation');

		runFrame();
		const step = rightEdge() - edges[12];
		if (step > 2 * lastStep) {
			throw new Error(`first frame after the append moved ${step.toFixed(2)} bars; the previous frame moved ${lastStep.toFixed(2)} bars, so the view jumped`);
		}

		let previousEdge = rightEdge();
		for (let i = 0; i < 30; i++) {
			runFrame();
			const edge = rightEdge();
			if (edge < previousEdge - 0.01) {
				throw new Error(`frame ${i + 2} after the append moved ${(edge - previousEdge).toFixed(2)} bars, away from the newest bar`);
			}
			previousEdge = edge;
		}
		if (!(rightEdge() > edges[12] + step)) {
			throw new Error(`the animation stopped moving toward the newest bar after the append (right edge ${rightEdge().toFixed(2)})`);
		}
	});
	return Promise.resolve();
}
