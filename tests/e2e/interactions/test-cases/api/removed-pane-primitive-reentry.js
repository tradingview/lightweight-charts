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
	for (const screenshot of [false, true]) {
		const multiChart = LightweightCharts.createChart(container, { width: 600, height: 500 });
		[0, 1, 2, 3].forEach(i => multiChart.addSeries(LightweightCharts.LineSeries, {}, i));
		const counts = [0, 0, 0, 0];
		multiChart.panes().forEach((pane, i) => pane.attachPrimitive({ detached: () => {
			counts[i]++;
			if (i === 0) {
				multiChart.remove();
			}
		} }));
		await nextFrame();
		multiChart.timeScale().scrollToPosition(10, true);
		multiChart.removePane(0);
		multiChart.removePane(0);
		if (screenshot) {
			let error;
			try {
				multiChart.takeScreenshot();
			} catch (e) {
				error = e;
			}
			check(error && error.message === 'Cannot take a screenshot of a destroyed chart', 'Screenshot flush should report chart removal before reading disposed canvases');
		}
		await nextFrame();
		check(counts.every(count => count === 1), 'Chart removal during multi-pane detach should destroy every primitive once');
	}

	for (const removeChart of [false, true]) {
		const reentrantChart = LightweightCharts.createChart(container, { width: 600, height: 500 });
		[0, 1, 2].forEach(i => reentrantChart.addSeries(LightweightCharts.LineSeries, {}, i));
		const counts = [0, 0, 0];
		reentrantChart.panes().forEach((pane, i) => pane.attachPrimitive({ detached: () => {
			counts[i]++;
			if (i === 0) {
				if (removeChart) {
					reentrantChart.remove();
				} else {
					reentrantChart.removePane(0);
				}
			}
		} }));
		await nextFrame();
		reentrantChart.removePane(0);
		await nextFrame();
		if (removeChart) {
			check(counts.every(count => count === 1), 'Removing the chart during detach should destroy each primitive once');
		} else {
			check(reentrantChart.panes().length === 1, 'A detach callback should be able to remove another pane');
			check(counts[0] === 1 && counts[1] === 1 && counts[2] === 0, 'Reentrant pane removal should leave the survivor attached');
			reentrantChart.remove();
			check(counts.every(count => count === 1), 'Reentrant removal should not double-detach primitives');
		}
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
