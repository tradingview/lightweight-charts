// With zooming switched back on, the user's zoom survives data refreshes on the
// same X domain, option changes, resizes and changes the chart refuses (rolled
// back after the series gave the chart the new slots); a new X domain, or fitXDomain(),
// fits the whole domain to the plot again. Zoomed into a part of the axis, the
// price scale fits the points in view: the end slots, which always carry a
// value, never drag it towards points out of view.
//
// Zoomed out with the wheel as far as the chart goes — at the fixed edges it
// stops a few pixels short of the fit, and with xMargins (free edges) it would
// shrink the domain away from the margins — the whole domain is in view: the
// series fits it exactly, edge to edge or margin to margin, and keeps it fitted
// through a resize.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const same = (a, b) => a !== null && b !== null && Math.abs(a.from - b.from) < 1e-3 && Math.abs(a.to - b.to) < 1e-3;

	container.style.width = '600px';
	const box = (top, height) => {
		const element = document.createElement('div');
		element.style.cssText = `position: absolute; left: 0; top: ${top}px; width: 100%; height: ${height}px;`;
		container.appendChild(element);
		return element;
	};
	const zoomable = { autoSize: true, handleScroll: true, handleScale: true, layout: { attributionLogo: false } };
	const chart = LwcPlugin.createScatterChart(box(0, 260), zoomable);

	// Two more charts below, zoomed out with the wheel: fixed edges, and margins.
	const outward = [
		{ name: 'fixed edges', margin: 0, top: 260 },
		{ name: 'margins', margin: 20, top: 430 },
	].map(item => {
		const element = box(item.top, 170);
		const itemChart = LwcPlugin.createScatterChart(element, zoomable);
		const itemSeries = LwcPlugin.createScatterSeries(itemChart, { xMargins: item.margin });
		itemSeries.setData(Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: Math.cos(i) })));
		return { ...item, chart: itemChart, series: itemSeries };
	});
	const atEnds = (item, stage) => {
		const itemScale = item.chart.timeScale();
		const domain = item.series.xDomain();
		const left = itemScale.timeToCoordinate(domain.min);
		const right = itemScale.timeToCoordinate(domain.max);
		const width = itemScale.width();
		if (Math.abs(left - item.margin) > 0.5 || Math.abs(right - (width - 1 - item.margin)) > 0.5) {
			throw new Error(`${item.name}, ${stage}: the domain ends are at ${left} and ${right}, expected ${item.margin} and ${width - 1 - item.margin}`);
		}
	};
	const timeScale = chart.timeScale();
	const series = LwcPlugin.createScatterSeries(chart);
	const points = shift => Array.from({ length: 21 }, (_, i) => ({ id: `p${i}`, x: i * 5, y: Math.sin(i + shift) * 100 }));
	series.setData(points(0));
	await frames(3);
	const fitted = timeScale.getVisibleLogicalRange();
	const isFitted = stage => {
		const domain = series.xDomain();
		const left = timeScale.timeToCoordinate(domain.min);
		const right = timeScale.timeToCoordinate(domain.max);
		if (Math.abs(left) > 0.5 || Math.abs(right - (timeScale.width() - 1)) > 0.5) {
			throw new Error(`${stage}: the domain is not fitted: ${left}…${right} of ${timeScale.width()}`);
		}
	};
	isFitted('initially');

	await frames(2);
	const zoomOut = item => {
		const pane = item.chart.chartElement().querySelector('tr:nth-of-type(1) td:nth-of-type(2)').getBoundingClientRect();
		return [
			{ action: 'moveMouseXY', target: 'container', options: { x: Math.round(pane.left + pane.width / 2), y: Math.round(pane.top + pane.height / 2) } },
			{ action: 'scrollDown' },
			{ action: 'scrollDown' },
			{ action: 'scrollDown' },
		];
	};
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseCenter', target: 'pane' },
		{ action: 'scrollUp' },
		{ action: 'scrollUp' },
		{ action: 'scrollUp' },
		{ action: 'scrollUp' },
		...zoomOut(outward[0]),
		...zoomOut(outward[1]),
	];
	window.afterInitialInteractions = async () => {
		await frames(3);
		for (const item of outward) {
			// The wheel did zoom out: past the fit, the margins' domain shrinks.
			atEnds(item, 'zoomed out with the wheel');
		}
		const zoomed = timeScale.getVisibleLogicalRange();
		if (same(zoomed, fitted)) { throw new Error(`The mouse wheel did not zoom: ${JSON.stringify(zoomed)}`); }

		series.setData(points(1));
		await frames(3);
		if (!same(timeScale.getVisibleLogicalRange(), zoomed)) { throw new Error(`A data refresh lost the zoom: ${JSON.stringify(timeScale.getVisibleLogicalRange())}`); }

		series.applyOptions({ opacity: 0.3, sizeRange: { min: 6, max: 20 }, strokeWidth: 2, xFormatter: x => `${x} u` });
		await frames(3);
		if (!same(timeScale.getVisibleLogicalRange(), zoomed)) { throw new Error(`An option change lost the zoom: ${JSON.stringify(timeScale.getVisibleLogicalRange())}`); }

		// The chart refuses the new slots once (the underlying series throws):
		// the change is rolled back, and the zoom stays.
		const underlying = series.series();
		const setSlots = underlying.setData;
		let calls = 0;
		underlying.setData = function (data) {
			if (calls++ === 0) { throw new Error('refused'); }
			return setSlots.call(this, data);
		};
		let refused = false;
		try {
			series.setData(points(1).map(point => ({ ...point, y: point.y * 2 })));
		} catch (error) {
			refused = /refused/.test(String(error));
		} finally {
			delete underlying.setData;
		}
		await frames(3);
		if (!refused || series.data()[1].y !== points(1)[1].y) { throw new Error('The refused change was not rolled back'); }
		if (!same(timeScale.getVisibleLogicalRange(), zoomed)) { throw new Error(`A refused change lost the zoom: ${JSON.stringify(timeScale.getVisibleLogicalRange())}`); }

		container.style.width = '420px';
		await frames(5);
		if (!same(timeScale.getVisibleLogicalRange(), zoomed)) { throw new Error(`A resize lost the zoom: ${JSON.stringify(timeScale.getVisibleLogicalRange())}`); }
		for (const item of outward) {
			// Zoomed out to the whole domain is the fit, which a resize keeps.
			atEnds(item, 'after a resize');
		}

		series.fitXDomain();
		await frames(3);
		isFitted('after fitXDomain');

		// Fixed edges, a scatter chart default: panning stops at the X domain.
		if (!chart.options().timeScale.fixLeftEdge || !chart.options().timeScale.fixRightEdge) {
			throw new Error('The scatter chart should fix both edges of the time scale by default');
		}
		const firstIndex = timeScale.timeToIndex(series.xDomain().min, false);
		const lastIndex = timeScale.timeToIndex(series.xDomain().max, false);
		timeScale.setVisibleLogicalRange({ from: firstIndex + 5, to: firstIndex + 10 });
		await frames(2);
		timeScale.scrollToPosition(-1000, false);
		await frames(2);
		const pannedLeft = timeScale.getVisibleLogicalRange();
		if (pannedLeft.from < firstIndex - 0.5) { throw new Error(`Panned past the left edge: ${JSON.stringify(pannedLeft)}`); }
		timeScale.scrollToPosition(1000, false);
		await frames(2);
		const pannedRight = timeScale.getVisibleLogicalRange();
		if (pannedRight.to > lastIndex + 0.5) { throw new Error(`Panned past the right edge: ${JSON.stringify(pannedRight)}`); }
		series.fitXDomain();
		await frames(3);
		isFitted('after panning to the edges');

		// Zoom again, then data on another X domain: fitted to the new domain.
		timeScale.setVisibleLogicalRange({ from: 10, to: 40 });
		await frames(2);
		series.setData(points(2).map(point => ({ ...point, x: point.x * 3 })));
		await frames(3);
		if (series.xDomain().max !== 300) { throw new Error(`Unexpected new domain ${JSON.stringify(series.xDomain())}`); }
		isFitted('after a new domain');

		// Low points on the left, high ones on the right; zoom into the right
		// part, the last (empty) slot included.
		series.applyOptions({ xRange: { min: 0, max: 100 } });
		series.setData([
			{ x: 5, y: -120 },
			{ x: 15, y: -80 },
			{ x: 60, y: 128 },
			{ x: 70, y: 210 },
			{ x: 80, y: 300 },
			{ x: 88, y: 150 },
		]);
		await frames(3);
		const height = chart.paneSize().height;
		const bottomOf = () => series.series().coordinateToPrice(height);
		if (!(bottomOf() < -100)) { throw new Error(`The whole axis should show the low points: bottom ${bottomOf()}`); }
		const last = timeScale.timeToIndex(100, false);
		timeScale.setVisibleLogicalRange({ from: last - 45, to: last });
		await frames(3);
		const bottom = bottomOf();
		const top = series.series().coordinateToPrice(0);
		if (!(bottom > 90 && bottom < 128) || !(top > 300)) {
			throw new Error(`Zoomed into 55–100 the price scale should fit 128…300, it shows ${bottom}…${top}`);
		}
	};
}
