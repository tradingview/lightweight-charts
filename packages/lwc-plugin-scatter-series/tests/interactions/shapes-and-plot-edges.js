// The pointer hovers a marker by its drawn shape — the corners of a triangle,
// not the space beside its tip — and a point whose centre lies just outside
// the plot (above a pinned Y range) but which is drawn and hovered gets its
// geometry from pointById and the subscription, so the host can show its tooltip.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0, bottom: 0 } },
	});
	const series = LwcPlugin.createScatterSeries(chart, {
		yRange: { min: 0, max: 12 },
		groups: [{ id: 'triangles', shape: 'triangleUp' }],
		hitTestTolerance: 0,
	});
	let lastParam = null;
	const seen = [];
	chart.subscribeCrosshairMove(param => {
		lastParam = param;
		seen.push(param.hoveredInfo ? param.hoveredInfo.objectId : undefined);
	});
	const hoveredId = () => (lastParam && lastParam.hoveredInfo ? lastParam.hoveredInfo.objectId : undefined);
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	series.setData([
		{ id: 'triangle', x: 3, y: 6, size: 40, group: 'triangles' },
		// The centre is above the top of the plot: only the lower half is drawn.
		{ id: 'over', x: 7, y: 12.3, size: 40 },
		{ id: 'low', x: 0, y: 0 },
		{ id: 'high', x: 10, y: 1 },
	]);
	await frames(3);

	const over = series.pointById('over');
	if (over === null || over.y >= 0 || over.y + over.radius <= 0) { throw new Error(`The point over the top edge has no geometry: ${JSON.stringify(over)}`); }
	const triangle = series.pointById('triangle');
	const r = triangle.radius;
	// Near the base corners (inside the triangle, outside its inscribed circle).
	const corner = { x: triangle.x + r - 3, y: triangle.y + r - 3 };
	// Beside the tip: inside the circle of radius r, outside the triangle.
	const besideTip = { x: triangle.x + r * 0.6, y: triangle.y - r * 0.6 };
	if (series.hitTest(corner.x, corner.y)?.objectId !== 'triangle') { throw new Error('The API hit test misses the triangle corner'); }
	if (series.hitTest(besideTip.x, besideTip.y) !== null) { throw new Error('The API hit test hits beside the triangle tip'); }

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(besideTip.x), y: Math.round(besideTip.y) } },
	];
	window.afterInitialInteractions = async () => {
		if (hoveredId() !== undefined) { throw new Error(`The pointer beside the triangle tip hovered ${hoveredId()}`); }
		await frames();
	};
	window.finalInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(corner.x), y: Math.round(corner.y) } },
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(over.x), y: 3 } },
	];
	window.afterFinalInteractions = () => {
		if (seen.indexOf('triangle') === -1) { throw new Error(`The pointer at the triangle corner did not hover it: ${JSON.stringify(seen)}`); }
		if (hoveredId() !== 'over') { throw new Error(`The point over the top edge should be hovered, got ${JSON.stringify(hoveredId())}`); }
		const hovered = series.hoveredPoint();
		if (hovered === null || hovered.objectId !== 'over' || hovered.y !== over.y) { throw new Error(`hoveredPoint() lost the edge point: ${JSON.stringify(hovered)}`); }
		requestAnimationFrame(() => {
			const notified = changes[changes.length - 1];
			if (notified === null || notified.objectId !== 'over' || notified.y !== over.y) {
				throw new Error(`The subscription should report the edge point with its geometry: ${JSON.stringify(notified)}`);
			}
		});
	};
}
