function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

async function beforeInteractions(container) {
	const options = { width: 600, height: 280, timeScale: { fixLeftEdge: true, shiftVisibleRangeOnNewBar: false }, layout: { attributionLogo: false } };
	const source = LightweightCharts.createChart(container, options);
	const targetContainer = document.createElement('div');
	container.appendChild(targetContainer);
	const target = LightweightCharts.createChart(targetContainer, options);
	const sourceSeries = source.addSeries(LightweightCharts.LineSeries);
	const targetSeries = target.addSeries(LightweightCharts.LineSeries);
	const data = count => Array.from({ length: count }, (unused, i) => ({ time: 1700000000 + i * 900, value: i % 10 }));
	sourceSeries.setData(data(500));
	targetSeries.setData(data(700));
	const range = { from: 280, to: 499 };
	source.timeScale().setVisibleLogicalRange(range);
	target.timeScale().setVisibleLogicalRange(range);
	await new Promise(resolve => requestAnimationFrame(resolve));
	const events = [];
	const timeEvents = [];
	source.timeScale().subscribeVisibleTimeRangeChange(changed => timeEvents.push(changed));
	source.timeScale().subscribeVisibleLogicalRangeChange(changed => {
		events.push(changed);
		if (changed) {
			target.timeScale().setVisibleLogicalRange(changed);
		}
	});
	sourceSeries.setData(data(700));
	await new Promise(resolve => requestAnimationFrame(resolve));
	if (events.length !== 0 || timeEvents.length !== 0) {
		throw new Error(`Appending with a stable range must not notify a synchronized chart about an intermediate range: ${JSON.stringify({ events, timeEvents })}`);
	}
	for (const chart of [source, target]) {
		const finalRange = chart.timeScale().getVisibleLogicalRange();
		if (!finalRange || Math.abs(finalRange.from - range.from) > 0.001 || Math.abs(finalRange.to - range.to) > 0.001) {
			throw new Error(`The synchronized range changed: ${JSON.stringify(finalRange)}`);
		}
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
