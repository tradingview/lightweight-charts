// A host taking the scatter series off with chart.removeSeries(series.series())
// rather than series.remove(): the next scatter series may still be added —
// the first one is released then, its subscriptions with it, its hovered-point
// subscribers told `null` once — and works.
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
	first.subscribeHoveredPointChange(info => { firstNotes.push(info === null ? null : info.objectId); });
	const firstNotified = () => JSON.stringify(firstNotes);
	await frames(3);
	first.setHoveredPoint('b');
	await frames(3);
	if (firstNotified() !== '["b"]') { throw new Error(`The first series did not notify: ${firstNotified()}`); }

	chart.removeSeries(first.series());
	await frames(2);

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
