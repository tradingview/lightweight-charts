// A host taking the scatter series off with chart.removeSeries(series.series())
// rather than series.remove(): the series lets go of the chart as soon as it
// finds out — its subscriptions, its label distance, its hovered-point
// subscribers told `null` once — and neither new data nor a resize gives the
// chart its slots back. It does so once the chart's own call is over, never
// from within the chart's dispatch of the range change the removal fires (the
// host's range handlers run first). The next scatter series may be added, and
// works.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 3);

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false }, timeScale: { tickMarkMaxCharacterLength: 11 } });
	const first = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 1, color: '#F23645' });
	first.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 5, y: 5 }, { id: 'c', x: 10, y: 10 }]);
	const firstNotes = [];
	const events = [];
	first.subscribeHoveredPointChange(info => {
		firstNotes.push(info === null ? null : info.objectId);
		events.push(`hovered ${info === null ? null : info.objectId}`);
	});
	const firstNotified = () => JSON.stringify(firstNotes);
	await frames(3);
	first.setHoveredPoint('b');
	await frames(3);
	if (firstNotified() !== '["b"]') { throw new Error(`The first series did not notify: ${firstNotified()}`); }

	const onRange = range => events.push(`host range ${range === null ? null : 'set'}`);
	chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
	events.length = 0;
	chart.removeSeries(first.series());
	events.push('removeSeries returned');
	await Promise.resolve();
	chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
	if (JSON.stringify(events) !== JSON.stringify(['host range null', 'removeSeries returned', 'hovered null'])) {
		throw new Error(`The series let go of the chart from within the chart's call: ${JSON.stringify(events)}`);
	}
	await frames(2);
	// Taken off the chart, the series lets go of it: neither new data nor a
	// resize gives the chart its slots back, and the label distance is the chart's.
	first.setData([{ id: 'a', x: 0, y: 0 }, { id: 'z', x: 40, y: 4 }]);
	chart.resize(480, 400);
	await frames(3);
	const timeScale = chart.timeScale();
	if (timeScale.getVisibleLogicalRange() !== null || timeScale.timeToIndex(0, false) !== null || timeScale.timeToIndex(40, false) !== null) {
		throw new Error(`A series taken off the chart gave it slots again: ${JSON.stringify(timeScale.getVisibleLogicalRange())}`);
	}
	if (chart.options().timeScale.tickMarkMaxCharacterLength !== 11) {
		throw new Error(`A series taken off the chart still manages its label distance: ${chart.options().timeScale.tickMarkMaxCharacterLength}`);
	}
	if (first.xToCoordinate(10) !== null || first.pointById('a') !== null) { throw new Error('A series taken off the chart still maps points'); }
	// Its hovered point went with it, told once.
	if (firstNotified() !== '["b",null]') { throw new Error(`Taken off the chart, the series should notify null once: ${firstNotified()}`); }

	let second = null;
	try {
		second = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 1, color: '#2962FF' });
	} catch (error) {
		throw new Error(`A scatter series removed through the chart still holds it: ${error}`);
	}
	// The first one was released: its hovered point is gone, told once.
	if (firstNotified() !== '["b",null]') { throw new Error(`Releasing the first series should notify null once: ${firstNotified()}`); }
	// Inert: no more notifications, no throw.
	first.setData([{ x: 1, y: 1 }]);
	first.applyOptions({ pointSize: 12 });
	first.setHoveredPoint(null);
	first.remove();
	if (first.pointById('b') !== null || first.hoveredPoint() !== null) { throw new Error('The released series still reports points'); }

	second.setData([{ id: 'n1', x: 100, y: 100 }, { id: 'n2', x: 150, y: 150 }, { id: 'n3', x: 200, y: 200 }]);
	await frames(3);
	const n2 = second.pointById('n2');
	if (n2 === null || !near(pixel(n2.x, n2.y + 6), [41, 98, 255, 255])) { throw new Error('The new series did not paint'); }
	const domain = second.xDomain();
	const left = chart.timeScale().timeToCoordinate(domain.min);
	if (domain.min !== 100 || domain.max !== 200 || Math.abs(left) > 0.5) { throw new Error(`The new series did not fit its domain: ${JSON.stringify(domain)} at ${left}`); }
	// Two scatter series still cannot share the chart.
	let third = null;
	try {
		third = LwcPlugin.createScatterSeries(chart);
	} catch (error) {
		if (!/already has a scatter series/.test(String(error))) { throw error; }
	}
	if (third !== null) { throw new Error('A second attached scatter series did not throw'); }

	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(n2.x), y: Math.round(n2.y) } }];
	window.afterInitialInteractions = async () => {
		await frames();
		if (!lastParam || !lastParam.hoveredInfo || lastParam.hoveredInfo.objectId !== 'n2') { throw new Error('The new series is not hoverable'); }
		if (firstNotified() !== '["b",null]') { throw new Error(`The released series was notified of the new hover: ${firstNotified()}`); }
		second.remove();
		if (chart.options().timeScale.tickMarkMaxCharacterLength !== 11) { throw new Error('The label distance was not given back'); }
	};
}
