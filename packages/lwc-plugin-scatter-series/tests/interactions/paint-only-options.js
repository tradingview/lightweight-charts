// Options that only change how the points are painted repaint the series
// without touching the chart: no new slots, no chart options, no refit. Data
// and options that change the slots set them; ones that change neither the
// slots nor the axis (sizes, colours) leave them alone and still rescale.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};

	// The price axis is held at a fixed width: a rescale changes its labels, and
	// with some fonts their width, which narrows the plot and rightly refits the
	// X axis (a range set this test would count as a refit for nothing).
	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { minimumWidth: 100 },
	});
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 1 });
	series.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 50, y: 50 }, { id: 'c', x: 100, y: 100 }]);
	await frames(3);

	const underlying = series.series();
	const counts = { setData: 0, chartOptions: 0, range: 0 };
	const setData = underlying.setData.bind(underlying);
	underlying.setData = data => { counts.setData++; setData(data); };
	const applyChartOptions = chart.applyOptions.bind(chart);
	chart.applyOptions = options => { counts.chartOptions++; applyChartOptions(options); };
	const setRange = chart.timeScale().setVisibleLogicalRange.bind(chart.timeScale());
	chart.timeScale().setVisibleLogicalRange = range => { counts.range++; setRange(range); };
	const expectCounts = (stage, expected) => {
		for (const key of Object.keys(expected)) {
			if (counts[key] !== expected[key]) { throw new Error(`${stage}: ${key} was called ${counts[key]} times, expected ${expected[key]}`); }
		}
	};

	const b = series.pointById('b');
	// The middle of a 3 px ring, off the grid lines through the centre.
	const ring = { x: b.x, y: b.y + b.radius - 1.5 };
	series.applyOptions({ strokeColor: '#000000', strokeWidth: 3, hoveredOpacity: 0.5, plotBorder: { visible: true } });
	await frames();
	expectCounts('paint-only options', { setData: 0, chartOptions: 0, range: 0 });
	const painted = pixel(ring.x, ring.y);
	if (painted[0] > 60 || painted[1] > 60 || painted[2] > 60) { throw new Error(`The new stroke is not painted: ${painted}`); }

	series.setHoveredPoint('b');
	await frames();
	series.setHoveredPoint(null);
	await frames();
	expectCounts('hovering through the API', { setData: 0, chartOptions: 0, range: 0 });

	// The same data again, and colours or sizes: the slots stay.
	series.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 50, y: 50 }, { id: 'c', x: 100, y: 100 }]);
	series.applyOptions({ color: '#F23645', opacity: 0.5, sizeRange: { min: 10, max: 30 }, baselines: [{ axis: 'y', value: 50, color: '#000000' }] });
	await frames(3);
	expectCounts('options which leave the slots', { setData: 0, chartOptions: 0, range: 0 });
	if (series.pointById('b').color !== '#F23645') { throw new Error('The colour change was not applied'); }

	// A size change rescales the price axis: the margins hold the largest point.
	const before = series.series().priceToCoordinate(100);
	const plotWidth = chart.timeScale().width();
	series.applyOptions({ pointSize: 50 });
	await frames(3);
	if (chart.timeScale().width() !== plotWidth) {
		throw new Error(`The plot width changed (${plotWidth} → ${chart.timeScale().width()}): widen rightPriceScale.minimumWidth`);
	}
	expectCounts('a larger point size', { setData: 0, chartOptions: 0, range: 0 });
	if (Math.abs(series.series().priceToCoordinate(100) - before) < 5) { throw new Error('A larger point size did not rescale the price axis'); }

	// New Y values on the same X domain: new slots, no refit needed but done as the range follows the fit.
	series.setData([{ id: 'a', x: 0, y: 10 }, { id: 'b', x: 50, y: 50 }, { id: 'c', x: 100, y: 100 }]);
	await frames();
	if (counts.setData !== 1) { throw new Error(`New Y values should set the slots once, ${counts.setData}`); }
}
