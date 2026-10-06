// A host listening to the visible range (to place overlays of its own) sees no
// `null` range, nor one of an empty axis, when the series changes its X domain
// or weighs its labels again: a domain with as many slots as before and a
// label chain weighed again on the same grid report no range at all; a domain
// with another number of slots reports the ranges the chart passes through
// while it takes the new slots — synchronously, inside setData — then the
// fitted range on the next frame, and nothing else. The labels drawn after a
// change of domain are those of a chart created with the new data.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const box = (left, top, width, height) => {
		const element = document.createElement('div');
		element.style.cssText = `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;`;
		container.appendChild(element);
		return element;
	};
	const options = { autoSize: true, layout: { attributionLogo: false } };
	const points = (from, to) => [{ x: from, y: 1 }, { x: (from + to) / 2, y: 3 }, { x: to, y: 2 }];

	// Record what the time axes draw.
	const drawn = [];
	const fillText = CanvasRenderingContext2D.prototype.fillText;
	CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
		drawn.push({ canvas: this.canvas, text, x });
		return fillText.call(this, text, x, y, ...rest);
	};
	const labelsOf = async target => {
		drawn.length = 0;
		target.applyOptions({});
		await frames(2);
		const canvases = Array.from(target.chartElement().querySelectorAll('tr:last-child canvas'));
		const texts = [];
		for (const item of drawn.filter(entry => canvases.indexOf(entry.canvas) !== -1).sort((a, b) => a.x - b.x)) {
			if (texts.indexOf(item.text) === -1) {
				texts.push(item.text);
			}
		}
		return texts.join(' ');
	};

	try {
		const chart = LwcPlugin.createScatterChart(box(0, 0, 600, 300), options);
		const timeScale = chart.timeScale();
		const series = LwcPlugin.createScatterSeries(chart);
		series.setData(points(0, 87));
		await frames(4);

		let phase = 'idle';
		const events = [];
		timeScale.subscribeVisibleLogicalRangeChange(range => { events.push({ phase, range }); });
		const change = async apply => {
			events.length = 0;
			phase = 'sync';
			apply();
			phase = 'after';
			await frames(4);
			phase = 'idle';
			return events.slice();
		};
		const fitted = stage => {
			const domain = series.xDomain();
			const left = timeScale.timeToCoordinate(domain.min);
			const right = timeScale.timeToCoordinate(domain.max);
			if (Math.abs(left) > 0.5 || Math.abs(right - (timeScale.width() - 1)) > 0.5) {
				throw new Error(`${stage}: the domain is not fitted: ${left}…${right} of ${timeScale.width()}`);
			}
		};
		const describe = seen => JSON.stringify(seen.map(event => [event.phase, event.range && [event.range.from.toFixed(2), event.range.to.toFixed(2)]]));

		// As many slots as before (0–90 to 100–190): the range stays as it is.
		let seen = await change(() => series.setData(points(100, 187)));
		if (series.xDomain().min !== 100 || series.xDomain().max !== 190) { throw new Error(`Unexpected domain ${JSON.stringify(series.xDomain())}`); }
		if (seen.length !== 0) { throw new Error(`A domain with as many slots reported ranges: ${describe(seen)}`); }
		fitted('shifted domain');

		// Longer labels: a coarser label step, the slots weighed again on the same grid.
		const before = await labelsOf(chart);
		seen = await change(() => series.applyOptions({ xFormatter: x => `${x} units` }));
		const after = await labelsOf(chart);
		if (after.split(' units').length - 1 >= before.split(' ').length) { throw new Error(`The labels did not thin out: ${before} -> ${after}`); }
		if (seen.length !== 0) { throw new Error(`Weighing the labels again reported ranges: ${describe(seen)}`); }
		series.applyOptions({ xFormatter: null });
		await frames(3);

		// Other numbers of slots: no null, intermediate ranges only inside setData, then the fit.
		for (const [name, from, to] of [['fewer slots', 0, 261], ['more slots', 0, 180], ['a negative domain', -870, -10]]) {
			seen = await change(() => series.setData(points(from, to)));
			if (seen.some(event => event.range === null)) { throw new Error(`${name}: a null range was reported: ${describe(seen)}`); }
			const late = seen.filter(event => event.phase !== 'sync');
			const current = timeScale.getVisibleLogicalRange();
			if (late.length !== 1 || Math.abs(late[0].range.from - current.from) > 1e-6 || Math.abs(late[0].range.to - current.to) > 1e-6) {
				throw new Error(`${name}: after setData, only the fitted range should be reported: ${describe(seen)}`);
			}
			fitted(name);
		}

		// Labels after a change of domain, at 300 px: those of a new chart.
		const narrow = LwcPlugin.createScatterChart(box(0, 300, 300, 150), options);
		const narrowSeries = LwcPlugin.createScatterSeries(narrow);
		for (const [from, to] of [[[0, 180], [0, 87]], [[0, 180], [0, 95]], [[0, 29], [0, 180]]]) {
			narrowSeries.setData(points(...from));
			await frames(3);
			narrowSeries.setData(points(...to));
			await frames(3);
			const got = await labelsOf(narrow);
			const reference = LwcPlugin.createScatterChart(box(300, 300, 300, 150), options);
			LwcPlugin.createScatterSeries(reference).setData(points(...to));
			await frames(4);
			const want = await labelsOf(reference);
			reference.remove();
			if (got !== want) { throw new Error(`From ${from} to ${to}: labelled "${got}", a new chart "${want}"`); }
		}
	} finally {
		CanvasRenderingContext2D.prototype.fillText = fillText;
	}
}
