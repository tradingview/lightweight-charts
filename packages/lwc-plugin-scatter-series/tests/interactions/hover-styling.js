// Opt-in hover styling. hoveredSizeIncrease grows the hovered point — drawn,
// hit tested and reported by pointById as its radius — and hoveredRingWidth
// draws a ring hoveredRingGap outside it, in hoveredRingColor or the point's
// colour. Both follow setHoveredPoint and the pointer, are drawn on top of the
// neighbours, go when the hover goes, and the price scale keeps room for them.
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
	const blue = [41, 98, 255, 255];
	const red = [242, 54, 69, 255];
	const white = [255, 255, 255, 255];
	// A point `d` pixels from the centre of `info`, up and to the right: off the grid lines through it.
	const at = (info, d) => pixel(info.x + d * Math.SQRT1_2, info.y - d * Math.SQRT1_2);
	const expectPixel = (stage, info, d, colour) => {
		const actual = at(info, d);
		if (!near(actual, colour)) {
			throw new Error(`${stage}: ${d} px from the centre of ${info.objectId} should be ${colour}, got ${actual}`);
		}
	};

	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 20, opacity: 1, color: '#2962FF', strokeWidth: 0, hitTestTolerance: 0 });
	series.setData([{ id: 'a', x: 20, y: 20 }, { id: 'b', x: 50, y: 50 }, { id: 'c', x: 80, y: 80 }]);
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	await frames(3);
	const top = () => series.series().priceToCoordinate(80);
	const topBefore = top();

	series.applyOptions({ hoveredSizeIncrease: 8, hoveredRingWidth: 4, hoveredRingGap: 4, hoveredRingColor: '#F23645' });
	await frames(3);
	// Nothing hovered: nothing grows, but the price scale makes room for a hovered point at an edge:
	// half the growth, the gap and the ring.
	const b = series.pointById('b');
	if (b.radius !== 10) { throw new Error(`An unhovered point grew: radius ${b.radius}`); }
	if (!(top() > topBefore + 6)) { throw new Error(`The price scale keeps no room for the hover styling: ${topBefore} → ${top()}`); }
	expectPixel('not hovered', b, 12, white);

	series.setHoveredPoint('b');
	await frames();
	const hovered = series.pointById('b');
	if (hovered.radius !== 14) { throw new Error(`pointById should report the grown radius 14, got ${hovered.radius}`); }
	if (series.hoveredPoint().radius !== 14) { throw new Error('hoveredPoint() does not report the grown radius'); }
	const notified = changes[changes.length - 1];
	if (notified === null || notified.objectId !== 'b' || notified.radius !== 14) {
		throw new Error(`The subscription should report the grown point: ${JSON.stringify(notified)}`);
	}
	// Marker 0–14 px, gap 14–18, ring 18–22, nothing beyond.
	expectPixel('hovered', hovered, 11, blue);
	expectPixel('hovered', hovered, 16, white);
	expectPixel('hovered', hovered, 20, red);
	expectPixel('hovered', hovered, 25, white);
	// The hit test follows the grown marker, of the hovered point only.
	const hit = series.hitTest(hovered.x + 12.5, hovered.y);
	if (hit === null || hit.objectId !== 'b') { throw new Error('The grown part of the hovered point does not hit'); }
	const a = series.pointById('a');
	if (series.hitTest(a.x + 12.5, a.y) !== null) { throw new Error('A point which is not hovered hits beyond its size'); }

	series.setHoveredPoint(null);
	await frames();
	if (series.pointById('b').radius !== 10) { throw new Error('The point did not shrink back'); }
	if (changes[changes.length - 1] !== null) { throw new Error('Clearing the hover did not notify null'); }
	expectPixel('cleared', b, 20, white);
	expectPixel('cleared', b, 12, white);

	// The pointer: the ring takes the point colour without a ring colour.
	series.applyOptions({ hoveredRingColor: null });
	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(a.x), y: Math.round(a.y) } }];
	window.afterInitialInteractions = async () => {
		await frames();
		const info = series.pointById('a');
		if (info.radius !== 14 || series.hoveredPoint()?.objectId !== 'a') {
			throw new Error(`The point under the pointer should be grown: ${JSON.stringify(info)}`);
		}
		expectPixel('pointer', info, 11, blue);
		expectPixel('pointer', info, 16, white);
		expectPixel('pointer', info, 20, blue);
		const last = changes[changes.length - 1];
		if (last === null || last.objectId !== 'a' || last.radius !== 14) {
			throw new Error(`The subscription should report the point under the pointer, grown: ${JSON.stringify(last)}`);
		}
	};
	// 12 px out, the pointer stays on the grown point (it would leave a 10 px one).
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(a.x + 12), y: Math.round(a.y) } }];
	window.afterFinalInteractions = async () => {
		await frames();
		if (series.hoveredPoint()?.objectId !== 'a') {
			throw new Error('The pointer 12 px from the centre left the grown hovered point');
		}
	};
}
