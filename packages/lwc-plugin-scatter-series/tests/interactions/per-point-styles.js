// Per-point shapes, strokes and hollow markers. A point's shape beats its
// group's and the series': it is drawn, hit tested (by the pointer too) and
// reported with it. Hollow markers are an outline in the point colour with
// nothing inside, hover over their whole area, and are reported with their
// resolved stroke; groups() resolves the same for a legend. Restyling repaints
// without setting the slots again.
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
	const green = [8, 153, 129, 255];
	const blue = [41, 98, 255, 255];
	const red = [242, 54, 69, 255];
	const black = [0, 0, 0, 255];
	const white = [255, 255, 255, 255];
	// `d` pixels from the centre of `info`, up and to the right.
	const expectPixel = (stage, info, d, colour) => {
		const actual = pixel(info.x + d * Math.SQRT1_2, info.y - d * Math.SQRT1_2);
		if (!near(actual, colour)) {
			throw new Error(`${stage}: ${d} px from the centre of ${info.objectId} should be ${colour}, got ${actual}`);
		}
	};
	const expectFields = (what, actual, expected) => {
		for (const key of Object.keys(expected)) {
			if (actual === null || actual[key] !== expected[key]) {
				throw new Error(`${what}: ${key} should be ${expected[key]}, got ${actual === null ? 'null' : actual[key]}`);
			}
		}
	};

	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 1,
		pointSize: 30,
		hitTestTolerance: 0,
		groups: [
			{ id: 'open', color: '#089981', hollow: true, strokeWidth: 3 },
			{ id: 'ringed', color: '#2962FF', strokeColor: '#000000', strokeWidth: 4, shape: 'square' },
		],
	});
	series.setData([
		{ id: 'tri', x: 20, y: 20, shape: 'triangleUp', color: '#2962FF' },
		{ id: 'open', x: 50, y: 50, group: 'open' },
		{ id: 'ringed', x: 80, y: 80, group: 'ringed' },
		{ id: 'override', x: 50, y: 15, group: 'open', hollow: false, strokeColor: '#F23645', strokeWidth: 5, shape: 'diamond' },
		{ id: 'low', x: 0, y: 0, size: 5 },
		{ id: 'high', x: 100, y: 100, size: 5 },
	]);
	await frames(3);

	// A per-point shape beats the series' circle.
	const tri = series.pointById('tri');
	expectFields('tri', tri, { shape: 'triangleUp', hollow: false, strokeColor: '#FFFFFF', strokeWidth: 1 });
	// Beside its tip, inside its circle but outside the triangle: not hit, not painted.
	if (series.hitTest(tri.x + 9, tri.y - 9) !== null) { throw new Error('The triangle is hit beside its tip'); }
	expectPixel('triangle tip', tri, 12.7, white);
	// Its base corner, outside its circle: hit.
	const corner = series.hitTest(tri.x + 13, tri.y + 13);
	if (corner === null || corner.objectId !== 'tri') { throw new Error('The base corner of the triangle is not hit'); }

	// A hollow group: the outline in the group colour, empty inside, hovered over its whole area.
	const open = series.pointById('open');
	expectFields('open', open, { shape: 'circle', hollow: true, strokeColor: '#089981', strokeWidth: 3, radius: 15 });
	expectPixel('hollow outline', open, 13.5, green);
	expectPixel('hollow inside', open, 5, white);
	const inside = series.hitTest(open.x, open.y);
	if (inside === null || inside.objectId !== 'open') { throw new Error('The inside of a hollow point does not hit'); }

	// A group stroke: black, 4 px, around the blue fill.
	const ringed = series.pointById('ringed');
	expectFields('ringed', ringed, { shape: 'square', hollow: false, strokeColor: '#000000', strokeWidth: 4 });
	expectPixel('group stroke', ringed, 13 * Math.SQRT2, black);
	expectPixel('group fill', ringed, 5, blue);

	// The point beats its hollow group: filled, a red 5 px stroke, a diamond.
	const override = series.pointById('override');
	expectFields('override', override, { shape: 'diamond', hollow: false, strokeColor: '#F23645', strokeWidth: 5 });
	if (!near(pixel(override.x, override.y - 13), red)) { throw new Error(`The point's stroke is not painted: ${pixel(override.x, override.y - 13)}`); }
	if (!near(pixel(override.x, override.y - 5), green)) { throw new Error(`The point's fill is not painted: ${pixel(override.x, override.y - 5)}`); }

	// The legend view of the groups.
	const [openGroup, ringedGroup] = series.groups();
	expectFields('open group', openGroup, { hollow: true, strokeColor: '#089981', strokeWidth: 3 });
	expectFields('ringed group', ringedGroup, { hollow: false, strokeColor: '#000000', strokeWidth: 4, shape: 'square' });

	// Series-wide hollow points restyle without new slots; the group and point settings still win.
	const underlying = series.series();
	let setDataCalls = 0;
	const setData = underlying.setData.bind(underlying);
	underlying.setData = data => { setDataCalls++; setData(data); };
	series.applyOptions({ hollow: true, strokeWidth: 0 });
	await frames();
	if (setDataCalls !== 0) { throw new Error(`Restyling set the slots ${setDataCalls} times`); }
	// The outline of a hollow point is at least 1 px.
	expectFields('tri hollow', series.pointById('tri'), { hollow: true, strokeColor: '#2962FF', strokeWidth: 1 });
	expectFields('ringed after', series.pointById('ringed'), { hollow: true, strokeColor: '#000000', strokeWidth: 4 });
	expectFields('override after', series.pointById('override'), { hollow: false });
	expectPixel('ringed hollow', ringed, 5, white);

	// The pointer hovers the triangle by its shape, as hitTest does.
	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(tri.x + 9), y: Math.round(tri.y - 9) } }];
	window.afterInitialInteractions = () => {
		if (lastParam === null || (lastParam.hoveredInfo !== undefined && lastParam.hoveredInfo.objectId !== undefined)) {
			throw new Error(`The pointer beside the triangle's tip hovered ${JSON.stringify(lastParam && lastParam.hoveredInfo && lastParam.hoveredInfo.objectId)}`);
		}
	};
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(tri.x + 12), y: Math.round(tri.y + 12) } }];
	window.afterFinalInteractions = () => {
		if (lastParam.hoveredInfo === undefined || lastParam.hoveredInfo.objectId !== 'tri') {
			throw new Error('The pointer on the triangle\'s base corner did not hover it');
		}
		if (series.hoveredPoint()?.shape !== 'triangleUp') { throw new Error('hoveredPoint() lost the per-point shape'); }
	};
}
