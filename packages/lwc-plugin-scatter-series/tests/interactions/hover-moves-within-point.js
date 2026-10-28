// The pointer moving within the hovered point repaints nothing but the top
// layer: the series reports the same hit test data for the same point, which
// the chart compares by reference, so the points are not drawn again on every
// mouse move over a point.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 30, hitTestTolerance: 0 });
	series.setData(Array.from({ length: 40 }, (_, i) => ({ id: `p${i}`, x: (i % 8) * 10, y: Math.floor(i / 8) * 10 })));
	await frames(3);
	// The points are circles: every arc on the pane canvas is a point drawn.
	const context = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas').getContext('2d');
	let arcs = 0;
	const arc = context.arc;
	context.arc = function (...args) {
		arcs++;
		return arc.apply(this, args);
	};
	const target = series.pointById('p19');
	const at = (dx, dy) => ({ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(target.x + dx), y: Math.round(target.y + dy) } });
	window.initialInteractionsToPerform = () => [at(0, 0)];
	window.afterInitialInteractions = async () => {
		await frames(3);
		if (series.hoveredPoint()?.objectId !== 'p19') { throw new Error(`The point is not hovered: ${JSON.stringify(series.hoveredPoint())}`); }
		// Hovering it repainted the points once at least.
		if (arcs < 40) { throw new Error(`Hovering the point did not repaint the points: ${arcs} arcs`); }
		arcs = 0;
	};
	window.finalInteractionsToPerform = () => [at(3, 0), at(-3, 2), at(1, -4), at(-2, -2), at(4, 3), at(0, 1)];
	// The runner waits a frame and more after this: an error thrown then fails the case as a page error.
	window.afterFinalInteractions = async () => {
		await frames();
		if (series.hoveredPoint()?.objectId !== 'p19') { throw new Error('The point is no longer hovered'); }
		if (arcs !== 0) { throw new Error(`Moves within the hovered point repainted the points: ${arcs} arcs`); }
	};
}
