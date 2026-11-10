function simpleData(base) {
	return [
		{ time: '2020-01-01', value: base },
		{ time: '2020-01-02', value: base + 4 },
		{ time: '2020-01-03', value: base + 2 },
	];
}

let chart = null;

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

function visibleSeparatorCount() {
	return Array.from(chart.chartElement().querySelectorAll('table > tr'))
		.filter(tr => tr.getBoundingClientRect().height === 1 && getComputedStyle(tr).display !== 'none')
		.length;
}

function timeAxisTop() {
	const rows = chart.chartElement().querySelectorAll('table > tr');
	return rows[rows.length - 1].getBoundingClientRect().top;
}

async function dragVisibleSeparator(deltaY) {
	const row = Array.from(chart.chartElement().querySelectorAll('table > tr'))
		.find(tr => tr.getBoundingClientRect().height === 1 && getComputedStyle(tr).display !== 'none');
	const handle = Array.from(row.querySelectorAll('div')).find(div => div.style.cursor === 'row-resize' && div.style.zIndex === '50');
	const rect = handle.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;
	const sourceCapabilities = new window.InputDeviceCapabilities({ firesTouchEvents: false });
	const mouse = (type, clientY) => new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'mouseup' ? 0 : 1, clientX: x, clientY, sourceCapabilities });
	handle.dispatchEvent(mouse('mousedown', y));
	document.documentElement.dispatchEvent(mouse('mousemove', y + deltaY));
	document.documentElement.dispatchEvent(mouse('mouseup', y + deltaY));
	await nextFrame();
}

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });
	chart.addSeries(LightweightCharts.LineSeries).setData(simpleData(1000000));
	chart.addSeries(LightweightCharts.LineSeries, {}, 1).setData(simpleData(10));
	const pane2Series = chart.addSeries(LightweightCharts.LineSeries, {}, 2);
	pane2Series.setData(simpleData(30));
	await nextFrame();

	const panes = chart.panes();
	const initialHeights = panes.map(pane => pane.getHeight());
	const initialAxisTop = timeAxisTop();
	const initialAxisWidth = chart.priceScale('right').width();
	check(visibleSeparatorCount() === 2, `expected 2 separators, got ${visibleSeparatorCount()}`);

	panes[1].setVisible(false);
	await nextFrame();
	check(!panes[1].visible(), 'pane 1 should report hidden');
	check(visibleSeparatorCount() === 1, `expected 1 separator, got ${visibleSeparatorCount()}`);
	check(timeAxisTop() === initialAxisTop, `time axis moved from ${initialAxisTop} to ${timeAxisTop()}`);
	check(panes[1].getHeight() === 0, `hidden pane height should be 0, got ${panes[1].getHeight()}`);
	check(chart.paneSize(1).height === 0, `hidden paneSize height should be 0, got ${chart.paneSize(1).height}`);
	const initialChartRect = chart.chartElement().getBoundingClientRect();
	chart.resize(initialChartRect.width - 50, initialChartRect.height);
	await nextFrame();
	check(chart.paneSize(1).width === chart.paneSize(0).width, 'hidden paneSize width should follow a resize');
	chart.resize(initialChartRect.width, initialChartRect.height);
	await nextFrame();

	panes[1].setVisible(true);
	await nextFrame();
	panes.forEach((pane, index) => {
		check(pane.getHeight() === initialHeights[index], `pane ${index} should be ${initialHeights[index]}px again, got ${pane.getHeight()}`);
	});

	panes[1].setVisible(false);
	await nextFrame();
	const hiddenStretch = panes[1].getStretchFactor();
	panes[2].setHeight(80);
	await nextFrame();
	check(Math.abs(panes[2].getHeight() - 80) <= 1, `pane 2 should be 80px, got ${panes[2].getHeight()}`);
	panes[1].setHeight(80);
	await nextFrame();
	check(panes[1].getStretchFactor() === hiddenStretch, 'a hidden pane keeps its stretch factor');

	const pane0Height = panes[0].getHeight();
	const pane2Height = panes[2].getHeight();
	await dragVisibleSeparator(-40);
	check(Math.abs(panes[0].getHeight() - (pane0Height - 40)) <= 1, `pane 0 should shrink by 40px, got ${panes[0].getHeight()}`);
	check(Math.abs(panes[2].getHeight() - (pane2Height + 40)) <= 1, `pane 2 should grow by 40px, got ${panes[2].getHeight()}`);
	check(panes[1].getStretchFactor() === hiddenStretch, 'dragging keeps the hidden pane\'s stretch factor');

	panes[0].setVisible(false);
	await nextFrame();
	check(visibleSeparatorCount() === 0, `expected no separators, got ${visibleSeparatorCount()}`);
	check(timeAxisTop() === initialAxisTop, 'time axis moved with only the last pane shown');
	check(chart.priceScale('right').width() < initialAxisWidth, 'a hidden pane should not widen the price axis');

	panes[2].setVisible(false);
	check(panes[2].visible(), 'the last visible pane cannot be hidden');
	chart.removePane(2);
	check(chart.panes().length === 3, 'the last visible pane cannot be removed');
	chart.removeSeries(pane2Series);
	check(chart.panes().length === 3, 'removing its last series keeps the last visible pane');
	chart.addSeries(LightweightCharts.LineSeries, {}, 2).setData(simpleData(30));
	await nextFrame();

	const chartRect = chart.chartElement().getBoundingClientRect();
	const shot = chart.takeScreenshot();
	check(shot.width === Math.round(chartRect.width * window.devicePixelRatio), `screenshot width ${shot.width} should match the chart`);
	check(shot.height === Math.round(chartRect.height * window.devicePixelRatio), `screenshot height ${shot.height} should match the chart`);

	panes[0].setVisible(true);
	panes[1].setVisible(true);
	await nextFrame();
	check(visibleSeparatorCount() === 2, 'separators should return');
	check(timeAxisTop() === initialAxisTop, 'time axis moved after restore');
	const totalStretch = panes.reduce((sum, pane) => sum + pane.getStretchFactor(), 0);
	const totalHeight = panes.reduce((sum, pane) => sum + pane.getHeight(), 0);
	panes.forEach((pane, index) => {
		const expected = totalHeight * pane.getStretchFactor() / totalStretch;
		check(Math.abs(pane.getHeight() - expected) <= 1, `pane ${index} should be ${expected}px, got ${pane.getHeight()}`);
	});

	chart.applyOptions({ layout: { attributionLogo: true } });
	panes[2].setVisible(false);
	await nextFrame();
	const logo = chart.chartElement().querySelector('#tv-attr-logo');
	check(logo !== null && panes[1].getHTMLElement().contains(logo), 'the logo should move to the last visible pane');
	panes[2].setVisible(true);
	await nextFrame();
	check(panes[2].getHTMLElement().contains(chart.chartElement().querySelector('#tv-attr-logo')), 'the logo should return to the last pane');
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
