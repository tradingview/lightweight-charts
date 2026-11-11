let chart;

const failures = [];
let widthWhenHidden = -1;
let widthAfterVisibleApplied = -1;

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		width: 600,
		height: 400,
		timeScale: {
			visible: false,
		},
	});

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([
		{ time: '2020-01-01', value: 1 },
		{ time: '2020-01-02', value: 2 },
	]);

	// a hidden time scale still spans the pane, so its width should be known
	const widthAtCreation = chart.timeScale().width();
	if (!(widthAtCreation > 0)) {
		failures.push(`expected width() > 0 for a hidden time scale, got ${widthAtCreation}`);
	}

	// let the first layout settle so the pane width is final
	await nextFrame();

	widthWhenHidden = chart.timeScale().width();
	if (!(widthWhenHidden > 0)) {
		failures.push(`expected width() > 0 for a hidden time scale after the first render, got ${widthWhenHidden}`);
	}

	chart.applyOptions({
		timeScale: {
			visible: true,
		},
	});

	// read in the same call stack as the visibility change; toggling the time
	// axis visibility does not change the pane width, so the value should be
	// available immediately and be identical
	widthAfterVisibleApplied = chart.timeScale().width();
	if (!(widthAfterVisibleApplied > 0)) {
		failures.push(`expected width() > 0 right after making the time scale visible, got ${widthAfterVisibleApplied}`);
	}

	if (widthWhenHidden > 0 && widthAfterVisibleApplied > 0 && widthWhenHidden !== widthAfterVisibleApplied) {
		failures.push(`width() changed when toggling visibility: ${widthWhenHidden} -> ${widthAfterVisibleApplied}`);
	}
}

function afterInitialInteractions() {
	// a frame has rendered by now; the steady-state value must match the
	// value that was readable synchronously
	const widthAfterRender = chart.timeScale().width();
	if (widthAfterVisibleApplied > 0 && widthAfterRender !== widthAfterVisibleApplied) {
		failures.push(`width() after render (${widthAfterRender}) does not match the synchronous value (${widthAfterVisibleApplied})`);
	}

	return Promise.resolve();
}

function afterFinalInteractions() {
	if (failures.length > 0) {
		throw new Error(`timeScale().width() checks failed:\n${failures.join('\n')}`);
	}
}
