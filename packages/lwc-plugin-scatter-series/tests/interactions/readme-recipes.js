// The README recipes for general use work: a logarithmic and an inverted Y
// axis keep points, hit tests and pointById in step with the price scale; a
// percentage price scale warns once that it means nothing here; and a click on
// a point reports its objectId to chart.subscribeClick, for selection.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const close = (actual, expected, tolerance, what) => {
		if (actual === null || Math.abs(actual - expected) > tolerance) {
			throw new Error(`${what}: expected ${expected}, got ${actual}`);
		}
	};
	const warnings = [];
	const warn = console.warn;
	console.warn = (...args) => {
		warnings.push(args.join(' '));
		warn.apply(console, args);
	};

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 20, hitTestTolerance: 0 });
	series.setData([
		{ id: 'low', x: 10, y: 1 },
		{ id: 'mid', x: 50, y: 30 },
		{ id: 'high', x: 90, y: 1000 },
	]);
	await frames(3);

	const expectInStep = stage => {
		for (const id of ['low', 'mid', 'high']) {
			const info = series.pointById(id);
			close(info.y, series.series().priceToCoordinate(info.point.y), 1e-6, `${stage}: y of ${id}`);
			const hit = series.hitTest(info.x, info.y);
			if (hit === null || hit.objectId !== id) { throw new Error(`${stage}: ${id} is not hit at its centre`); }
		}
	};
	const linearMid = series.pointById('mid').y;

	// Logarithmic: 30 sits halfway up between 1 and 1000 rather than near the bottom.
	series.series().priceScale().applyOptions({ mode: 1 });
	await frames();
	expectInStep('logarithmic');
	const low = series.pointById('low').y;
	const high = series.pointById('high').y;
	const mid = series.pointById('mid').y;
	if (!(mid < linearMid - 50) || !(mid > high && mid < low)) {
		throw new Error(`The logarithmic scale does not place 30 between 1 and 1000: ${low}, ${mid}, ${high}`);
	}

	// Inverted: the largest value at the bottom.
	series.series().priceScale().applyOptions({ mode: 0, invertScale: true });
	await frames();
	expectInStep('inverted');
	if (!(series.pointById('high').y > series.pointById('low').y)) { throw new Error('The inverted scale does not put 1000 below 1'); }
	series.series().priceScale().applyOptions({ invertScale: false });

	// Percentage and indexed to 100: one warning, however often.
	if (warnings.length !== 0) { throw new Error(`Unexpected warnings: ${warnings}`); }
	series.series().priceScale().applyOptions({ mode: 2 });
	await frames();
	series.series().priceScale().applyOptions({ mode: 3 });
	await frames();
	if (warnings.length !== 1 || !/percentage/.test(warnings[0])) {
		throw new Error(`A percentage price scale should warn once: ${JSON.stringify(warnings)}`);
	}
	series.series().priceScale().applyOptions({ mode: 0 });
	await frames();
	console.warn = warn;

	// Selection: a click on a point reports its objectId.
	const clicked = [];
	chart.subscribeClick(param => clicked.push(param.hoveredInfo?.objectId ?? null));
	const target = series.pointById('mid');
	window.initialInteractionsToPerform = () => [
		{ action: 'clickXY', target: 'pane', options: { x: Math.round(target.x), y: Math.round(target.y) } },
	];
	window.afterInitialInteractions = async () => {
		if (JSON.stringify(clicked) !== JSON.stringify(['mid'])) {
			throw new Error(`subscribeClick should report the clicked point: ${JSON.stringify(clicked)}`);
		}
		// The chart takes a second click within 500 ms for half a double click, and reports no click.
		await new Promise(resolve => setTimeout(resolve, 600));
	};
	// Empty space.
	window.finalInteractionsToPerform = () => [
		{ action: 'clickXY', target: 'pane', options: { x: Math.round(target.x) + 60, y: Math.round(target.y) } },
	];
	window.afterFinalInteractions = () => {
		if (JSON.stringify(clicked) !== JSON.stringify(['mid', null])) {
			throw new Error(`A click on empty space should report no point: ${JSON.stringify(clicked)}`);
		}
	};
}
