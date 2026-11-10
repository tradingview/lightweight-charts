// Moving the pointer within the hovered segment keeps reporting it and does
// not repaint the series: the hit test hands back the same `hitTestData`
// object, which the chart compares by reference to decide whether to repaint.
// The draws are counted at each move, and none may follow the second: the
// first move hovers the segment, which does repaint, and every later move
// within it must hand back the same object.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380, crosshair: { mode: LightweightCharts.CrosshairMode.Normal } });
	const view = new LwcPlugin.StackedBarsSeries();
	const renderer = view.renderer();
	const draw = renderer.draw.bind(renderer);
	let draws = 0;
	renderer.draw = (...args) => {
		draws++;
		return draw(...args);
	};
	const series = chart.addCustomSeries(view, { priceLineVisible: false, lastValueVisible: false });
	const time = index => 1704067200 + index * 86400;
	series.setData(Array.from({ length: 9 }, (_, i) => ({ time: time(i), values: [10, 5] })));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const seen = new Map();
	chart.subscribeCrosshairMove(event => {
		if (event.point !== undefined) {
			seen.set(Math.round(event.point.y), { draws, id: event.hoveredInfo?.series === series ? event.hoveredInfo.objectId : undefined });
		}
	});
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const box = canvas.getBoundingClientRect();
	const host = container.getBoundingClientRect();
	const x = chart.timeScale().timeToCoordinate(time(4));
	// Four positions inside the bottom segment, which spans 0 to 10.
	const ys = [3, 4, 5, 6].map(price => Math.round(series.priceToCoordinate(price)));
	window.initialInteractionsToPerform = () => ys.map(y => ({ action: 'moveMouseXY', target: 'container', options: {
		x: box.left - host.left + x,
		y: box.top - host.top + y,
	} }));
	window.afterInitialInteractions = async () => {
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		for (const y of ys) {
			if (seen.get(y)?.id !== '0') { throw new Error(`The segment was not reported as hovered at y ${y}: ${seen.get(y)?.id}`); }
		}
		const extra = draws - seen.get(ys[1]).draws;
		if (extra !== 0) { throw new Error(`Moving within the hovered segment repainted the series ${extra} time(s)`); }
	};
}
