const charts = [];
const series = [];
const events = [[], []];
let pointerX;
const syncOperations = [[], []];

function initialInteractionsToPerform() {
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: 250, y: 100 } }];
}

function finalInteractionsToPerform() {
	return [{ action: 'moveMouseXY', target: 'container', options: { x: 250, y: 350 } }];
}

function beforeInteractions(container) {
	for (let i = 0; i < 2; i++) {
		const element = document.createElement('div');
		container.appendChild(element);
		const chart = LightweightCharts.createChart(element, {
			width: 600,
			height: 250,
			crosshair: { mode: 0 },
			rightPriceScale: { minimumWidth: 70 },
		});
		const line = chart.addSeries(LightweightCharts.LineSeries);
		line.setData(Array.from({ length: 200 }, (_, index) => ({
			time: 1600000000 + index * 86400,
			value: 100 + Math.sin(index),
		})));
		charts.push(chart);
		series.push(line);
	}
	for (let i = 0; i < 2; i++) {
		charts[i].timeScale().subscribeVisibleLogicalRangeChange(range => {
			charts[1 - i].timeScale().setVisibleLogicalRange(range);
		});
		charts[i].subscribeCrosshairMove(event => {
			events[i].push(event);
			const point = event.seriesData.get(series[i]);
			if (point) {
				syncOperations[1 - i].push({ kind: 'set', time: point.time });
				charts[1 - i].setCrosshairPosition(point.value, point.time, series[1 - i]);
			} else {
				syncOperations[1 - i].push({ kind: 'clear' });
				charts[1 - i].clearCrosshairPosition();
			}
		});
	}
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function assertScrollEvents(active) {
	if (events[1 - active].length !== 0) {
		throw new Error('Recalculating the synthetic crosshair emitted feedback events');
	}
	if (events[active].length === 0) {
		throw new Error('Expected a pointer-origin crosshair update after scrolling');
	}
	for (const event of events[active]) {
		if (Math.abs(event.point.x - pointerX) > 0.01) {
			throw new Error('The synchronized crosshair replaced the saved pointer coordinate');
		}
	}
}

function scrollFromPointer(active) {
	const pointerEvent = events[active].filter(event => event.sourceEvent).pop();
	if (!pointerEvent) {
		throw new Error('Expected the pointer to enter the active chart');
	}
	pointerX = pointerEvent.point.x;
	events[0].length = 0;
	events[1].length = 0;
	charts[active].timeScale().scrollToPosition(active === 0 ? -10 : -20, false);
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function afterInitialInteractions() {
	await scrollFromPointer(0);
	assertScrollEvents(0);
	for (const offset of [-500, 500]) {
		charts[0].timeScale().scrollToPosition(offset, false);
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		if (syncOperations[1].at(-1)?.kind !== 'clear') {
			throw new Error('Expected the synced crosshair to clear outside the data');
		}
		charts[0].timeScale().scrollToPosition(-10, false);
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const lastEvent = events[0].at(-1);
		const lastSync = syncOperations[1].at(-1);
		if (lastSync?.kind !== 'set' || lastSync.time !== lastEvent.time) {
			throw new Error('Expected the target crosshair to resynchronize after returning to the data');
		}
		assertScrollEvents(0);
	}
}

async function afterFinalInteractions() {
	await scrollFromPointer(1);
	assertScrollEvents(1);
	for (const chart of charts) {
		chart.remove();
	}
}
