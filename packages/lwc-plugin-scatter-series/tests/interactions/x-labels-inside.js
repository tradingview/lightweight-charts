// With scrolling and zooming on, the chart keeps an end label of the X axis
// inside the plot only at a fixed edge, and there only while the labels are at
// least twice the slot spacing apart; at a free edge it centres the label on
// its slot. Every label the chart draws stays inside the axis, as measured
// from the text it draws:
// - at the fit, with the edges freed by the host, or by the series for
//   `xMargins` (the ends of the domain are kept far enough in for their labels);
// - zoomed deep into either end of the axis at a fixed edge, with long labels;
// - in every frame of a resize of a wide chart, before the series lays the
//   axis out for the new width (the chart rescales the spacing at once);
// - in every frame after `xMargins` goes back to 0 at fixed edges: the series
//   fixes the edges again before it chooses the labels, so that no frame shows
//   labels chosen for the freed edges.
// Scrolling and zooming off, the fit is as before: the ends on the plot edges.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	let frame = 0;
	(function tick() {
		frame++;
		requestAnimationFrame(tick);
	})();
	const drawn = [];
	const fillText = CanvasRenderingContext2D.prototype.fillText;
	CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
		drawn.push({ frame, canvas: this.canvas, text, x, width: this.measureText(text).width });
		return fillText.call(this, text, x, y, ...rest);
	};
	const box = (width, height) => {
		const element = document.createElement('div');
		element.style.cssText = `position: absolute; left: 0; top: 0; width: ${width}px; height: ${height}px;`;
		container.appendChild(element);
		return element;
	};
	const movable = { autoSize: true, handleScroll: true, handleScale: true, layout: { attributionLogo: false } };
	const points = Array.from({ length: 19 }, (_, i) => ({ x: i * 5 + 0.3, y: Math.sin(i) }));
	const longLabels = x => `${x.toFixed(1)} units long`;

	/** The labels drawn on the time axis of `chart` since `since`, out of the axis by more than the chart's rounding. */
	const outside = (chart, since = 0) => {
		const canvases = Array.from(chart.chartElement().querySelectorAll('tr:last-child canvas'));
		const width = chart.timeScale().width();
		return drawn
			.filter(item => item.frame >= since && canvases.indexOf(item.canvas) !== -1)
			.map(item => ({ text: item.text, left: item.x - item.width / 2, right: item.x + item.width / 2, frame: item.frame }))
			.filter(label => label.left < -1 || label.right > width + 1)
			.map(label => `"${label.text}" at ${label.left.toFixed(1)}…${label.right.toFixed(1)} of ${width} (frame ${label.frame})`);
	};
	/** The labels drawn by the next paint. */
	const labels = async chart => {
		drawn.length = 0;
		chart.applyOptions({});
		await frames(2);
		const canvases = Array.from(chart.chartElement().querySelectorAll('tr:last-child canvas'));
		return drawn.filter(item => canvases.indexOf(item.canvas) !== -1).map(item => item.text);
	};
	const check = async (name, chartOptions, seriesOptions, prepare) => {
		const element = box(600, 250);
		const chart = LwcPlugin.createScatterChart(element, { ...movable, ...chartOptions });
		const series = LwcPlugin.createScatterSeries(chart, seriesOptions);
		series.setData(points);
		await frames(4);
		if (prepare) {
			await prepare(chart, series);
			await frames(4);
		}
		const texts = await labels(chart);
		const cut = outside(chart);
		if (cut.length > 0) { throw new Error(`${name}: labels cut off: ${cut.join(', ')}`); }
		if (texts.length < 2) { throw new Error(`${name}: only ${texts.length} label(s) drawn`); }
		const result = { chart, series, texts };
		return result;
	};
	const ends = series => {
		const domain = series.xDomain();
		return [domain.min, domain.max];
	};

	// At the fit, edges freed by the host: the ends of the domain come in.
	const freed = await check('free edges', { timeScale: { fixLeftEdge: false, fixRightEdge: false } }, {});
	for (const text of ['0', '100']) {
		if (freed.texts.indexOf(text) === -1) { throw new Error(`free edges: the end label "${text}" is not drawn: ${freed.texts}`); }
	}
	const [min, max] = ends(freed.series);
	const left = freed.chart.timeScale().timeToCoordinate(min);
	const right = freed.chart.timeScale().timeToCoordinate(max);
	if (!(left > 2 && left < 12) || !(right < freed.chart.timeScale().width() - 4)) {
		throw new Error(`free edges: the domain should sit about half an end label in: ${left}…${right}`);
	}
	freed.chart.remove();
	// Edges freed by the series for xMargins narrower than half a label.
	(await check('xMargins of 3 px', {}, { xMargins: 3 })).chart.remove();
	// The same without scrolling and zooming: the chart moves the labels in, the margins are as asked.
	const still = await check('xMargins of 3 px, no scrolling', { handleScroll: false, handleScale: false }, { xMargins: 3 });
	const stillLeft = still.chart.timeScale().timeToCoordinate(ends(still.series)[0]);
	if (Math.abs(stillLeft - 3) > 0.5) { throw new Error(`xMargins of 3 px without scrolling: the domain starts at ${stillLeft}`); }
	still.chart.remove();
	// The fixed edges of the scatter chart: the fit is edge to edge, the labels moved in.
	const fixed = await check('fixed edges', {}, {});
	if (Math.abs(fixed.chart.timeScale().timeToCoordinate(ends(fixed.series)[0])) > 0.5) { throw new Error('fixed edges: the domain should start on the plot edge'); }
	fixed.chart.remove();

	// Zoomed deep into an end at a fixed edge, long labels: the end label is
	// moved in, not centred on the edge (the labels further apart if need be).
	for (const [name, range] of [['the left end', { from: -0.5, to: 8 }], ['the right end', { from: 92, to: 100.5 }]]) {
		const zoomed = await check(`zoomed into ${name}`, {}, { xFormatter: longLabels }, chart => {
			chart.timeScale().setVisibleLogicalRange(range);
		});
		zoomed.chart.remove();
	}

	// A wide chart, labelled at twice the slot spacing apart: every frame of a
	// resize keeps the end labels in.
	const wideElement = box(1300, 250);
	const wide = LwcPlugin.createScatterChart(wideElement, { ...movable, layout: { attributionLogo: false, fontSize: 11 } });
	LwcPlugin.createScatterSeries(wide).setData([{ x: 0.5, y: 1 }, { x: 29, y: 2 }]);
	await frames(5);
	const start = frame;
	for (let width = 1303; width < 1330; width += 3) {
		wideElement.style.width = `${width}px`;
		await frames(3);
	}
	const flicker = outside(wide, start);
	if (flicker.length > 0) { throw new Error(`Resizing a wide chart: labels cut off for a frame: ${flicker.join(', ')}`); }

	// xMargins back to 0 at the fixed edges of the scatter chart: every frame
	// draws the labels of the fixed edges.
	const marginsChart = LwcPlugin.createScatterChart(box(600, 250), movable);
	const marginsSeries = LwcPlugin.createScatterSeries(marginsChart, { xMargins: 12, xFormatter: x => `${x.toFixed(1)} m` });
	marginsSeries.setData(Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: Math.sin(i) })));
	await frames(5);
	drawn.length = 0;
	const marginsStart = frame;
	marginsSeries.applyOptions({ xMargins: 0 });
	await frames(6);
	CanvasRenderingContext2D.prototype.fillText = fillText;
	const axis = Array.from(marginsChart.chartElement().querySelectorAll('tr:last-child canvas'));
	const byFrame = new Map();
	for (const item of drawn) {
		if (item.frame >= marginsStart && axis.indexOf(item.canvas) !== -1) {
			byFrame.set(item.frame, `${byFrame.get(item.frame) ?? ''} ${item.text}`);
		}
	}
	const frameLabels = [...byFrame.values()];
	if (frameLabels.length === 0 || frameLabels.some(text => text !== frameLabels[frameLabels.length - 1])) {
		throw new Error(`xMargins back to 0: a frame drew other labels than the final ones: ${JSON.stringify(frameLabels)}`);
	}
	const marginsCut = outside(marginsChart, marginsStart);
	if (marginsCut.length > 0) { throw new Error(`xMargins back to 0: labels cut off: ${marginsCut.join(', ')}`); }
}
