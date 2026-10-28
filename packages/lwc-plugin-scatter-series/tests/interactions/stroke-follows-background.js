// The ring around every point defaults to the chart background, read at every
// draw: a dark theme gets a dark ring, a theme switch through
// chart.applyOptions repaints it, a gradient uses its top colour, and an
// explicit strokeColor wins.
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
	const near = (actual, expected, tolerance = 12) => expected.every((value, i) => Math.abs(actual[i] - value) <= tolerance);
	const hex = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)).concat(255);

	const DARK = '#131722';
	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false, background: { color: DARK }, textColor: '#D1D4DC' },
	});
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 40, strokeWidth: 4, opacity: 1, color: '#2962FF' });
	if (series.options().strokeColor !== null) { throw new Error('strokeColor should default to null: the background'); }
	// Two overlapping points: where the upper one's ring crosses the lower one, the ring shows.
	series.setData([{ id: 'low', x: 40, y: 50 }, { id: 'up', x: 60, y: 50 }, { id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 100 }]);
	await frames(3);
	const up = series.pointById('up');
	// Inside the ring of `up`, over `low`.
	const ring = { x: up.x - up.radius + 2, y: up.y };
	if (!near(pixel(ring.x, ring.y), hex(DARK))) { throw new Error(`The ring should take the dark background: ${pixel(ring.x, ring.y)}`); }

	chart.applyOptions({ layout: { background: { color: '#FFFFFF' } } });
	await frames(2);
	if (!near(pixel(ring.x, ring.y), [255, 255, 255, 255])) { throw new Error(`A theme switch did not repaint the ring: ${pixel(ring.x, ring.y)}`); }

	chart.applyOptions({ layout: { background: { type: 'gradient', topColor: '#FF9800', bottomColor: '#000000' } } });
	await frames(2);
	if (!near(pixel(ring.x, ring.y), hex('#FF9800'))) { throw new Error(`A gradient should give its top colour: ${pixel(ring.x, ring.y)}`); }

	series.applyOptions({ strokeColor: '#00FF00' });
	await frames(2);
	if (!near(pixel(ring.x, ring.y), [0, 255, 0, 255])) { throw new Error(`An explicit strokeColor should win: ${pixel(ring.x, ring.y)}`); }
	series.applyOptions({ strokeColor: null });
	await frames(2);
	if (!near(pixel(ring.x, ring.y), hex('#FF9800'))) { throw new Error(`strokeColor null should follow the background again: ${pixel(ring.x, ring.y)}`); }
}
