// The hovered-point subscription follows the hovered point, not just its id:
// a resize while a point is hovered from outside the chart (a legend), where
// nothing else would tell the host, notifies the point at its new place, and
// so does a data refresh which keeps the hovered id but moves the point and
// replaces its fields. Every notification carries the geometry on screen.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	container.style.width = '600px';
	const chart = LwcPlugin.createScatterChart(container, { autoSize: true, layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 40 });
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	const last = () => changes[changes.length - 1];
	series.setData([
		{ id: 'a', x: 0, y: 0, title: 'v1' },
		{ id: 'keep', x: 50, y: 50, title: 'v1' },
		{ id: 'c', x: 100, y: 100, title: 'v1' },
	]);
	await frames(3);
	const matchesScreen = (info, stage) => {
		const drawn = series.pointById(info.objectId);
		if (drawn === null || drawn.x !== info.x || drawn.y !== info.y || drawn.radius !== info.radius || drawn.point !== info.point) {
			throw new Error(`${stage}: notified ${JSON.stringify(info)}, drawn ${JSON.stringify(drawn)}`);
		}
	};

	// Hovered from outside the chart, then the chart is resized.
	series.setHoveredPoint('keep');
	await frames(3);
	const external = last();
	if (changes.length !== 1 || external === null || external.objectId !== 'keep') { throw new Error(`setHoveredPoint was not notified: ${JSON.stringify(changes)}`); }
	matchesScreen(external, 'hovered from outside');
	container.style.width = '400px';
	await frames(5);
	const resized = last();
	if (changes.length < 2 || resized.objectId !== 'keep' || resized.x >= external.x - 50) {
		throw new Error(`A resize should notify the externally hovered point at its new place: ${JSON.stringify(resized)} after ${JSON.stringify(external)}`);
	}
	matchesScreen(resized, 'after the resize');
	// A rescaled price axis moves the point too; the same point object is kept.
	const beforeRescale = changes.length;
	const kept = series.data()[1];
	series.setData([{ id: 'a', x: 0, y: -1000 }, kept, { id: 'c', x: 100, y: 100 }]);
	await frames(4);
	if (changes.length === beforeRescale || last().point !== kept || Math.abs(last().y - resized.y) < 10) {
		throw new Error(`A rescaled price axis did not notify the hovered point: ${JSON.stringify(last())} after ${JSON.stringify(resized)}`);
	}
	matchesScreen(last(), 'after the rescale');
	series.setHoveredPoint(null);
	await frames(3);
	if (last() !== null) { throw new Error('Clearing the external hover did not notify null'); }

	series.setData([
		{ id: 'a', x: 0, y: 0, title: 'v1' },
		{ id: 'keep', x: 50, y: 50, title: 'v1' },
		{ id: 'c', x: 100, y: 100, title: 'v1' },
	]);
	await frames(3);
	const keep = series.pointById('keep');
	const start = changes.length;

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(keep.x), y: Math.round(keep.y) } },
	];
	window.afterInitialInteractions = async () => {
		await frames();
		const hovered = changes.slice(start);
		if (hovered.length !== 1 || hovered[0] === null || hovered[0].objectId !== 'keep' || hovered[0].point.title !== 'v1') {
			throw new Error(`The pointer should hover "keep": ${JSON.stringify(hovered.map(c => c && c.objectId))}`);
		}

		// A refresh: the same ids, "keep" moved a little (still under the pointer) and re-titled.
		const refreshed = { id: 'keep', x: 51, y: 52, title: 'v2' };
		series.setData([{ id: 'a', x: 0, y: 0, title: 'v2' }, refreshed, { id: 'c', x: 100, y: 100, title: 'v2' }]);
		await frames(3);
		const notified = last();
		if (changes.length < start + 2 || notified === null || notified.point !== refreshed || notified.point.title !== 'v2') {
			throw new Error(`A refresh of the hovered point was not notified: ${JSON.stringify(changes.slice(start + 1))}`);
		}
		matchesScreen(notified, 'after the refresh');
		if (Math.abs(notified.x - keep.x) < 1 || Math.abs(notified.y - keep.y) < 1) {
			throw new Error(`The refreshed point should have moved: ${keep.x},${keep.y} -> ${notified.x},${notified.y}`);
		}

		// The same values in new objects: notified once, as the host's point changed.
		const count = changes.length;
		const again = { ...refreshed };
		series.setData([{ id: 'a', x: 0, y: 0 }, again, { id: 'c', x: 100, y: 100 }]);
		await frames(3);
		if (changes.length !== count + 1 || last().point !== again) {
			throw new Error(`New point objects should be notified once, got ${changes.length - count}`);
		}

		// A full update of the chart lays the axes out afresh (the price scale,
		// widened by the earlier data, shrinks): the point moves, and is notified.
		chart.applyOptions({ layout: { background: { color: '#FAFAFA' } } });
		await frames(4);
		matchesScreen(last(), 'after a full update');
		// The ring takes the new background: the point looks different, and is notified so.
		if (last().strokeColor !== '#FAFAFA') { throw new Error(`The notified ring colour is not the background: ${last().strokeColor}`); }
		// Nothing about the point changes: no notification.
		const quiet = changes.length;
		series.applyOptions({ hoveredOpacity: 0.9 });
		chart.applyOptions({ layout: { background: { color: '#FAFAFA' }, textColor: '#131722' } });
		await frames(3);
		if (changes.length !== quiet) { throw new Error(`A change which leaves the point as it is notified it: ${JSON.stringify(changes.slice(quiet))}`); }
	};
}
