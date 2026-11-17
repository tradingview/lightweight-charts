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
		for (const hideTarget of [false, true]) {
			const chart = LightweightCharts.createChart(container, { width: 600, height: 500 });
			const series = [0, 1, 2].map(i => chart.addSeries(LightweightCharts.LineSeries, {}, i));
			series.forEach(line => line.setData([{ time: 1, value: 10 }, { time: 2, value: 20 }]));
			const detached = [0, 0, 0];
			const panes = chart.panes();
			panes.forEach((pane, i) => pane.attachPrimitive({ detached: () => detached[i]++ }));
			await nextFrame();
			if (hideTarget) {
				panes[removedIndex].setVisible(false);
			}
			chart.removePane(removedIndex);
			await nextFrame();
			check(detached.every((count, i) => count === (i === removedIndex ? 1 : 0)), 'Only the removed pane primitive should detach');
			const remaining = series.filter((unused, i) => i !== removedIndex);
			check(chart.panes().every((pane, i) => pane.getSeries()[0] === remaining[i]), 'Surviving pane series should retain their order');
			chart.remove();
			check(detached.every(count => count === 1), 'Every pane primitive should detach exactly once after chart removal');
		}
	}

	const chart = LightweightCharts.createChart(container, { width: 600, height: 500 });
	[0, 1, 2].forEach(i => {
		const line = chart.addSeries(LightweightCharts.LineSeries, {}, i);
		line.setData([{ time: 1, value: 10 }, { time: 2, value: 20 }]);
	});
	const detached = [0, 0, 0];
	chart.panes().forEach((pane, i) => pane.attachPrimitive({ detached: () => detached[i]++ }));
	await nextFrame();
	chart.swapPanes(0, 2);
	await nextFrame();
	chart.removePane(0);
	chart.addSeries(LightweightCharts.LineSeries, {}, 2);
	await nextFrame();
	check(detached[2] === 1 && detached[0] === 0 && detached[1] === 0, 'Removing and replacing a swapped pane before painting should detach only its primitive');
	chart.remove();
	check(detached.every(count => count === 1), 'Swapped surviving panes should detach once at chart removal');
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
