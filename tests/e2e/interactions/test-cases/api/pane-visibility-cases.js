function simpleData(base) {
	return [
		{ time: '2020-01-01', value: base },
		{ time: '2020-01-02', value: base + 4 },
		{ time: '2020-01-03', value: base + 2 },
	];
}

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function check(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function createTestChart(container, bases, options = {}) {
	const chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false }, ...options });
	const series = bases.map((base, paneIndex) => {
		const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {}, paneIndex);
		lineSeries.setData(simpleData(base));
		return lineSeries;
	});
	return { chart, series };
}

function countDrawCalls(pane) {
	const counter = { calls: 0 };
	for (const canvas of pane.getHTMLElement().querySelectorAll('canvas')) {
		const ctx = canvas.getContext('2d');
		for (const method of ['clearRect', 'fillRect']) {
			const original = ctx[method].bind(ctx);
			ctx[method] = (...args) => {
				counter.calls++;
				original(...args);
			};
		}
	}
	return { count: () => counter.calls, reset: () => { counter.calls = 0; } };
}

async function logoFollowsLastVisiblePane(container) {
	const { chart } = createTestChart(container, [10, 20], { layout: { attributionLogo: true } });
	await nextFrame();
	const panes = chart.panes();
	const logo = () => chart.chartElement().querySelector('#tv-attr-logo');

	panes[1].setVisible(false);
	await nextFrame();
	check(panes[0].getHTMLElement().contains(logo()), 'the logo should move to the last visible pane');

	panes[1].setVisible(true);
	await nextFrame();
	check(panes[1].getHTMLElement().contains(logo()), 'the logo should return to the last pane');
	chart.remove();
}

async function priceAxisWidthIgnoresHiddenFirstPane(container) {
	const { chart } = createTestChart(container, [1000000, 10]);
	await nextFrame();

	chart.panes()[0].setVisible(false);
	await nextFrame();
	const renderedWidth = chart.panes()[1].getHTMLElement().lastElementChild.getBoundingClientRect().width;
	check(chart.priceScale('right').width() === renderedWidth, `the price axis width should be the rendered ${renderedWidth}, got ${chart.priceScale('right').width()}`);
	chart.remove();
}

async function lastVisiblePaneStays(container) {
	const { chart, series } = createTestChart(container, [10, 20]);
	await nextFrame();
	const panes = chart.panes();

	panes[0].setVisible(false);
	panes[1].setVisible(false);
	check(panes[1].visible(), 'the last visible pane cannot be hidden');
	chart.removePane(1);
	check(chart.panes().length === 2, 'the last visible pane cannot be removed');
	chart.removeSeries(series[1]);
	check(chart.panes().length === 2, 'removing its last series keeps the last visible pane');
	chart.remove();
}

async function hiddenPaneSizeFollowsResize(container) {
	const { chart } = createTestChart(container, [10, 20]);
	await nextFrame();
	chart.panes()[1].setVisible(false);
	await nextFrame();

	const rect = chart.chartElement().getBoundingClientRect();
	chart.resize(rect.width - 50, rect.height);
	await nextFrame();
	check(chart.paneSize(1).width === chart.paneSize(0).width, 'a hidden pane width should follow a resize');
	chart.remove();
}

async function hiddenPaneIsNotPaintedUntilShown(container) {
	const { chart, series } = createTestChart(container, [10, 20]);
	await nextFrame();
	const panes = chart.panes();
	const hiddenDrawCalls = countDrawCalls(panes[1]);
	const visibleDrawCalls = countDrawCalls(panes[0]);

	panes[1].setVisible(false);
	await nextFrame();
	hiddenDrawCalls.reset();
	visibleDrawCalls.reset();
	series[0].setData(simpleData(30));
	series[1].setData(simpleData(40));
	await nextFrame();
	check(visibleDrawCalls.count() > 0, 'the visible pane should be painted');
	check(hiddenDrawCalls.count() === 0, `a hidden pane should not be painted, got ${hiddenDrawCalls.count()} draw calls`);

	panes[1].setVisible(true);
	chart.takeScreenshot();
	check(hiddenDrawCalls.count() > 0, 'showing a pane should paint it before a screenshot');
	chart.remove();
}

