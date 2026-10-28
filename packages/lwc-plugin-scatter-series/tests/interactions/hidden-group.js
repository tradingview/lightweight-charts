// A hidden group is neither drawn, hoverable nor part of the price scale, but
// it keeps its place on the X axis: showing or hiding a group never moves the
// X domain. Showing it again with applyOptions makes it hoverable and scaled.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const groups = [
		{ id: 'shown', color: '#2962FF' },
		{ id: 'hidden', color: '#F23645', visible: false },
	];
	const series = LwcPlugin.createScatterSeries(chart, { groups, pointSize: 16 });
	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info && info.objectId));
	series.setData([
		{ id: 'left', x: 0, y: 5, group: 'shown' },
		{ id: 'right', x: 10, y: 5, group: 'shown' },
		{ id: 'low', x: 2, y: 0, group: 'shown' },
		{ id: 'high', x: 8, y: 10, group: 'shown' },
		// Where no shown point is.
		{ id: 'inside', x: 5, y: 5, group: 'hidden' },
		// Beyond the shown points on both axes.
		{ id: 'outlier', x: 12, y: 1000, group: 'hidden' },
	]);
	await frames();

	const domain = series.xDomain();
	if (domain.min !== 0 || domain.max < 12) { throw new Error(`The X domain should cover the hidden points too: ${JSON.stringify(domain)}`); }
	const underlying = series.series();
	const top = underlying.coordinateToPrice(0);
	if (top === null || top > 20) { throw new Error(`A hidden point widened the price scale: top is ${top}`); }
	if (series.pointById('inside') !== null) { throw new Error('pointById returned a point of a hidden group'); }
	if (series.pointById('left') === null) { throw new Error('pointById missed a point of a shown group'); }

	// Where the hidden point would be drawn: halfway between `left` and `right`.
	const left = series.pointById('left');
	const right = series.pointById('right');
	const target = { x: Math.round((left.x + right.x) / 2), y: Math.round(underlying.priceToCoordinate(5)) };
	if (right.x - left.x < 20) { throw new Error(`The shown points are too close to aim between them: ${left.x}, ${right.x}`); }
	if (series.hitTest(target.x, target.y) !== null) { throw new Error('The API hit test found a hidden point'); }

	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: target }];
	window.afterInitialInteractions = async () => {
		await frames();
		if (lastParam === null) { throw new Error('No crosshair move was reported'); }
		if (lastParam.hoveredInfo !== undefined && lastParam.hoveredInfo.objectId !== undefined) {
			throw new Error(`A hidden point was hovered: ${lastParam.hoveredInfo.objectId}`);
		}
		if (changes.length !== 0) { throw new Error(`The hovered point changed: ${JSON.stringify(changes)}`); }

		// Showing the group again: it is drawn, scaled and hoverable.
		series.applyOptions({ groups: groups.map(group => ({ ...group, visible: true })) });
		await frames();
		const shownDomain = series.xDomain();
		if (shownDomain.min !== domain.min || shownDomain.max !== domain.max) {
			throw new Error(`Showing a group moved the X domain: ${JSON.stringify(domain)} -> ${JSON.stringify(shownDomain)}`);
		}
		const outlierY = underlying.priceToCoordinate(1000);
		if (outlierY === null || outlierY < 0 || outlierY > chart.paneSize().height) {
			throw new Error(`The shown group is not in the price scale: y(1000) = ${outlierY}`);
		}
		if (series.pointById('inside') === null) { throw new Error('pointById misses a point of a group shown again'); }
	};

	window.finalInteractionsToPerform = () => {
		const inside = series.pointById('inside');
		return [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(inside.x), y: Math.round(inside.y) } }];
	};
	window.afterFinalInteractions = () => {
		const info = lastParam.hoveredInfo;
		if (info === undefined || info.objectId !== 'inside') {
			throw new Error(`The group shown again should be hoverable, got ${JSON.stringify(info && info.objectId)}`);
		}
	};
}
