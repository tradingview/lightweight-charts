// setData replacing the points must not leave a stale hovered point behind:
// neither one whose id is gone, nor one whose id came from its index (the same
// index is now another point). A point with a stable `id` stays hovered and is
// notified again at its new place, and a point hovered through the API right
// after setData is notified with the geometry it is drawn at, not with the
// scales of the previous data.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const opaque = rgba => Math.abs(rgba[0] - 41) <= 2 && Math.abs(rgba[1] - 98) <= 2 && Math.abs(rgba[2] - 255) <= 2;

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 24, opacity: 0.4, color: '#2962FF' });
	const changes = [];
	series.subscribeHoveredPointChange(info => changes.push(info));
	const lastChange = () => changes[changes.length - 1];
	// No ids: the objectIds are the indices.
	series.setData([
		{ x: 0, y: 0 },
		{ x: 50, y: 20 },
		{ x: 100, y: 40 },
	]);
	await frames();
	const hovered = series.pointById('1');

	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(hovered.x), y: Math.round(hovered.y) } },
	];
	window.afterInitialInteractions = async () => {
		await frames();
		if (series.hoveredPoint() === null || series.hoveredPoint().objectId !== '1' || lastChange().objectId !== '1') {
			throw new Error('The pointer should hover point "1"');
		}
		// Index 1 is now a different point, away from the pointer.
		series.setData([
			{ x: 0, y: 0 },
			{ x: 90, y: 35 },
			{ x: 100, y: 40 },
		]);
		await frames();
		if (series.hoveredPoint() !== null) {
			throw new Error(`An index-based hovered point survived setData: ${series.hoveredPoint().objectId}`);
		}
		if (lastChange() !== null) { throw new Error('setData did not notify the cleared hover'); }
		const moved = series.pointById('1');
		if (opaque(pixel(moved.x, moved.y))) { throw new Error('The point now at index 1 is painted as hovered'); }

		// Hovered through the API right after new data: notified at the drawn geometry.
		const count = changes.length;
		series.setData([
			{ id: 'keep', x: 10, y: 10 },
			{ id: 'other', x: 30, y: 30 },
		]);
		series.setHoveredPoint('keep');
		await frames();
		await frames();
		const keep = series.pointById('keep');
		const keepChanges = changes.slice(count);
		if (keep === null || keepChanges.length === 0 || keepChanges.some(info => info === null || info.objectId !== 'keep')) {
			throw new Error(`Expected notifications for "keep" only, got ${JSON.stringify(keepChanges.map(c => c && c.objectId))}`);
		}
		const notified = lastChange();
		if (notified.x !== keep.x || notified.y !== keep.y) {
			throw new Error(`"keep" was notified at stale geometry: ${JSON.stringify(notified)} vs ${JSON.stringify(keep)}`);
		}
		if (!opaque(pixel(keep.x, keep.y))) { throw new Error('The point hovered through the API is not highlighted'); }

		// A stable id stays hovered when the data moves it, and is notified at its new place.
		const before = changes.length;
		const keepMoved = { id: 'keep', x: 20, y: 20 };
		series.setData([
			{ id: 'other', x: 30, y: 30 },
			keepMoved,
		]);
		await frames();
		const kept = series.hoveredPoint();
		if (kept === null || kept.objectId !== 'keep' || kept.index !== 1 || kept.point !== keepMoved) {
			throw new Error(`A point with a stable id should stay hovered at its new place: ${JSON.stringify(kept)}`);
		}
		const last = lastChange();
		if (changes.length === before || last === null || last.point !== keepMoved || last.index !== 1 || last.x !== kept.x || last.y !== kept.y) {
			throw new Error(`Moving the hovered point should notify it at its new place: ${JSON.stringify(last)} vs ${JSON.stringify(kept)}`);
		}
		// Nothing changes: no notification.
		const settled = changes.length;
		series.applyOptions({ plotBorder: { visible: false } });
		await frames();
		if (changes.length !== settled) { throw new Error('An option changing nothing about the point notified it'); }

		// Gone from the data: cleared and notified. (Two points, so that none is
		// under the pointer, which is still in the middle of the pane.)
		series.setData([{ id: 'other', x: 30, y: 30 }, { id: 'third', x: 40, y: 40 }]);
		if (series.hoveredPoint() !== null) { throw new Error('A hovered id which is gone survived setData'); }
		await frames();
		if (lastChange() !== null) { throw new Error('Removing the hovered point did not notify'); }
		series.setHoveredPoint(null);
	};
}
