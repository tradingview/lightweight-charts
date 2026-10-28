// `xMargins` keeps room at both ends of the X domain, so the bubbles at the
// ends are drawn whole and hovered there: the ends sit that many pixels inside
// the plot edges, through resizes, back on the edges with 0, and never more
// than a quarter of the plot. The series frees the chart's fixed edges while
// margins are in use — again when the host fixes one meanwhile, whose setting
// then comes back with the margins at 0 or on remove(), even when that comes
// before the series has seen the host's change.
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
	const blue = rgba => Math.abs(rgba[0] - 41) <= 3 && Math.abs(rgba[1] - 98) <= 3 && Math.abs(rgba[2] - 255) <= 3;

	container.style.width = '600px';
	const chart = LwcPlugin.createScatterChart(container, { autoSize: true, layout: { attributionLogo: false } });
	const timeScale = chart.timeScale();
	const series = LwcPlugin.createScatterSeries(chart, { xMargins: 25, pointSize: 50, opacity: 1 });
	series.setData([{ id: 'left', x: 0, y: 50 }, { id: 'right', x: 100, y: 50 }, { id: 'low', x: 50, y: 0 }, { id: 'high', x: 50, y: 100 }]);
	await frames(3);
	const ends = (stage, margin) => {
		const width = timeScale.width();
		const left = timeScale.timeToCoordinate(0);
		const right = timeScale.timeToCoordinate(100);
		if (Math.abs(left - margin) > 0.5 || Math.abs(right - (width - 1 - margin)) > 0.5) {
			throw new Error(`${stage}: the domain ends are at ${left} and ${right}, expected ${margin} and ${width - 1 - margin}`);
		}
		const point = series.pointById('left');
		if (point === null || Math.abs(point.x - margin) > 0.5) { throw new Error(`${stage}: pointById is not at the margin: ${JSON.stringify(point)}`); }
	};
	ends('with margins', 25);
	// The room past the end slots needs free edges: the series frees the
	// scatter chart's fixed edges while margins are in use.
	const edges = () => {
		const { fixLeftEdge, fixRightEdge } = chart.options().timeScale;
		return `${fixLeftEdge}/${fixRightEdge}`;
	};
	if (edges() !== 'false/false') { throw new Error(`Margins should free the fixed edges: ${edges()}`); }
	// The whole bubble is drawn: its left edge, 23 px left of its centre, is painted.
	const left = series.pointById('left');
	if (!blue(pixel(left.x - 23, left.y))) { throw new Error(`The bubble at the left end is cut: ${pixel(left.x - 23, left.y)}`); }

	// The host fixes the edges again: the margins keep working.
	chart.applyOptions({ timeScale: { fixLeftEdge: true, fixRightEdge: true } });
	await frames(4);
	if (edges() !== 'false/false') { throw new Error(`Edges fixed again by the host should be freed: ${edges()}`); }
	ends('after the host fixed the edges again', 25);

	container.style.width = '420px';
	await frames(5);
	ends('after a resize', 25);

	series.applyOptions({ xMargins: 0 });
	await frames(3);
	ends('without margins', 0);
	if (edges() !== 'true/true') { throw new Error(`Without margins the chart's fixed edges should be back: ${edges()}`); }

	// remove() gives a chart with margins its fixed edges back.
	const otherContainer = document.createElement('div');
	otherContainer.style.width = '400px';
	otherContainer.style.height = '200px';
	document.body.appendChild(otherContainer);
	const otherChart = LwcPlugin.createScatterChart(otherContainer, { layout: { attributionLogo: false } });
	const otherSeries = LwcPlugin.createScatterSeries(otherChart, { xMargins: 10 });
	otherSeries.setData([{ x: 0, y: 0 }, { x: 10, y: 1 }]);
	await frames(3);
	if (otherChart.options().timeScale.fixLeftEdge) { throw new Error('Margins should free the fixed edges of the other chart'); }
	otherSeries.remove();
	if (!otherChart.options().timeScale.fixLeftEdge || !otherChart.options().timeScale.fixRightEdge) {
		throw new Error('remove() should give the chart its fixed edges back');
	}
	otherChart.remove();

	// A chart with free edges whose host fixes one while margins are in use:
	// freed again, and the host's setting back without margins.
	const freeChart = LwcPlugin.createScatterChart(otherContainer, { layout: { attributionLogo: false }, timeScale: { fixLeftEdge: false, fixRightEdge: false } });
	const freeSeries = LwcPlugin.createScatterSeries(freeChart, { xMargins: 10 });
	freeSeries.setData([{ x: 0, y: 0 }, { x: 10, y: 1 }]);
	await frames(3);
	freeChart.applyOptions({ timeScale: { fixLeftEdge: true } });
	await frames(4);
	const freeEdges = () => `${freeChart.options().timeScale.fixLeftEdge}/${freeChart.options().timeScale.fixRightEdge}`;
	if (freeEdges() !== 'false/false') { throw new Error(`The left edge fixed by the host should be freed: ${freeEdges()}`); }
	if (Math.abs(freeChart.timeScale().timeToCoordinate(0) - 10) > 0.5) { throw new Error(`The left end left the margin: ${freeChart.timeScale().timeToCoordinate(0)}`); }
	freeSeries.applyOptions({ xMargins: 0 });
	await frames(2);
	if (freeEdges() !== 'true/false') { throw new Error(`Without margins the host's left edge should be fixed: ${freeEdges()}`); }
	freeSeries.remove();
	freeChart.remove();

	// The host fixes an edge and, in the same task, the margins go to 0 or the
	// series goes: the host's latest setting comes back, not the one kept.
	for (const how of ['margins to 0', 'remove()']) {
		const hostChart = LwcPlugin.createScatterChart(otherContainer, { layout: { attributionLogo: false }, timeScale: { fixLeftEdge: false, fixRightEdge: true } });
		const hostSeries = LwcPlugin.createScatterSeries(hostChart, { xMargins: 12 });
		hostSeries.setData([{ x: 0, y: 0 }, { x: 10, y: 1 }]);
		await frames(3);
		hostChart.applyOptions({ timeScale: { fixLeftEdge: true } });
		if (how === 'remove()') {
			hostSeries.remove();
		} else {
			hostSeries.applyOptions({ xMargins: 0 });
		}
		await frames(2);
		const hostEdges = `${hostChart.options().timeScale.fixLeftEdge}/${hostChart.options().timeScale.fixRightEdge}`;
		if (hostEdges !== 'true/true') { throw new Error(`${how}: the edge the host has just fixed should stay fixed: ${hostEdges}`); }
		hostSeries.remove();
		hostChart.remove();
	}
	otherContainer.remove();

	series.applyOptions({ xMargins: 1000 });
	await frames(3);
	ends('with a margin wider than the plot allows', (timeScale.width() - 1) / 4);

	series.applyOptions({ xMargins: 25 });
	await frames(3);
	const right = series.pointById('right');
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(right.x + 20), y: Math.round(right.y) } },
	];
	window.afterInitialInteractions = () => {
		const hovered = series.hoveredPoint();
		if (hovered === null || hovered.objectId !== 'right') { throw new Error(`The outer half of the end bubble should be hoverable: ${JSON.stringify(hovered)}`); }
	};
}
