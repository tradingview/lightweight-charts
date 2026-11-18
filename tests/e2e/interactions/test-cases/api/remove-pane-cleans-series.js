function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function check(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function beforeInteractions(container) {
	for (const removedIndex of [0, 1, 2]) {
		for (const preserve of [false, true]) {
			const chart = LightweightCharts.createChart(container, { width: 600, height: 500 });
			const series = [0, 1, 2].map(paneIndex => chart.addSeries(LightweightCharts.LineSeries, {}, paneIndex));
			const extra = chart.addSeries(LightweightCharts.LineSeries, {}, removedIndex);
			for (const line of series) {
				line.setData([{ time: 1, value: 10 }, { time: 2, value: 20 }]);
			}
			extra.setData([{ time: 1, value: 10 }, { time: 20, value: 20 }]);
			const originalPanes = chart.panes();
			originalPanes[removedIndex].setPreserveEmptyPane(preserve);
			await nextFrame();
			chart.removePane(removedIndex);
			chart.timeScale().fitContent();
			await nextFrame();
			check(chart.panes().length === 2, 'Removing a populated pane should remove exactly one pane');
			const remaining = series.filter((unused, i) => i !== removedIndex);
			for (let i = 0; i < remaining.length; i++) {
				check(chart.panes()[i].getSeries()[0] === remaining[i], 'The neighboring pane should retain its series');
			}
			check(chart.timeScale().getVisibleRange().to === 2, 'Removed pane data must not remain on the shared time scale');
			remaining[1].update({ time: 3, value: 30 });
			chart.timeScale().fitContent();
			await nextFrame();
			check(chart.timeScale().getVisibleRange().to === 3, 'A surviving series should still update');
			chart.remove();
		}
	}

	const chart = LightweightCharts.createChart(container, { width: 600, height: 500 });
	const main = chart.addSeries(LightweightCharts.LineSeries);
	main.setData([{ time: 1, value: 10 }, { time: 2, value: 20 }]);
	chart.removePane(0);
	check(chart.panes().length === 1 && chart.panes()[0].getSeries()[0] === main, 'The only pane and its data must be preserved');
	const second = chart.addSeries(LightweightCharts.LineSeries, {}, 1);
	second.setData([{ time: 1, value: 10 }, { time: 20, value: 20 }]);
	chart.panes()[0].setVisible(false);
	chart.removePane(1);
	check(chart.panes().length === 2 && chart.panes()[1].getSeries()[0] === second, 'The last visible pane and its data must be preserved');
	chart.removePane(0);
	chart.timeScale().fitContent();
	await nextFrame();
	check(chart.panes().length === 1 && chart.panes()[0].getSeries()[0] === second, 'A hidden pane can be removed without changing the visible pane');
	chart.remove();
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
