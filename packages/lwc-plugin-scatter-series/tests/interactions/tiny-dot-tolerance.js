// The smallest dot (5 px) is hoverable a little outside its edge, within
// `hitTestTolerance` (3 px by default), and not further away.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 5 });
	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	const hoveredId = () => (lastParam && lastParam.hoveredInfo ? lastParam.hoveredInfo.objectId : undefined);
	series.setData([
		{ id: 'tiny', x: 50, y: 50 },
		{ id: 'low', x: 0, y: 0 },
		{ id: 'high', x: 100, y: 100 },
	]);
	await frames();

	const tiny = series.pointById('tiny');
	if (tiny === null || tiny.radius !== 2.5) { throw new Error(`The dot should be 5 px: ${JSON.stringify(tiny)}`); }
	// 3.5–4.5 px from the centre: 1–2 px outside the edge.
	const close = { x: Math.round(tiny.x) + 4, y: Math.round(tiny.y) };
	// 8.5–9.5 px from the centre: 6–7 px outside the edge.
	const far = { x: Math.round(tiny.x) + 9, y: Math.round(tiny.y) };

	// The API hit test follows `hitTestTolerance`.
	series.applyOptions({ hitTestTolerance: 0 });
	if (series.hitTest(close.x, close.y) !== null) { throw new Error('hitTestTolerance 0 still hit outside the dot'); }
	if (series.options().hitTestTolerance !== 0) { throw new Error('options() does not report hitTestTolerance'); }
	series.applyOptions({ hitTestTolerance: 3 });
	const apiHit = series.hitTest(close.x, close.y);
	if (apiHit === null || apiHit.objectId !== 'tiny') { throw new Error('The API hit test missed the dot within the tolerance'); }

	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: close }];
	window.afterInitialInteractions = () => {
		if (hoveredId() !== 'tiny') {
			throw new Error(`The 5 px dot should be hovered within the tolerance, got ${JSON.stringify(hoveredId())}`);
		}
	};
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: far }];
	window.afterFinalInteractions = () => {
		if (hoveredId() !== undefined) {
			throw new Error(`A pointer 6 px away from the dot should hover nothing, got ${JSON.stringify(hoveredId())}`);
		}
		if (series.hoveredPoint() !== null) { throw new Error('hoveredPoint() is not null'); }
	};
}
