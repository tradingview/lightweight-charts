// Points sharing an id: the pointer hovers, highlights and reports the point
// actually under it (by data index), pointById finds the first one, and the
// series warns once, so the host learns its ids are not unique.
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
	const opaque = rgba => Math.abs(rgba[0] - 41) <= 3 && Math.abs(rgba[1] - 98) <= 3 && Math.abs(rgba[2] - 255) <= 3;

	const warnings = [];
	const warn = console.warn;
	console.warn = (...args) => { warnings.push(args.join(' ')); };
	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 0.4 });
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	series.setData([
		{ id: 'dup', x: 10, y: 10 },
		{ id: 'other', x: 50, y: 50 },
		{ id: 'dup', x: 90, y: 90, title: 'second' },
	]);
	series.setData([
		{ id: 'dup', x: 10, y: 10 },
		{ id: 'other', x: 50, y: 50 },
		{ id: 'dup', x: 90, y: 90, title: 'second' },
	]);
	console.warn = warn;
	await frames(3);
	if (warnings.length !== 1 || !/share an id/.test(warnings[0])) { throw new Error(`Duplicate ids should warn once: ${JSON.stringify(warnings)}`); }
	const first = series.pointById('dup');
	if (first === null || first.index !== 0) { throw new Error(`pointById should find the first point with the id: ${JSON.stringify(first)}`); }
	// The geometry of the second one, from its neighbours on a linear axis.
	const other = series.pointById('other');
	const second = { x: other.x + (other.x - first.x), y: other.y + (other.y - first.y) };
	const apiHit = series.hitTest(second.x, second.y);
	if (apiHit === null || apiHit.index !== 2 || apiHit.point.title !== 'second') { throw new Error(`hitTest should find the second point: ${JSON.stringify(apiHit)}`); }

	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(second.x), y: Math.round(second.y) } }];
	window.afterInitialInteractions = async () => {
		await frames();
		const hovered = series.hoveredPoint();
		if (hovered === null || hovered.index !== 2 || hovered.point.title !== 'second') {
			throw new Error(`The point under the pointer should be hovered: ${JSON.stringify(hovered)}`);
		}
		const notified = changes[changes.length - 1];
		if (notified === null || notified.index !== 2) { throw new Error(`The subscription should report the second point: ${JSON.stringify(notified)}`); }
		if (!opaque(pixel(second.x, second.y))) { throw new Error(`The point under the pointer is not highlighted: ${pixel(second.x, second.y)}`); }
		if (opaque(pixel(first.x, first.y))) { throw new Error('The first point with the id was highlighted instead'); }
	};
}
