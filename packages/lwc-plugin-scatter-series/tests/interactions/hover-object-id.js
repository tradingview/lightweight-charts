// A real pointer over a point: the chart reports it as `hoveredInfo.objectId`
// (although the crosshair is hidden), the series' hovered-point subscription
// fires — after the paint — with the point as given to setData and its drawn
// geometry, the cursor becomes a pointer and the point is repainted at full
// opacity. Empty space reports no object.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected, tolerance) => expected.every((value, i) => Math.abs(actual[i] - value) <= tolerance);

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const points = [
		{ id: 'a', x: 10, y: 10, title: 'Alpha' },
		{ id: 'b', x: 50, y: 50, title: 'Beta' },
		{ id: 'c', x: 90, y: 90, title: 'Gamma' },
	];
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 20, color: '#2962FF', opacity: 0.5 });
	series.setData(points);

	let lastParam = null;
	let moves = 0;
	chart.subscribeCrosshairMove(param => {
		lastParam = param;
		moves++;
	});
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	await frames();

	const b = series.pointById('b');
	if (b === null) { throw new Error('pointById returned null for a drawn point'); }
	const translucent = pixel(b.x, b.y);
	if (near(translucent, [41, 98, 255, 255], 6)) {
		throw new Error(`A point at opacity 0.5 was painted opaque before hover: ${translucent}`);
	}

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(b.x) + 3, y: Math.round(b.y) - 2 } },
	];
	window.afterInitialInteractions = async () => {
		if (moves === 0 || lastParam === null) { throw new Error('No crosshair move was reported with the hidden crosshair'); }
		if (series.hoveredPoint() === null || series.hoveredPoint().objectId !== 'b') { throw new Error('hoveredPoint() is not "b" right after the move'); }
		// The subscription runs after the paint.
		await frames();
		const info = lastParam.hoveredInfo;
		if (info === undefined || info.objectId !== 'b') {
			throw new Error(`hoveredInfo.objectId should be "b", got ${JSON.stringify(info && info.objectId)}`);
		}
		if (info.series !== series.series()) { throw new Error('hoveredInfo.series is not the underlying series'); }
		const last = changes[changes.length - 1];
		if (changes.length !== 1 || last === null || last.objectId !== 'b' || last.point !== points[1] || last.point.title !== 'Beta') {
			throw new Error(`The hovered-point subscription fired wrongly: ${JSON.stringify(changes.map(c => c && c.objectId))}`);
		}
		if (last.x !== b.x || last.y !== b.y || last.radius !== 10 || last.groupId !== null || last.index !== 1) {
			throw new Error(`The notified geometry differs from pointById: ${JSON.stringify(last)} vs ${JSON.stringify(b)}`);
		}
		if (chart.chartElement().style.cursor !== 'pointer') {
			throw new Error(`The cursor over a point should be a pointer, got "${chart.chartElement().style.cursor}"`);
		}
		const opaque = pixel(b.x, b.y);
		if (!near(opaque, [41, 98, 255, 255], 2)) {
			throw new Error(`The hovered point should be painted at hoveredOpacity 1: ${opaque}`);
		}
		const a = series.pointById('a');
		const other = pixel(a.x, a.y);
		if (near(other, [41, 98, 255, 255], 6)) { throw new Error('A point which is not hovered was painted opaque'); }
	};

	// Halfway between two points, far from both.
	const c = series.pointById('c');
	const empty = { x: Math.round((b.x + c.x) / 2), y: Math.round(b.y) };
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: empty }];
	window.afterFinalInteractions = () => {
		const info = lastParam.hoveredInfo;
		if (info !== undefined && info.objectId !== undefined) {
			throw new Error(`Empty space reported an object: ${JSON.stringify(info.objectId)}`);
		}
		if (lastParam.hoveredSeries !== undefined) { throw new Error('Empty space reported the scatter series as hovered'); }
		if (series.hoveredPoint() !== null) { throw new Error('hoveredPoint() is not null over empty space'); }
		if (chart.chartElement().style.cursor === 'pointer') { throw new Error('The cursor stayed a pointer over empty space'); }
		// The runner waits a frame after this; an error thrown then fails the case as a page error.
		requestAnimationFrame(() => {
			if (changes.length !== 2 || changes[1] !== null) {
				throw new Error(`Leaving the point should notify null once: ${JSON.stringify(changes.map(c => c && c.objectId))}`);
			}
		});
	};
}
