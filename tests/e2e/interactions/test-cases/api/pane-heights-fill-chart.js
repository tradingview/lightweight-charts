const separatorHeight = 1;
const mismatches = [];

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

async function beforeInteractions(container) {
	Object.defineProperty(window, 'devicePixelRatio', { get: () => 1.25, configurable: true });

	const chart = LightweightCharts.createChart(container, { width: 600, height: 400 });

	for (let paneIndex = 0; paneIndex < 4; ++paneIndex) {
		const series = chart.addSeries(LightweightCharts.LineSeries, {}, paneIndex);
		series.setData([{ time: '2020-01-01', value: 1 }, { time: '2020-01-02', value: 2 }]);

		for (let height = 400; height < 410; ++height) {
			chart.applyOptions({ height });
			await nextFrame();

			const chartHeight = chart.chartElement().getBoundingClientRect().height;
			const panes = chart.panes();
			const panesHeight = panes.reduce((sum, pane) => sum + pane.getHeight(), 0);
			const total = panesHeight + separatorHeight * (panes.length - 1) + chart.timeScale().height();
			if (Math.abs(total - chartHeight) > 1e-6) {
				mismatches.push(`${panes.length} panes in a ${chartHeight}px chart: laid out ${total}px`);
			}
		}
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (mismatches.length > 0) {
		throw new Error(`Expected the layout to fill the chart height exactly:\n${mismatches.join('\n')}`);
	}

	return Promise.resolve();
}
