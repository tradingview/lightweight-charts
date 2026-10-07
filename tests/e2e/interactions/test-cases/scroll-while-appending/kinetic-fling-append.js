// Bars appended while a kinetic fling is running must not make the fling jump.
//
// The chart widget applies animation.getPosition(time) as the right offset on every frame. If the
// running animation isn't shifted by the append, the next frame undoes the compensation.
//
// Fails without the PR: the first frame after the append moves the view by about +50 bars.
// Passes at PR #2157 4571850b82.

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
let chartContainer = null;
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

let pointer = { x: 0, y: 0 };

// The mouse event handler ignores mouse events it thinks were emulated from touch. Without
// sourceCapabilities it decides by comparing event.timeStamp with the last touch time (0) plus a
// delay, so events sent shortly after page load would be dropped. Stating the source explicitly
// makes that check deterministic.
const mouseSourceCapabilities = typeof window.InputDeviceCapabilities === 'function'
	? new window.InputDeviceCapabilities({ firesTouchEvents: false })
	: undefined;

function dispatchMouse(type, target) {
	target.dispatchEvent(new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		view: window,
		clientX: pointer.x,
		clientY: pointer.y,
		screenX: pointer.x,
		screenY: pointer.y,
		button: 0,
		buttons: type === 'mouseup' ? 0 : 1,
		sourceCapabilities: mouseSourceCapabilities,
	}));
}

// presses the left button on the first pane's top canvas (the pane widget's mouse event target),
// 30% from its left edge
function pressMouse() {
	const paneCanvases = chartContainer.querySelectorAll('tr:nth-of-type(1) td:nth-of-type(2) canvas');
	const paneTopCanvas = paneCanvases[paneCanvases.length - 1];
	const rect = paneTopCanvas.getBoundingClientRect();
	pointer = { x: rect.left + rect.width * 0.3, y: rect.top + rect.height * 0.5 };
	dispatchMouse('mousedown', paneTopCanvas);
}

// the library tracks moves and the release on documentElement once the button is down
function moveMouse(dx, ms = 16) {
	advance(ms);
	pointer.x += dx;
	dispatchMouse('mousemove', document.documentElement);
}

function releaseMouse(ms = 0) {
	advance(ms);
	dispatchMouse('mouseup', document.documentElement);
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
	chartContainer = container;
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
	return createTestChart(container, { kineticScroll: { mouse: true } });
}

function afterInitialInteractions() {
	runScenario(() => {
		pressMouse();
		// a fast drag into history (20px every 16ms), released while still moving
		for (let i = 0; i < 10; i++) {
			moveMouse(20);
		}
		releaseMouse(5);

		const edges = [rightEdge()];
		for (let i = 0; i < 10; i++) {
			runFrame();
			edges.push(rightEdge());
		}
		const lastStep = edges[10] - edges[9];
		if (Math.abs(lastStep) < 0.1) {
			throw new Error(`precondition: a kinetic fling should be running, but the last frame moved ${lastStep.toFixed(3)} bars`);
		}

		appendBars(50);
		expectClose(rightEdge(), edges[10], 0.5, 'view right after 50 bars are appended mid-fling');

		// the fling decelerates smoothly, so the next frame moves by about the same amount as the previous one
		runFrame();
		expectClose(rightEdge() - edges[10], lastStep, 1, 'movement in the first frame after the append');

		for (let i = 0; i < 300; i++) {
			runFrame();
		}
	});
	return Promise.resolve();
}
