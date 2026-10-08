// Zooming with the wheel, the series keeps the label distance it gave the
// chart (timeScale.tickMarkMaxCharacterLength) as long as the chart draws the
// same labels with it: applying it again is a full update of the chart, which
// would come on top of the zoom's own repaint at almost every step.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	container.style.width = '600px';
	container.style.height = '400px';
	const chart = LwcPlugin.createScatterChart(container, { handleScroll: true, handleScale: true, layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart);
	// A seeded generator (mulberry32).
	let state = 3;
	const random = () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	series.setData(Array.from({ length: 300 }, () => ({ x: random() * 100, y: random() * 50 })));
	await frames(3);
	const applied = [];
	const applyOptions = chart.applyOptions.bind(chart);
	chart.applyOptions = options => {
		if (options.timeScale?.tickMarkMaxCharacterLength !== undefined) {
			applied.push(options.timeScale.tickMarkMaxCharacterLength);
		}
		return applyOptions(options);
	};
	const timeScale = chart.timeScale();
	const fitted = timeScale.options().barSpacing;
	const pane = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas').getBoundingClientRect();
	const move = { action: 'moveMouseXY', target: 'pane', options: { x: Math.round(pane.width * 0.4), y: Math.round(pane.height / 2) } };
	const steps = 25;
	window.initialInteractionsToPerform = () => [move, ...Array.from({ length: steps }, () => ({ action: 'scrollUp' }))];
	window.afterInitialInteractions = async () => {
		await frames(3);
		const zoomed = timeScale.options().barSpacing;
		if (!(zoomed > fitted * 1.3)) { throw new Error(`The wheel did not zoom in: ${fitted} → ${zoomed}`); }
		if (applied.length > 2) { throw new Error(`Zooming in ${steps} steps applied the label distance ${applied.length} times`); }
		applied.length = 0;
	};
	window.finalInteractionsToPerform = () => [move, ...Array.from({ length: steps }, () => ({ action: 'scrollDown' }))];
	// The runner waits a frame and more after this: an error thrown then fails the case as a page error.
	window.afterFinalInteractions = async () => {
		await frames();
		if (applied.length > 2) { throw new Error(`Zooming out ${steps} steps applied the label distance ${applied.length} times`); }
		chart.applyOptions = applyOptions;
	};
}
