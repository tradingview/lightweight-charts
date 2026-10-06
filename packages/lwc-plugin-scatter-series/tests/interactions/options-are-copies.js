// What the API hands out is a copy, and what it is given is copied: changing
// the objects of options(), groups() or data(), or the arrays and objects
// passed to applyOptions, changes neither the series, nor the defaults, nor a
// series created later.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const pixel = (target, x, y) => {
		const canvas = target.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 3);
	const RED = [242, 54, 69, 255];
	// The default plot border colour: no sample down the left edge may be it.
	const BORDER = [149, 152, 161, 255];
	const borderDrawn = (target, y) => [y - 40, y, y + 40].some(at => near(pixel(target, 3, at), BORDER));

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const groups = [{ id: 'g', color: '#F23645', opacity: 1, pointSize: 30 }];
	const series = LwcPlugin.createScatterSeries(chart, { groups });
	const data = [{ id: 'a', x: 0, y: 0, group: 'g' }, { id: 'b', x: 50, y: 50, group: 'g' }, { id: 'c', x: 100, y: 100, group: 'g' }];
	series.setData(data);
	await frames(3);

	// The objects passed in are the host's: changing them later changes nothing.
	groups[0].color = '#000000';
	groups.push({ id: 'other' });
	data.push({ id: 'd', x: 1000, y: 0 });

	// Nor do the objects handed out.
	const options = series.options();
	options.plotBorder.visible = true;
	options.plotBorder.width = 5;
	options.sizeRange.max = 49;
	options.xRange.max = 1000;
	options.groups[0].color = '#000000';
	options.groups.push({ id: 'x' });
	options.palette[0] = '#000000';
	options.baselines.push({ axis: 'y', value: 50 });
	series.groups()[0].color = '#000000';
	series.data().push({ id: 'e', x: 2000, y: 0 });
	series.data()[1] = { id: 'b', x: 70, y: 50 };

	// A rebuild reads the series' own state again.
	series.applyOptions({ opacity: 1 });
	await frames(3);
	if (series.data().length !== 3 || series.data()[1].x !== 50) { throw new Error(`data() changed the points: ${JSON.stringify(series.data())}`); }
	if (series.xDomain().max !== 100) { throw new Error(`The X domain changed: ${JSON.stringify(series.xDomain())}`); }
	const current = series.options();
	if (current.plotBorder.visible || current.sizeRange.max !== 25 || current.xRange.max !== null || current.baselines.length !== 0 ||
		current.groups.length !== 1 || current.groups[0].color !== '#F23645' || current.palette[0] !== '#2962FF') {
		throw new Error(`options() changed the series: ${JSON.stringify(current)}`);
	}
	if (series.groups().length !== 1 || series.groups()[0].color !== '#F23645') { throw new Error(`groups() changed: ${JSON.stringify(series.groups())}`); }
	const b = series.pointById('b');
	if (b === null || !near(pixel(container, b.x, b.y), RED)) { throw new Error(`The point is not drawn red: ${b && pixel(container, b.x, b.y)}`); }
	if (borderDrawn(container, b.y)) { throw new Error('A plot border is drawn'); }

	// The defaults, and a series created afterwards, are as they were.
	const defaults = LwcPlugin.defaultOptions;
	if (defaults.plotBorder.visible || defaults.sizeRange.max !== 25 || defaults.xRange.max !== null || defaults.groups.length !== 0 ||
		defaults.palette[0] !== '#2962FF' || LwcPlugin.DEFAULT_SCATTER_PALETTE[0] !== '#2962FF') {
		throw new Error(`The defaults changed: ${JSON.stringify(defaults)}`);
	}
	const other = document.createElement('div');
	other.style.cssText = 'position: absolute; left: 0; top: 0; width: 400px; height: 300px;';
	document.body.appendChild(other);
	const otherChart = LwcPlugin.createScatterChart(other, { layout: { attributionLogo: false } });
	const otherSeries = LwcPlugin.createScatterSeries(otherChart, { pointSize: 30, opacity: 1, color: '#F23645' });
	otherSeries.setData([{ id: 'p', x: 0, y: 0 }, { id: 'q', x: 10, y: 10 }]);
	await frames(3);
	const fresh = otherSeries.options();
	if (fresh.plotBorder.visible || fresh.sizeRange.max !== 25 || fresh.groups.length !== 0 || fresh.palette[0] !== '#2962FF') {
		throw new Error(`A new series starts from changed defaults: ${JSON.stringify(fresh)}`);
	}
	const q = otherSeries.pointById('q');
	if (borderDrawn(other, q.y)) { throw new Error('The new series draws a plot border'); }
	otherSeries.remove();
	otherChart.remove();
	other.remove();
}
