// With scrolling and zooming on, whether the X axis follows the fit is decided
// by how far it is zoomed out, never by where the domain sits. Real wheel
// gestures that zoom out and pan at once (a trackpad swipe) keep one end of
// the domain off the plot while it shrinks: once zoomed out as far as the fit,
// the series sets the fit — the domain neither stays zoomed out and pushed
// aside, nor snaps back later when a pan brings its far end in. A pan at the
// zoom of the fit springs back to the fit, leaving no drift: at fixed edges,
// and at free ones (where the fit keeps the end labels' room inside the plot).
// The chart's own reset of the time axis (a double-click on
// it, `axisDoubleClickReset`), which sets the `barSpacing` option — more
// zoomed in than the fit on a narrow chart — lands on the fit too.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const box = (top, width, height) => {
		const element = document.createElement('div');
		element.style.cssText = `position: absolute; left: 0; top: ${top}px; width: ${width}px; height: ${height}px;`;
		container.appendChild(element);
		return element;
	};
	const movable = { autoSize: true, handleScroll: true, handleScale: true, layout: { attributionLogo: false } };
	const make = (name, element, chartOptions, points) => {
		const chart = LwcPlugin.createScatterChart(element, { ...movable, ...chartOptions });
		const series = LwcPlugin.createScatterSeries(chart);
		series.setData(points);
		return { name, element, chart, series };
	};
	const wave = count => Array.from({ length: count }, (_, i) => ({ x: i * 5, y: Math.sin(i) }));

	// The first chart, whose time axis the double-click hits: 101 slots on a
	// 300 px chart, so the default barSpacing of 6 px is twice the fit's.
	const narrow = make('narrow chart', box(0, 300, 180), {}, wave(21));
	const fixed = make('fixed edges', box(190, 600, 200), {}, wave(21));
	const free = make('free edges', box(400, 600, 200), { timeScale: { fixLeftEdge: false, fixRightEdge: false } }, wave(21));
	await frames(4);

	const ends = item => {
		const timeScale = item.chart.timeScale();
		const domain = item.series.xDomain();
		return { left: timeScale.timeToCoordinate(domain.min), right: timeScale.timeToCoordinate(domain.max), width: timeScale.width() };
	};
	// The fit: edge to edge at fixed edges; at free ones, the end labels' room inside them.
	for (const item of [narrow, fixed, free]) {
		const { left, right, width } = ends(item);
		item.room = { left, right: width - 1 - right };
		const edgeToEdge = item !== free;
		if (edgeToEdge ? Math.abs(left) > 0.5 || Math.abs(item.room.right) > 0.5 : !(left > 1 && item.room.right > 1)) {
			throw new Error(`${item.name}: unexpected fit ${left}…${right} of ${width}`);
		}
	}
	/** The ends of the domain where the fit puts them, at the spacing of the fit. */
	const expectFitted = (item, stage) => {
		const { left, right, width } = ends(item);
		if (left === null || right === null || Math.abs(left - item.room.left) > 0.5 || Math.abs(right - (width - 1 - item.room.right)) > 0.5) {
			throw new Error(`${item.name}, ${stage}: the domain spans ${left}…${right} of a ${width} px plot, not the fit`);
		}
	};
	if (!(narrow.chart.timeScale().options().barSpacing < 4)) {
		throw new Error(`The narrow chart should fit at less than the default bar spacing: ${narrow.chart.timeScale().options().barSpacing}`);
	}

	// The spacing whenever the visible range changes, to tell a snap.
	const spacings = new Map();
	for (const item of [fixed, free]) {
		spacings.set(item, []);
		item.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
			spacings.get(item).push(item.chart.timeScale().options().barSpacing);
		});
	}

	const paneCentre = item => {
		const pane = item.chart.chartElement().querySelector('tr:nth-of-type(1) td:nth-of-type(2)').getBoundingClientRect();
		const host = container.getBoundingClientRect();
		return { x: Math.round(pane.left - host.left + pane.width / 2), y: Math.round(pane.top - host.top + pane.height / 2) };
	};
	const repeat = (count, action) => Array.from({ length: count }, () => ({ action }));
	const gesture = item => [
		{ action: 'moveMouseXY', target: 'container', options: paneCentre(item) },
		// Zoom in, then zoom out and pan together: one end stays off the plot.
		...repeat(25, 'scrollUp'),
		...repeat(40, 'scrollUpRight'),
		// Then pan the other way, at the zoom of the fit.
		...repeat(8, 'scrollLeft'),
	];
	window.initialInteractionsToPerform = () => [
		{ action: 'doubleClick', target: 'timescale' },
		...gesture(fixed),
		...gesture(free),
	];
	window.afterInitialInteractions = async () => {
		await frames(4);
		expectFitted(narrow, 'after a double-click on the time axis');
		for (const item of [fixed, free]) {
			const seen = spacings.get(item);
			if (seen.length === 0 || !(Math.max(...seen) > 1.15 * Math.min(...seen))) {
				throw new Error(`${item.name}: the wheel did not zoom: ${seen.length} range changes`);
			}
			expectFitted(item, 'after zooming out and panning together, then panning at the fit');
			// Never further out than the fit (the free edges let the chart go much further).
			const fit = item.chart.timeScale().options().barSpacing;
			const least = Math.min(...seen);
			if (least < 0.97 * fit) {
				throw new Error(`${item.name}: zoomed out to ${least} px a slot, further than the fit (${fit}) was kept`);
			}
		}
		// A resize keeps every chart fitted: the series still follows the fit.
		for (const item of [narrow, fixed, free]) {
			item.element.style.width = `${parseFloat(item.element.style.width) - 37}px`;
		}
		await frames(5);
		for (const item of [narrow, fixed, free]) {
			expectFitted(item, 'after a resize');
		}
	};
}
