// `timeScale.position: 'top'` should place the time axis above the panes in the
// DOM and in the rendered layout, and a runtime toggle to 'bottom' (and back)
// should move it accordingly.

const failures = [];

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function assert(condition, description) {
	if (!condition) {
		failures.push(description);
	}
}

function timeAxisRowIsFirst(chart) {
	const rows = chart.chartElement().querySelectorAll('table tr');
	const timeScaleHeight = chart.timeScale().height();
	const firstRect = rows[0].getBoundingClientRect();
	const lastRect = rows[rows.length - 1].getBoundingClientRect();
	return Math.abs(firstRect.height - timeScaleHeight) < 1.5
		&& firstRect.top < lastRect.top;
}

function timeAxisRowIsLast(chart) {
	const rows = chart.chartElement().querySelectorAll('table tr');
	const timeScaleHeight = chart.timeScale().height();
	const firstRect = rows[0].getBoundingClientRect();
	const lastRect = rows[rows.length - 1].getBoundingClientRect();
	return Math.abs(lastRect.height - timeScaleHeight) < 1.5
		&& lastRect.top > firstRect.top;
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		width: 600,
		height: 400,
		timeScale: { position: 'top' },
	});

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([
		{ time: '2020-01-01', value: 1 },
		{ time: '2020-01-02', value: 2 },
		{ time: '2020-01-03', value: 3 },
	]);

	await nextFrame();
	await nextFrame();

	assert(chart.timeScale().height() > 0, 'time scale height should be greater than zero');
	assert(timeAxisRowIsFirst(chart), 'with position: top, the time axis row should be the first table row');

	chart.applyOptions({ timeScale: { position: 'bottom' } });
	await nextFrame();
	await nextFrame();

	assert(timeAxisRowIsLast(chart), 'after toggling to bottom, the time axis row should be the last table row');

	chart.applyOptions({ timeScale: { position: 'top' } });
	await nextFrame();
	await nextFrame();

	assert(timeAxisRowIsFirst(chart), 'after toggling back to top, the time axis row should be the first table row again');

	// pane add/remove with the time axis at the top
	const pane1 = chart.addPane();
	const secondary = chart.addSeries(LightweightCharts.LineSeries, {}, 1);
	secondary.setData([
		{ time: '2020-01-01', value: 3 },
		{ time: '2020-01-02', value: 2 },
		{ time: '2020-01-03', value: 1 },
	]);
	await nextFrame();
	await nextFrame();

	assert(timeAxisRowIsFirst(chart), 'after addPane, the time axis row should still be the first table row');
	assert(chart.panes().length === 2, 'expected 2 panes after addPane');

	chart.removePane(1);
	await nextFrame();
	await nextFrame();

	assert(timeAxisRowIsFirst(chart), 'after removePane, the time axis row should still be the first table row');
	assert(chart.panes().length === 1, 'expected 1 pane after removePane');

	// the layout should still fill the chart height exactly
	const chartHeight = chart.chartElement().getBoundingClientRect().height;
	const panes = chart.panes();
	const panesHeight = panes.reduce((sum, pane) => sum + pane.getHeight(), 0);
	const separators = chart.chartElement().querySelectorAll('table tr').length - panes.length - 1;
	const total = panesHeight + separators * 1 + chart.timeScale().height();
	assert(Math.abs(total - chartHeight) < 1.5, `layout should fill the chart height: got ${total} of ${chartHeight}`);
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (failures.length > 0) {
		throw new Error(`timeScale.position assertions failed:\n${failures.join('\n')}`);
	}

	return Promise.resolve();
}
