// Overlapping points: the pointer hovers the one drawn on top — the later one
// in drawing order — and, once a point is hovered, it is drawn on top and keeps
// winning the overlap. Group order beats data order.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 2);
	const RED = [242, 54, 69, 255];
	const BLUE = [41, 98, 255, 255];

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 1,
		groups: [
			{ id: 'first', color: '#089981' },
			{ id: 'second', color: '#FF9800' },
		],
	});
	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	const hoveredId = () => (lastParam && lastParam.hoveredInfo ? lastParam.hoveredInfo.objectId : undefined);
	series.setData([
		// Group order decides first: `second` is drawn above `first` although it comes first in the data.
		{ id: 'group-above', x: 20, y: 20, size: 40, group: 'second' },
		{ id: 'group-below', x: 23, y: 20, size: 40, group: 'first' },
		// Ungrouped points are drawn before every group, then in data order.
		{ id: 'under', x: 60, y: 60, size: 40, color: '#F23645' },
		{ id: 'over', x: 64, y: 60, size: 40, color: '#2962FF' },
		{ id: 'corner-low', x: 0, y: 0 },
		{ id: 'corner-high', x: 100, y: 100 },
	]);
	await frames();

	const under = series.pointById('under');
	const over = series.pointById('over');
	const middle = { x: Math.round((under.x + over.x) / 2), y: Math.round(under.y) };
	if (over.x - under.x > 30) { throw new Error(`The test needs overlapping points, they are ${over.x - under.x}px apart`); }
	const underOnly = { x: Math.round(under.x) - 14, y: Math.round(under.y) };

	const groupAbove = series.pointById('group-above');
	const groupBelow = series.pointById('group-below');
	const groupHit = series.hitTest((groupAbove.x + groupBelow.x) / 2, groupAbove.y);
	if (groupHit === null || groupHit.objectId !== 'group-above') {
		throw new Error(`A point of a later group should win the overlap, got ${groupHit && groupHit.objectId}`);
	}
	if (!near(pixel(middle.x, middle.y), BLUE)) { throw new Error(`The later point should be painted on top: ${pixel(middle.x, middle.y)}`); }

	// Hover the lower point where it is alone, then move into the overlap: it stays hovered and on top.
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: underOnly },
		{ action: 'moveMouseXY', target: 'pane', options: middle },
	];
	window.afterInitialInteractions = async () => {
		if (hoveredId() !== 'under') {
			throw new Error(`The hovered point should keep the overlap, got ${JSON.stringify(hoveredId())}`);
		}
		await frames();
		if (!near(pixel(middle.x, middle.y), RED)) {
			throw new Error(`The hovered point should be painted on top: ${pixel(middle.x, middle.y)}`);
		}
	};

	// Leave both, then come back straight into the overlap: the topmost point wins.
	window.finalInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: middle.x, y: middle.y + 120 } },
		{ action: 'moveMouseXY', target: 'pane', options: middle },
	];
	window.afterFinalInteractions = () => {
		if (hoveredId() !== 'over') {
			throw new Error(`The topmost point should win the overlap, got ${JSON.stringify(hoveredId())}`);
		}
		if (series.hoveredPoint() === null || series.hoveredPoint().objectId !== 'over') {
			throw new Error('hoveredPoint() disagrees with the chart');
		}
	};
}
