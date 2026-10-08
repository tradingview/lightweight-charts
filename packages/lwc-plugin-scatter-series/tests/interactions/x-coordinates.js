// xToCoordinate and coordinateToX convert X values to pane coordinates and
// back exactly as the series draws them: the x pointById reports for every
// point, of every group, fitted, with xMargins, after a resize and zoomed in;
// the domain ends on the plot edges (or the margins), as the chart's own
// timeToCoordinate puts the slots. Values off the pane get coordinates off the
// pane; hiding the series or a group changes nothing; a value which is not a
// finite number, a series taken off the chart, removed, or a removed chart
// give null. The overlay recipe (the demo's RegionShading: the README's, as a
// class with setRegions) — a series primitive shading a region with
// xToCoordinate and priceToCoordinate — paints where the points are, and
// follows new regions, a zoom, hiding the series and an inverted price scale.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const close = (actual, expected, tolerance, what) => {
		if (typeof actual !== 'number' || typeof expected !== 'number' || !(Math.abs(actual - expected) <= tolerance)) {
			throw new Error(`${what}: expected ${expected}, got ${actual}`);
		}
	};
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 3);

	container.style.width = '600px';
	const chart = LwcPlugin.createScatterChart(container, {
		autoSize: true,
		handleScroll: true,
		handleScale: true,
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const timeScale = chart.timeScale();
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 1,
		groups: [{ id: 'small', pointSize: 6 }, { id: 'big', pointSize: 16 }],
	});
	const points = Array.from({ length: 21 }, (_, i) => ({
		id: `p${i}`,
		x: Math.min(100, i * 5 + (i % 3) * 0.37),
		y: (i * 7) % 11,
		group: i % 2 === 0 ? 'small' : 'big',
	}));
	series.setData(points);
	await frames(3);

	/** Every drawn point is where xToCoordinate puts its x; the rest are off the pane. */
	const expectPoints = stage => {
		const width = timeScale.width();
		let drawn = 0;
		for (const point of points) {
			const x = series.xToCoordinate(point.x);
			const info = series.pointById(point.id);
			if (info !== null) {
				close(x, info.x, 1e-9, `${stage}: xToCoordinate(${point.x}) and pointById('${point.id}').x`);
				drawn++;
			} else if (!(x + 8 < 0 || x - 8 > width)) {
				throw new Error(`${stage}: ${point.id} is not drawn, but xToCoordinate puts it in the pane at ${x}`);
			}
			close(series.coordinateToX(x), point.x, 1e-9, `${stage}: coordinateToX(xToCoordinate(${point.x}))`);
		}
		return drawn;
	};
	/** The domain ends at `margin` and `width − 1 − margin`, and the slots where the chart puts them. */
	const expectEnds = (stage, margin) => {
		const { min, max } = series.xDomain();
		const width = timeScale.width();
		close(series.xToCoordinate(min), margin, 1e-6, `${stage}: the left end of the domain`);
		close(series.xToCoordinate(max), width - 1 - margin, 1e-6, `${stage}: the right end of the domain`);
		close(series.coordinateToX(margin), min, 1e-6, `${stage}: coordinateToX of the left end`);
		close(series.coordinateToX(width - 1 - margin), max, 1e-6, `${stage}: coordinateToX of the right end`);
		expectSlots(stage);
	};
	const expectSlots = stage => {
		for (const slot of [0, 50, 100]) {
			close(series.xToCoordinate(slot), timeScale.timeToCoordinate(slot), 1e-6, `${stage}: xToCoordinate(${slot}) and the chart's own slot coordinate`);
		}
	};

	if (expectPoints('fitted') !== points.length) { throw new Error('Every point should be drawn when fitted'); }
	expectEnds('fitted', 0);

	// Off the pane: numbers, not null.
	const width = timeScale.width();
	const before = series.xToCoordinate(-50);
	const after = series.xToCoordinate(250);
	if (!(before < -100) || !(after > width + 100)) { throw new Error(`Values off the domain should map off the pane: ${before}, ${after}`); }
	const left = series.coordinateToX(-300);
	const right = series.coordinateToX(width + 300);
	if (!(left < -40) || !(right > 140)) { throw new Error(`Coordinates off the pane should map off the domain: ${left}, ${right}`); }
	for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
		if (series.xToCoordinate(value) !== null || series.coordinateToX(value) !== null) {
			throw new Error(`A value which is not a finite number should give null: ${value}`);
		}
	}

	// The axis does not care whether the series or a group is visible.
	const coordinates = points.map(point => series.xToCoordinate(point.x));
	const unchanged = stage => points.forEach((point, i) => close(series.xToCoordinate(point.x), coordinates[i], 1e-9, `${stage}: ${point.id}`));
	series.setGroupVisible('big', false);
	await frames(3);
	if (series.pointById('p1') !== null) { throw new Error('A point of a hidden group should not be drawn'); }
	unchanged('a group hidden');
	series.applyOptions({ visible: false });
	await frames(3);
	unchanged('the series hidden');
	series.applyOptions({ visible: true });
	series.setGroupVisible('big', true);
	await frames(3);

	// Margins, then a resize.
	series.applyOptions({ xMargins: 30 });
	await frames(3);
	expectEnds('with margins', 30);
	if (expectPoints('with margins') !== points.length) { throw new Error('Every point should be drawn with margins'); }
	container.style.width = '420px';
	await frames(5);
	if (!(timeScale.width() < width)) { throw new Error('The chart did not shrink'); }
	expectEnds('resized', 30);
	if (expectPoints('resized') !== points.length) { throw new Error('Every point should be drawn after a resize'); }

	// Zoomed in by the user's range: the middle third.
	series.applyOptions({ xMargins: 0 });
	await frames(3);
	const range = timeScale.getVisibleLogicalRange();
	const span = range.to - range.from;
	timeScale.setVisibleLogicalRange({ from: range.from + span * 0.35, to: range.from + span * 0.65 });
	await frames(3);
	const drawnZoomed = expectPoints('zoomed');
	if (drawnZoomed === 0 || drawnZoomed === points.length) { throw new Error(`Zoomed in, only some points should be drawn: ${drawnZoomed}`); }
	if (!(series.xToCoordinate(0) < 0) || !(series.xToCoordinate(100) > timeScale.width())) { throw new Error('Zoomed in, the domain ends should be off the pane'); }
	expectSlots('zoomed');
	series.fitXDomain();
	await frames(3);
	expectEnds('fitted again', 0);

	// The overlay recipe of the demo (src/example/region-shading.ts), as plain JavaScript.
	class RegionShading {
		constructor(scatter, regions) {
			this._scatter = scatter;
			this._regions = regions;
			this._boxes = [];
			this._requestUpdate = null;
			this._views = [{
				zOrder: () => 'bottom',
				renderer: () => ({
					draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) => {
						for (const box of this._boxes) {
							const l = Math.max(0, Math.round(box.left * horizontalPixelRatio));
							const r = Math.min(bitmapSize.width, Math.round(box.right * horizontalPixelRatio));
							const t = Math.max(0, Math.round(box.top * verticalPixelRatio));
							const b = Math.min(bitmapSize.height, Math.round(box.bottom * verticalPixelRatio));
							if (r > l && b > t) {
								context.fillStyle = box.color;
								context.fillRect(l, t, r - l, b - t);
							}
						}
					}),
				}),
			}];
		}
		attached({ requestUpdate }) {
			this._requestUpdate = requestUpdate;
			requestUpdate();
		}
		detached() { this._requestUpdate = null; }
		setRegions(regions) {
			this._regions = regions;
			this._requestUpdate?.();
		}
		updateAllViews() {
			const underlying = this._scatter.series();
			this._boxes = [];
			if (!underlying.options().visible) {
				return;
			}
			const up = underlying.priceScale().options().invertScale ? Infinity : -Infinity;
			const x = (value, open) => (value === null ? open : this._scatter.xToCoordinate(value));
			const y = (value, open) => (value === null ? open : underlying.priceToCoordinate(value));
			for (const region of this._regions) {
				const l = x(region.xMin, -Infinity);
				const r = x(region.xMax, Infinity);
				const low = y(region.yMin, -up);
				const high = y(region.yMax, up);
				if (l !== null && r !== null && low !== null && high !== null) {
					this._boxes.push({ left: l, right: r, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
				}
			}
		}
		paneViews() { return this._views; }
	}

	const magenta = [255, 0, 255, 255];
	const white = [255, 255, 255, 255];
	const expectPixel = (stage, x, y, colour) => {
		const actual = pixel(x, y);
		if (!near(actual, colour)) { throw new Error(`${stage}: (${x}, ${y}) should be ${colour}, got ${actual}`); }
	};
	// Two points in the corners, out of the way of the samples.
	series.setData([{ id: 'low', x: 0, y: 0 }, { id: 'high', x: 100, y: 10 }]);
	await frames(3);
	const shading = new RegionShading(series, [{ xMin: 50, xMax: null, yMin: 5, yMax: null, color: 'rgb(255, 0, 255)' }]);
	series.series().attachPrimitive(shading);
	await frames(3);
	const corner = stage => ({ x: series.xToCoordinate(50), y: series.series().priceToCoordinate(5), stage });
	const expectShaded = ({ x, y, stage }, inverted) => {
		const sign = inverted ? -1 : 1;
		expectPixel(`${stage}: inside`, x + 3, y - 3 * sign, magenta);
		expectPixel(`${stage}: left of the region`, x - 3, y - 3 * sign, white);
		expectPixel(`${stage}: beyond its Y end`, x + 3, y + 3 * sign, white);
	};
	const fittedCorner = corner('shaded');
	expectShaded(fittedCorner);
	// Open ends reach the edges of the pane.
	const paneWidth = timeScale.width();
	expectPixel('the open ends', paneWidth - 30, 1, magenta);

	shading.setRegions([{ xMin: 20, xMax: 30, yMin: null, yMax: null, color: 'rgb(255, 0, 255)' }]);
	await frames(2);
	const x20 = series.xToCoordinate(20);
	const x30 = series.xToCoordinate(30);
	expectPixel('new regions: inside', (x20 + x30) / 2, 2, magenta);
	expectPixel('new regions: right of it', x30 + 3, 2, white);
	expectPixel('new regions: the old one is gone', paneWidth - 30, 1, white);

	shading.setRegions([{ xMin: 50, xMax: null, yMin: 5, yMax: null, color: 'rgb(255, 0, 255)' }]);
	const fitted = timeScale.getVisibleLogicalRange();
	const fittedSpan = fitted.to - fitted.from;
	timeScale.setVisibleLogicalRange({ from: fitted.from + fittedSpan * 0.4, to: fitted.from + fittedSpan * 0.9 });
	await frames(3);
	// X = 50 is now a fifth of the way across.
	const zoomedCorner = corner('zoomed');
	if (Math.abs(zoomedCorner.x - fittedCorner.x) < 50 || !(zoomedCorner.x > 0 && zoomedCorner.x < paneWidth)) {
		throw new Error(`Unexpected zoom: X = 50 at ${zoomedCorner.x}, ${fittedCorner.x} fitted`);
	}
	expectShaded(zoomedCorner);

	// Hidden with the series, back with it: the chart draws the primitives of a hidden series.
	series.applyOptions({ visible: false });
	await frames(2);
	expectPixel('series hidden', zoomedCorner.x + 3, zoomedCorner.y - 3, white);
	series.applyOptions({ visible: true });
	await frames(2);
	expectShaded(corner('series shown again'));

	series.fitXDomain();
	series.series().priceScale().applyOptions({ invertScale: true });
	await frames(3);
	expectShaded(corner('inverted'), true);
	series.series().priceScale().applyOptions({ invertScale: false });

	series.series().detachPrimitive(shading);
	await frames(2);
	const gone = corner('detached');
	expectPixel('detached', gone.x + 3, gone.y - 3, white);

	// Taken off the chart without remove(): the axis has no slots, so no mapping.
	const other = document.createElement('div');
	other.style.cssText = 'position: absolute; left: 0; top: 0; width: 400px; height: 300px;';
	document.body.appendChild(other);
	const otherChart = LwcPlugin.createScatterChart(other, { layout: { attributionLogo: false } });
	const taken = LwcPlugin.createScatterSeries(otherChart);
	taken.setData([{ x: 0, y: 0 }, { x: 10, y: 1 }]);
	await frames(3);
	if (typeof taken.xToCoordinate(5) !== 'number') { throw new Error('A series on a chart should map X'); }
	otherChart.removeSeries(taken.series());
	if (taken.xToCoordinate(5) !== null || taken.coordinateToX(5) !== null) { throw new Error('A series taken off the chart should give null'); }
	taken.remove();

	// remove().
	const removed = LwcPlugin.createScatterSeries(otherChart);
	removed.setData([{ x: 0, y: 0 }, { x: 10, y: 1 }]);
	await frames(3);
	if (typeof removed.coordinateToX(100) !== 'number') { throw new Error('A series on a chart should map coordinates'); }
	removed.remove();
	if (removed.xToCoordinate(5) !== null || removed.coordinateToX(100) !== null) { throw new Error('A removed series should give null'); }
	otherChart.remove();
	other.remove();

	// chart.remove(), with the series left in place.
	chart.remove();
	if (series.xToCoordinate(50) !== null || series.coordinateToX(100) !== null) { throw new Error('A series of a removed chart should give null'); }
	series.remove();
	if (series.xToCoordinate(50) !== null) { throw new Error('null after both removals'); }
}