async function paneSwappedIntoViewIsPainted(container) {
	const { chart } = createTestChart(container, [10, 20, 30]);
	await nextFrame();
	chart.panes()[1].setVisible(false);
	await nextFrame();

	chart.swapPanes(1, 2);
	const drawCalls = countDrawCalls(chart.panes()[1]);
	await nextFrame();
	check(chart.panes()[1].visible() && !chart.panes()[2].visible(), 'swapping should move the hidden pane');
	check(drawCalls.count() > 0, 'a pane swapped into a hidden pane\'s place should be painted');
	chart.remove();
}

function dragSeparator(chart, separatorIndex, deltaY) {
	const handle = Array.from(chart.chartElement().querySelectorAll('div'))
		.filter(div => div.style.cursor === 'row-resize' && div.style.zIndex === '50')[separatorIndex];
	const rect = handle.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;
	const sourceCapabilities = new window.InputDeviceCapabilities({ firesTouchEvents: false });
	const mouse = (type, clientY) => new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'mouseup' ? 0 : 1, clientX: x, clientY, sourceCapabilities });
	handle.dispatchEvent(mouse('mousedown', y));
	document.documentElement.dispatchEvent(mouse('mousemove', y + deltaY));
	document.documentElement.dispatchEvent(mouse('mouseup', y + deltaY));
}

async function separatorPressNextToJustHiddenPaneIsIgnored(container) {
	const { chart } = createTestChart(container, [10, 20, 30]);
	await nextFrame();
	const panes = chart.panes();
	const stretchFactors = () => panes.map(pane => pane.getStretchFactor()).join();
	const initialStretchFactors = stretchFactors();
	const errors = [];
	const onError = event => errors.push(event.message);
	window.addEventListener('error', onError);

	// A hidden pane's separator stays displayed until the next layout, so these presses still reach it.
	panes[1].setVisible(false);
	dragSeparator(chart, 0, 40);
	check(stretchFactors() === initialStretchFactors, `a press with the pane below hidden should be ignored, got ${stretchFactors()}`);

	panes[1].setVisible(true);
	await nextFrame();
	panes[0].setVisible(false);
	dragSeparator(chart, 0, 40);
	window.removeEventListener('error', onError);
	check(errors.length === 0, `a press with no visible pane above should be ignored, got ${errors.join()}`);
	chart.remove();
}

async function crosshairOnHiddenPaneIsCleared(container) {
	const { chart, series } = createTestChart(container, [10, 20]);
	await nextFrame();
	const paneCell = chart.panes()[1].getHTMLElement().children[1].getBoundingClientRect();
	const clientX = paneCell.left + chart.timeScale().timeToCoordinate('2020-01-02');
	const clientY = paneCell.top + series[1].priceToCoordinate(24);
	const sourceCapabilities = new window.InputDeviceCapabilities({ firesTouchEvents: false });
	let lastMove = null;
	chart.subscribeCrosshairMove(param => { lastMove = param; });
	const target = document.elementFromPoint(clientX, clientY);
	for (const type of ['mouseenter', 'mousemove']) {
		target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY, sourceCapabilities }));
	}
	check(lastMove?.paneIndex === 1 && lastMove.hoveredSeries === series[1], 'the crosshair should be on the line in pane 1');

	chart.panes()[1].setVisible(false);
	check(lastMove.point === undefined && lastMove.hoveredSeries === undefined, 'hiding the crosshair\'s pane should clear the crosshair and hovered series');
	chart.remove();
}

async function beforeInteractions(container) {
	await logoFollowsLastVisiblePane(container);
	await priceAxisWidthIgnoresHiddenFirstPane(container);
	await lastVisiblePaneStays(container);
	await hiddenPaneSizeFollowsResize(container);
	await hiddenPaneIsNotPaintedUntilShown(container);
	await paneSwappedIntoViewIsPainted(container);
	await separatorPressNextToJustHiddenPaneIsIgnored(container);
	await crosshairOnHiddenPaneIsCleared(container);
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
