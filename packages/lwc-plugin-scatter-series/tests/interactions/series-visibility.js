// A series hidden with `visible: false` has no points: pointById, hitTest and
// hoveredPoint return null, nothing is highlighted, and the subscription is
// told `null` — although a point is still hovered through the API. Shown
// again, the point hovered through the API comes back.
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
	const WHITE = [255, 255, 255, 255];
	const BLUE = [41, 98, 255, 255];

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 0.4 });
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	series.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 50, y: 50 }, { id: 'c', x: 100, y: 100 }]);
	await frames(3);
	series.setHoveredPoint('b');
	await frames(3);
	const b = series.pointById('b');
	// Off the grid lines through the centre.
	const inside = { x: b.x + 6, y: b.y + 6 };
	if (changes.length !== 1 || changes[0].objectId !== 'b') { throw new Error('setHoveredPoint was not notified'); }
	if (!near(pixel(inside.x, inside.y), BLUE)) { throw new Error(`The hovered point is not highlighted: ${pixel(inside.x, inside.y)}`); }

	series.applyOptions({ visible: false });
	await frames(3);
	if (series.pointById('b') !== null || series.pointById('a') !== null) { throw new Error('pointById returned a point of a hidden series'); }
	if (series.hitTest(b.x, b.y) !== null) { throw new Error('hitTest found a point of a hidden series'); }
	if (series.hoveredPoint() !== null) { throw new Error('hoveredPoint() returned a point of a hidden series'); }
	if (changes.length !== 2 || changes[1] !== null) { throw new Error(`Hiding the series should notify null: ${JSON.stringify(changes)}`); }
	if (!near(pixel(inside.x, inside.y), WHITE)) { throw new Error(`A hidden series is still painted: ${pixel(inside.x, inside.y)}`); }

	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(b.x), y: Math.round(b.y) } }];
	window.afterInitialInteractions = async () => {
		await frames();
		if (lastParam && lastParam.hoveredInfo && lastParam.hoveredInfo.objectId !== undefined) {
			throw new Error(`The pointer hovered a point of a hidden series: ${lastParam.hoveredInfo.objectId}`);
		}
		if (series.hoveredPoint() !== null || changes.length !== 2) { throw new Error('The pointer over a hidden series changed the hovered point'); }

		series.applyOptions({ visible: true });
		await frames(3);
		const back = changes[changes.length - 1];
		if (changes.length !== 3 || back === null || back.objectId !== 'b') {
			throw new Error(`Showing the series again should notify the hovered point: ${JSON.stringify(changes)}`);
		}
	};
}
