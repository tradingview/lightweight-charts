// The labels of the X axis are weighed again whenever their chain changes (a
// new xFormatter, a new width, a zoom): the series sets its slots twice for
// it, and the chart reports a crosshair move each time. With the pointer
// resting on a point, every one of those events still carries the point in
// `hoveredInfo`: a host tooltip listening to the chart's crosshair does not
// flicker off and on.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const chart = LwcPlugin.createScatterChart(container, { width: 400, height: 300, layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 40, opacity: 1 });
	series.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 50, y: 5 }, { id: 'c', x: 100, y: 10 }]);
	await frames(3);
	const b = series.pointById('b');
	const reported = [];
	chart.subscribeCrosshairMove(param => {
		reported.push(param.hoveredInfo !== undefined && param.hoveredInfo.series === series.series() ? param.hoveredInfo.objectId : null);
	});

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(b.x), y: Math.round(b.y) } },
	];
	window.afterInitialInteractions = async () => {
		await frames(2);
		if (reported.length === 0 || reported[reported.length - 1] !== 'b') { throw new Error(`The pointer is not on b: ${JSON.stringify(reported)}`); }
		reported.length = 0;
		// Labels of other lengths: another label step, the slots weighed again.
		const formatters = [x => `${x}`, x => `${x} with a long unit`];
		for (let i = 0; i < 6; i++) {
			series.applyOptions({ xFormatter: formatters[i % 2] });
			await frames(2);
		}
		if (reported.length === 0) { throw new Error('No crosshair event while the labels were weighed again'); }
		const lost = reported.filter(id => id !== 'b').length;
		if (lost > 0) { throw new Error(`${lost} of ${reported.length} crosshair events lost the hovered point: ${JSON.stringify(reported)}`); }
	};
}
