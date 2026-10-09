// Options and data are taken all or nothing. `null` for an option holding an
// object or an array (xRange, yRange, sizeRange, sizeDomain, plotBorder,
// groups, baselines …) sets it back to its default, from JavaScript callers;
// own `__proto__` keys (JSON.parse) are ignored. Options the series cannot use
// — data that is not an array of points, an `xFormatter` that throws — make
// the call throw with nothing changed: the series keeps its options, points
// and axis, and works on. A series whose options throw when it is created
// leaves the chart as it was — no series, no subscription, its own label
// distance — and another can be created. Options of the underlying series
// the chart refuses throw with nothing changed too, the scatter options given
// with them included. X values too large for the axis (beyond ±1e300) are not
// drawn, with one warning; X values spanning less than the axis can tell apart
// (1e-98) widen it, with one warning, and are drawn.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const throws = (what, run) => {
		let error = null;
		try {
			run();
		} catch (caught) {
			error = caught;
		}
		if (error === null) { throw new Error(`${what} did not throw`); }
		return error;
	};

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false }, timeScale: { tickMarkMaxCharacterLength: 9 } });

	// A throwing xFormatter: the series is not created, and the chart is left alone.
	const failing = () => { throw new Error('formatter failure'); };
	const error = throws('createScatterSeries with a throwing xFormatter', () => LwcPlugin.createScatterSeries(chart, { xFormatter: failing }));
	if (!/formatter failure/.test(String(error))) { throw new Error(`The formatter's own error should come through: ${error}`); }
	if (chart.panes()[0].getSeries().length !== 0) { throw new Error('A series that failed to be created is left on the chart'); }
	if (chart.options().timeScale.tickMarkMaxCharacterLength !== 9) { throw new Error('A series that failed to be created changed the label distance'); }

	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 12 });
	const points = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 50, y: 5 }, { id: 'c', x: 100, y: 10 }];
	series.setData(points);
	await frames(3);
	const options = () => JSON.stringify(series.options(), (key, value) => (typeof value === 'function' ? 'fn' : value));
	const domain = () => JSON.stringify(series.xDomain());
	const b = () => series.pointById('b');

	// null for an object or array option: the default.
	series.applyOptions({ xRange: { min: -50, max: 150 }, yRange: { min: -5, max: 20 }, sizeDomain: { min: 1, max: 2 }, plotBorder: { visible: true } });
	await frames(2);
	series.applyOptions({ xRange: null, yRange: null, sizeRange: null, sizeDomain: null, plotBorder: null, groups: null, baselines: null, palette: null });
	await frames(3);
	const reset = series.options();
	const defaults = LwcPlugin.defaultOptions;
	for (const key of ['xRange', 'yRange', 'sizeRange', 'sizeDomain', 'plotBorder', 'groups', 'baselines', 'palette']) {
		if (JSON.stringify(reset[key]) !== JSON.stringify(defaults[key])) { throw new Error(`${key}: null should set the default, got ${JSON.stringify(reset[key])}`); }
	}
	if (domain() !== JSON.stringify({ min: 0, max: 100, tickStep: 10 })) { throw new Error(`The automatic X domain should be back: ${domain()}`); }
	series.setData(points.concat([{ id: 'd', x: 120, y: 3 }]));
	series.applyOptions({ opacity: 0.5 });
	await frames(2);
	if (b() === null || series.pointById('d') === null) { throw new Error('The series stopped working after null options'); }
	series.setData(points);
	await frames(2);

	// An own __proto__ key changes nothing but what it holds beside it.
	series.applyOptions(JSON.parse('{"__proto__": {"pointSize": 40}, "xRange": {"__proto__": {"min": 7}, "max": null}}'));
	await frames(2);
	if (series.options().pointSize !== 12 || series.options().xRange.min !== null) { throw new Error(`__proto__ keys were taken: ${JSON.stringify(series.options())}`); }
	if (Object.getPrototypeOf(series.options()) !== Object.prototype || {}.pointSize !== undefined) { throw new Error('A prototype was changed'); }

	// Options that throw: nothing changes, the series works on.
	const before = options();
	const beforeDomain = domain();
	const beforeB = JSON.stringify(b());
	throws('applyOptions with baselines that are not an array', () => series.applyOptions({ baselines: 5, xRange: { min: -200, max: 200 }, pointSize: 30 }));
	throws('applyOptions with a throwing xFormatter', () => series.applyOptions({ xFormatter: failing, xRange: { min: -200, max: 200 } }));
	throws('applyOptions with a throwing xFormatter and a new colour', () => series.applyOptions({ xFormatter: failing, color: '#F23645' }));
	throws('setData with something that is not a list of points', () => series.setData([{ x: 1, y: 1 }, null]));
	await frames(3);
	if (options() !== before) { throw new Error(`Options that threw changed the options: ${options()}`); }
	if (domain() !== beforeDomain) { throw new Error(`Options that threw changed the X domain: ${domain()}`); }
	if (JSON.stringify(b()) !== beforeB) { throw new Error(`Options that threw changed a point: ${JSON.stringify(b())}`); }
	if (series.data().length !== 3) { throw new Error('Data that threw replaced the points'); }
	series.applyOptions({ pointSize: 20 });
	series.setData(points.slice(0, 2));
	await frames(3);
	if (b() === null || Math.abs(b().radius - 10) > 0.01 || series.data().length !== 2) { throw new Error('The series stopped working after options that threw'); }

	// X values too large for the axis: not drawn, the others are, with one warning.
	const warnings = [];
	const warn = console.warn;
	console.warn = (...args) => warnings.push(args.join(' '));
	try {
		series.setData(points.concat([{ id: 'far', x: 1e308, y: 3 }, { id: 'farther', x: -1e305, y: 4 }]));
		series.setData(points.concat([{ id: 'far', x: 1e308, y: 3 }]));
		await frames(3);
	} finally {
		console.warn = warn;
	}
	if (series.pointById('far') !== null || b() === null || domain() !== beforeDomain) { throw new Error(`X values beyond the axis: ${domain()}`); }
	if (warnings.length !== 1 || !/beyond/.test(warnings[0])) { throw new Error(`Expected one warning about X values beyond the axis: ${JSON.stringify(warnings)}`); }

	// A series option the chart refuses, given with a scatter option: neither is taken.
	const opacity = series.options().opacity;
	throws('applyOptions with a custom price format without a formatter', () => series.applyOptions({ opacity: 0.2, priceFormat: { type: 'custom' } }));
	if (series.options().opacity !== opacity) { throw new Error(`A refused series option let the scatter options through: ${series.options().opacity}`); }
	if (series.series().options().priceFormat.type !== 'price') { throw new Error(`A refused price format was kept: ${JSON.stringify(series.series().options().priceFormat)}`); }
	await frames(3);
	if (b() === null) { throw new Error('The series stopped drawing after a refused series option'); }

	// X values too close together for the axis: the axis is widened, the points drawn.
	warnings.length = 0;
	console.warn = (...args) => warnings.push(args.join(' '));
	try {
		series.setData([{ id: 'tiny', x: 1e-300, y: 1 }, { id: 'tinier', x: 2e-300, y: 2 }]);
		series.setData([{ id: 'tiny', x: 1e-300, y: 1 }, { id: 'tinier', x: 3e-300, y: 2 }]);
		await frames(3);
	} finally {
		console.warn = warn;
	}
	if (series.pointById('tiny') === null || series.pointById('tinier') === null) { throw new Error('Points of a tiny X span are not drawn'); }
	if (warnings.length !== 1 || !/1e-98/.test(warnings[0])) { throw new Error(`Expected one warning about a tiny X span: ${JSON.stringify(warnings)}`); }
}
