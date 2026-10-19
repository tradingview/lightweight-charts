// The axes stay whole whatever is visible: with no data, with every group
// hidden, and with points in the first slots of a wider pinned range, the X
// domain still runs exactly from the left plot edge to the right one, the
// price scale has labels, and the border and baselines are drawn. Hiding a
// group never moves the X axis; the price scale fits the visible points, and
// the end slots that make this work leave its range as the points set it.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const canvasAt = column => container.querySelector(`tr:nth-of-type(1) td:nth-of-type(${column}) canvas`);
	const pixel = (canvas, x, y) => {
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	// Dark pixels of the price axis: its labels.
	const priceLabelPixels = () => {
		const canvas = canvasAt(3);
		const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
		let count = 0;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] > 0 && data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 120) {
				count++;
			}
		}
		return count;
	};
	const RED = [242, 54, 69, 255];
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 3);

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const timeScale = chart.timeScale();
	// The user's provider sees the scatter range as its base: record it.
	let baseRange = null;
	const series = LwcPlugin.createScatterSeries(chart, {
		plotBorder: { visible: true, color: '#F23645', width: 2 },
		baselines: [{ axis: 'y', value: 0, color: '#000000' }],
		autoscaleInfoProvider: base => {
			const info = base();
			baseRange = info && info.priceRange ? [info.priceRange.minValue, info.priceRange.maxValue] : null;
			return info;
		},
	});

	const checkAxes = stage => {
		const domain = series.xDomain();
		const width = timeScale.width();
		const left = timeScale.timeToCoordinate(domain.min);
		const right = timeScale.timeToCoordinate(domain.max);
		if (left === null || right === null || Math.abs(left) > 0.5 || Math.abs(right - (width - 1)) > 0.5) {
			throw new Error(`${stage}: the X domain ${domain.min}…${domain.max} spans ${left}…${right}, not 0…${width - 1}`);
		}
		if (priceLabelPixels() < 20) { throw new Error(`${stage}: the price scale has no labels`); }
		// The left edge, away from the baseline and the grid lines.
		const pane = canvasAt(2);
		const borderAt = Math.round(chart.paneSize().height * 0.3) + 0.5;
		if (!near(pixel(pane, 0.5, borderAt), RED)) {
			throw new Error(`${stage}: the plot border is not drawn: ${pixel(pane, 0.5, borderAt)}`);
		}
		const zero = series.series().priceToCoordinate(0);
		if (zero === null || zero < 0 || zero > chart.paneSize().height) { throw new Error(`${stage}: the baseline at 0 is off the scale: ${zero}`); }
		return domain;
	};

	// No data at all.
	series.setData([]);
	await frames(3);
	let domain = checkAxes('no data');
	if (domain.min !== 0 || domain.max !== 10) { throw new Error(`No data should span 0–10: ${JSON.stringify(domain)}`); }

	// Two groups, then each hidden in turn.
	const points = [
		{ id: 'w1', x: 2, y: 400, group: 'win' },
		{ id: 'w2', x: 30, y: 900, group: 'win' },
		{ id: 'l1', x: 55, y: -700, group: 'loss' },
		{ id: 'l2', x: 80, y: -200, group: 'loss' },
	];
	series.applyOptions({ groups: [{ id: 'win', color: '#089981' }, { id: 'loss', color: '#2962FF' }] });
	series.setData(points);
	await frames(3);
	domain = checkAxes('both groups');
	if (baseRange === null || baseRange[0] !== -700 || baseRange[1] !== 900) {
		throw new Error(`The autoscale range should be the points' own -700…900, got ${JSON.stringify(baseRange)}`);
	}
	const all = { ...domain };

	series.setGroupVisible('loss', false);
	await frames(3);
	domain = checkAxes('losses hidden');
	if (domain.min !== all.min || domain.max !== all.max) { throw new Error(`Hiding a group moved the X axis: ${JSON.stringify(domain)}`); }
	// The visible 400…900, and the baseline at 0.
	if (baseRange[0] !== 0 || baseRange[1] !== 900) { throw new Error(`The price scale should fit the visible points: ${JSON.stringify(baseRange)}`); }

	series.setGroupVisible('win', false);
	await frames(3);
	domain = checkAxes('every group hidden');
	if (domain.min !== all.min || domain.max !== all.max) { throw new Error(`Hiding every group moved the X axis: ${JSON.stringify(domain)}`); }
	// With nothing visible the scale keeps to where the points are.
	if (baseRange[0] !== -700 || baseRange[1] !== 900) { throw new Error(`An empty plot should scale to every point: ${JSON.stringify(baseRange)}`); }
	const w2 = { x: ((30 - domain.min) / (domain.max - domain.min)) * (timeScale.width() - 1), y: series.series().priceToCoordinate(900) };
	if (series.hitTest(w2.x, w2.y) !== null || series.pointById('w2') !== null) { throw new Error('A hidden point was hit'); }

	series.setGroupVisible('win', true);
	series.setGroupVisible('loss', true);
	await frames(3);
	domain = checkAxes('both shown again');
	if (baseRange[0] !== -700 || baseRange[1] !== 900) { throw new Error(`Showing the groups again changed the range: ${JSON.stringify(baseRange)}`); }

	// Points in the first slots of a wide pinned range.
	series.applyOptions({ xRange: { min: 0, max: 100 }, groups: [] });
	series.setData([{ id: 'a', x: 1, y: 1 }, { id: 'b', x: 3, y: 2 }]);
	await frames(3);
	domain = checkAxes('points in the first slots');
	if (domain.min !== 0 || domain.max !== 100) { throw new Error(`The pinned range is not kept: ${JSON.stringify(domain)}`); }
	if (baseRange[0] !== 0 || baseRange[1] !== 2) {
		// 0 is the baseline, which the scatter range includes.
		throw new Error(`The price range should be the points and the baseline, 0…2: ${JSON.stringify(baseRange)}`);
	}
	const b = series.pointById('b');
	if (b === null || Math.abs(b.x - (3 / 100) * (timeScale.width() - 1)) > 0.5) { throw new Error(`"b" is not at x = 3: ${JSON.stringify(b)}`); }

	// A pinned Y range with no data: the scale shows it.
	series.applyOptions({ yRange: { min: 0, max: 12 }, baselines: [] });
	series.setData([]);
	await frames(3);
	checkAxes('no data, pinned Y');
	const height = chart.paneSize().height;
	const top = series.series().priceToCoordinate(12);
	const bottom = series.series().priceToCoordinate(0);
	if (Math.abs(top - height * 0.05) > 1.5 || Math.abs(bottom - height * 0.95) > 1.5) {
		throw new Error(`The pinned Y range is not shown: 12 at ${top}, 0 at ${bottom} of ${height}`);
	}
}
