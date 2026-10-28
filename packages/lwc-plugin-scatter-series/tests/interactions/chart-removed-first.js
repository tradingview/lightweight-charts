// A host removing the chart before the series — chart.remove(), then
// series.remove() later or never — while a point is hovered, with a data
// refresh and a hover change still pending: nothing throws, then or on the
// frames after; the hovered-point subscribers are told `null` once (on the
// next frame when a notification was pending, else on series.remove()); the
// API returns null and does nothing; series.remove() afterwards is fine.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const errors = [];
	window.addEventListener('error', event => errors.push(String(event.message)));
	window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
	const points = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 5, y: 5 }, { id: 'c', x: 10, y: 10 }];
	const inert = (series, stage) => {
		const b = { x: 100, y: 100 };
		if (series.pointById('b') !== null) { throw new Error(`${stage}: pointById should return null`); }
		if (series.hoveredPoint() !== null) { throw new Error(`${stage}: hoveredPoint should return null`); }
		if (series.hitTest(b.x, b.y) !== null) { throw new Error(`${stage}: hitTest should return null`); }
		if (series.xToCoordinate(5) !== null || series.coordinateToX(100) !== null) { throw new Error(`${stage}: the X conversions should return null`); }
		series.setData([{ id: 'a', x: 1, y: 1 }]);
		series.applyOptions({ pointSize: 12, xMargins: 10 });
		series.setHoveredPoint('a');
		series.setGroupVisible('g', false);
		series.fitXDomain();
		series.groups();
		series.xDomain();
		series.options();
	};

	// Hovered by the pointer.
	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 30, opacity: 1 });
	series.setData(points);
	const notes = [];
	series.subscribeHoveredPointChange(info => { notes.push(info === null ? null : info.objectId); });
	await frames(3);
	const b = series.pointById('b');

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(b.x), y: Math.round(b.y) } },
	];
	window.afterInitialInteractions = async () => {
		await frames(2);
		if (JSON.stringify(notes) !== '["b"]') { throw new Error(`The pointer hover was not notified: ${JSON.stringify(notes)}`); }

		// Pending: a refresh moving the hovered point, and a hover change.
		series.setData([{ id: 'a', x: 0, y: 1 }, { id: 'b', x: 6, y: 5 }, { id: 'c', x: 10, y: 10 }]);
		series.setHoveredPoint('c');
		chart.remove();
		await frames(3);
		if (errors.length > 0) { throw new Error(`Errors after chart.remove(): ${errors.join('; ')}`); }
		if (JSON.stringify(notes) !== '["b",null]') { throw new Error(`The hovered point should be notified null once: ${JSON.stringify(notes)}`); }
		inert(series, 'chart removed');
		await frames(3);
		series.remove();
		series.remove();
		await frames(2);
		if (errors.length > 0) { throw new Error(`Errors after series.remove(): ${errors.join('; ')}`); }
		if (JSON.stringify(notes) !== '["b",null]') { throw new Error(`Notified again: ${JSON.stringify(notes)}`); }

		// Hovered through setHoveredPoint, nothing pending when the chart goes:
		// told on series.remove().
		const other = document.createElement('div');
		other.style.cssText = 'position: absolute; left: 0; top: 0; width: 400px; height: 300px;';
		document.body.appendChild(other);
		const otherChart = LwcPlugin.createScatterChart(other, { layout: { attributionLogo: false } });
		const otherSeries = LwcPlugin.createScatterSeries(otherChart);
		const otherNotes = [];
		otherSeries.subscribeHoveredPointChange(info => { otherNotes.push(info === null ? null : info.objectId); });
		otherSeries.setData(points);
		await frames(3);
		otherSeries.setHoveredPoint('a');
		await frames(3);
		if (JSON.stringify(otherNotes) !== '["a"]') { throw new Error(`setHoveredPoint was not notified: ${JSON.stringify(otherNotes)}`); }
		otherChart.remove();
		await frames(3);
		inert(otherSeries, 'other chart removed');
		await frames(3);
		otherSeries.remove();
		if (JSON.stringify(otherNotes) !== '["a",null]') { throw new Error(`series.remove() should notify null: ${JSON.stringify(otherNotes)}`); }
		other.remove();
		if (errors.length > 0) { throw new Error(`Errors: ${errors.join('; ')}`); }
	};
}
