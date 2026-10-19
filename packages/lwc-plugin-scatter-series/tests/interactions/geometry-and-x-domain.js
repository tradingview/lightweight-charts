// pointById reports where a point is drawn: Y from the underlying series'
// priceToCoordinate, X linear over the X domain, whose ends sit on the left and
// right edges of the plot — and stay there when the container is resized.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	const chart = LwcPlugin.createScatterChart(container, { autoSize: true, layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart);
	const points = [];
	for (let i = 0; i <= 18; i++) {
		points.push({ id: `p${i}`, x: i * 5, y: Math.round(Math.sin(i) * 1000) / 10, label: `point ${i}` });
	}
	series.setData(points);
	await frames();

	const check = stage => {
		const domain = series.xDomain();
		if (domain.min !== 0 || domain.max !== 90 || domain.tickStep !== 10) {
			throw new Error(`${stage}: unexpected X domain ${JSON.stringify(domain)}`);
		}
		const width = chart.timeScale().width();
		const pane = chart.paneSize();
		if (width !== pane.width) { throw new Error(`${stage}: time scale width ${width} differs from the pane ${pane.width}`); }
		for (const point of points) {
			const info = series.pointById(point.id);
			if (info === null) { throw new Error(`${stage}: ${point.id} at x=${point.x} is not drawn`); }
			if (info.point !== point || info.point.label !== point.label) { throw new Error(`${stage}: pointById lost the point`); }
			const y = series.series().priceToCoordinate(point.y);
			if (Math.abs(info.y - y) > 1e-6) { throw new Error(`${stage}: ${point.id} y ${info.y} differs from priceToCoordinate ${y}`); }
			const x = ((point.x - domain.min) / (domain.max - domain.min)) * (width - 1);
			if (Math.abs(info.x - x) > 0.5) { throw new Error(`${stage}: ${point.id} x ${info.x}, expected ${x} for width ${width}`); }
		}
		const first = series.pointById('p0');
		const last = series.pointById('p18');
		if (Math.abs(first.x) > 0.5 || Math.abs(last.x - (width - 1)) > 0.5) {
			throw new Error(`${stage}: the domain ends are not at the plot edges: ${first.x}, ${last.x} for width ${width}`);
		}
		const hit = series.hitTest(first.x, first.y);
		if (hit === null || hit.objectId !== 'p0') { throw new Error(`${stage}: the point on the left edge is not hit`); }
		return width;
	};

	const before = check('initial');

	container.style.width = '420px';
	await frames(4);
	const narrow = check('after narrowing the container');
	if (narrow >= before) { throw new Error(`The chart did not shrink: ${before} -> ${narrow}`); }

	container.style.width = '100%';
	await frames(4);
	const restored = check('after widening the container');
	if (restored !== before) { throw new Error(`The chart did not grow back: ${before} -> ${restored}`); }

	// The pointer finds the point on the right edge.
	const edge = series.pointById('p18');
	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.floor(edge.x) - 1, y: Math.round(edge.y) } },
	];
	window.afterInitialInteractions = () => {
		const info = lastParam && lastParam.hoveredInfo;
		if (!info || info.objectId !== 'p18') {
			throw new Error(`The point on the right edge is not hoverable: ${JSON.stringify(info && info.objectId)}`);
		}
	};
}
