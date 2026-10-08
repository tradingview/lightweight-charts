// remove() takes the series off the chart and releases its subscriptions: no
// throw, nothing painted, the hovered-point subscribers told `null` once (the
// host's tooltip goes away) and nothing more, the chart gets back its own label
// distance — the host's latest, should it have set one meanwhile — and it keeps
// working: a chart takes one scatter series, so a second one throws until the
// first is removed, and is then added and hovered.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 2);
	const WHITE = [255, 255, 255, 255];

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false }, timeScale: { tickMarkMaxCharacterLength: 11 } });
	const series = LwcPlugin.createScatterSeries(chart, { opacity: 1, pointSize: 30, color: '#F23645' });
	let second = null;
	try {
		second = LwcPlugin.createScatterSeries(chart);
	} catch (error) {
		if (!/already has a scatter series/.test(String(error))) { throw new Error(`An unclear error for a second scatter series: ${error}`); }
	}
	if (second !== null) { throw new Error('A second scatter series on the chart did not throw'); }
	series.setData([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 5, y: 5 }, { id: 'c', x: 10, y: 10 }]);
	const notes = [];
	series.subscribeHoveredPointChange(info => { notes.push(info === null ? null : info.objectId); });
	const notified = () => JSON.stringify(notes);
	await frames();
	const b = series.pointById('b');
	if (!near(pixel(b.x, b.y), [242, 54, 69, 255])) { throw new Error(`The series did not paint: ${pixel(b.x, b.y)}`); }
	series.setHoveredPoint('b');
	await frames();
	if (notified() !== '["b"]') { throw new Error(`setHoveredPoint did not notify: ${notified()}`); }

	if (chart.options().timeScale.tickMarkMaxCharacterLength === 11) { throw new Error('The series does not manage the label distance'); }
	series.remove();
	// Told right away that the hovered point is gone, once.
	if (notified() !== '["b",null]') { throw new Error(`remove() should notify null once: ${notified()}`); }
	series.remove();
	if (notified() !== '["b",null]') { throw new Error(`A second remove() notified again: ${notified()}`); }
	if (chart.options().timeScale.tickMarkMaxCharacterLength !== 11) {
		throw new Error(`remove() did not give the chart back its label distance: ${chart.options().timeScale.tickMarkMaxCharacterLength}`);
	}
	// The detached API is inert.
	series.setData([{ x: 1, y: 1 }]);
	series.applyOptions({ color: '#000000', pointSize: 12 });
	series.setHoveredPoint('c');
	if (series.hoveredPoint() !== null || series.pointById('a') !== null) { throw new Error('A removed series still reports points'); }
	await frames();
	if (notified() !== '["b",null]') { throw new Error(`A removed series notified a hover change: ${notified()}`); }
	await frames();
	if (!near(pixel(b.x, b.y), WHITE)) { throw new Error(`The removed series is still painted: ${pixel(b.x, b.y)}`); }

	chart.applyOptions({ layout: { textColor: '#131722' } });
	chart.timeScale().fitContent();

	const next = LwcPlugin.createScatterSeries(chart, { opacity: 1, pointSize: 30, color: '#2962FF' });
	next.setData([{ id: 'n1', x: 100, y: 100 }, { id: 'n2', x: 150, y: 150 }, { id: 'n3', x: 200, y: 200 }]);
	await frames();
	const n2 = next.pointById('n2');
	if (n2 === null || !near(pixel(n2.x, n2.y), [41, 98, 255, 255])) { throw new Error('A series added after remove() did not paint'); }
	if (next.xDomain().min !== 100 || next.xDomain().max !== 200) { throw new Error(`Wrong X domain after re-adding: ${JSON.stringify(next.xDomain())}`); }

	let lastParam = null;
	chart.subscribeCrosshairMove(param => { lastParam = param; });
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(n2.x), y: Math.round(n2.y) } },
	];
	window.afterInitialInteractions = async () => {
		await frames();
		const info = lastParam && lastParam.hoveredInfo;
		if (!info || info.objectId !== 'n2' || info.series !== next.series()) {
			throw new Error(`The new series is not hoverable: ${JSON.stringify(info && info.objectId)}`);
		}
		if (notified() !== '["b",null]') { throw new Error(`The removed series was notified of the new hover: ${notified()}`); }

		// The host sets a label distance of its own meanwhile: the series manages
		// it again, and remove() gives back the host's latest, not the first one.
		chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: 7 } });
		next.applyOptions({ xFormatter: x => `${x} units` });
		await frames();
		if (chart.options().timeScale.tickMarkMaxCharacterLength === 7) { throw new Error('The series no longer manages the label distance'); }
		next.remove();
		if (chart.options().timeScale.tickMarkMaxCharacterLength !== 7) {
			throw new Error(`remove() should give back the host's latest label distance, 7, not ${chart.options().timeScale.tickMarkMaxCharacterLength}`);
		}
		// Set by the host after the series' last change: left as it is.
		const last = LwcPlugin.createScatterSeries(chart);
		last.setData([{ x: 1, y: 1 }, { x: 9, y: 2 }]);
		await frames();
		chart.applyOptions({ timeScale: { tickMarkMaxCharacterLength: 5 } });
		last.remove();
		if (chart.options().timeScale.tickMarkMaxCharacterLength !== 5) {
			throw new Error(`remove() should leave the host's own label distance, 5, not ${chart.options().timeScale.tickMarkMaxCharacterLength}`);
		}

		// Removing the chart first, then the series, as a host's teardown may do.
		const final = LwcPlugin.createScatterSeries(chart);
		final.setData([{ x: 1, y: 1 }, { x: 9, y: 2 }]);
		chart.remove();
		final.remove();
	};
}
