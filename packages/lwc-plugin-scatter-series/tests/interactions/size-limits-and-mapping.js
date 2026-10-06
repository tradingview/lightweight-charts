// pointSizeLimits bounds every size: changing it with applyOptions re-renders
// the points and the price scale keeps room for the largest one only. A small
// point keeps its colour under its ring, which groups() reports as drawn. sizeMapping() gives a bubble-size
// legend the sizes as drawn: sizeFor(sizeValue) is the diameter pointById
// reports, hidden groups included in the domain, through limits changes and a
// degenerate domain; null without sizeValue.
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
	const close = (actual, expected, what) => {
		if (actual === null || Math.abs(actual - expected) > 1e-9) {
			throw new Error(`${what}: expected ${expected}, got ${actual}`);
		}
	};

	const chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 1,
		color: '#2962FF',
		groups: [{ id: 'shown' }, { id: 'hidden', visible: false }],
	});
	const points = [
		{ id: 'p0', x: 10, y: 10, group: 'shown', sizeValue: 10 },
		{ id: 'p1', x: 30, y: 40, group: 'shown', sizeValue: 25 },
		{ id: 'p2', x: 50, y: 60, group: 'shown', sizeValue: 70 },
		{ id: 'p3', x: 70, y: 90, group: 'shown', sizeValue: 100 },
		{ id: 'big', x: 90, y: 50, group: 'shown', size: 40 },
		{ id: 'h', x: 60, y: 20, group: 'hidden', sizeValue: 0 },
	];
	series.setData(points);
	await frames(3);

	/** Every visible point sized by its value is drawn at sizeFor(value). */
	const expectParity = stage => {
		const mapping = series.sizeMapping();
		if (mapping === null) { throw new Error(`${stage}: no size mapping`); }
		for (const point of points) {
			if (point.sizeValue === undefined || point.group === 'hidden') {
				continue;
			}
			close(series.pointById(point.id).radius * 2, mapping.sizeFor(point.sizeValue), `${stage}: diameter of ${point.id}`);
		}
		return mapping;
	};

	// The domain spans the hidden group's values too.
	let mapping = expectParity('default');
	if (mapping.domain.min !== 0 || mapping.domain.max !== 100 || mapping.range.min !== 5 || mapping.range.max !== 25 || mapping.scale !== 'linear') {
		throw new Error(`Unexpected mapping: ${JSON.stringify(mapping)}`);
	}
	close(mapping.sizeFor(50), 15, 'sizeFor of the middle');
	close(mapping.sizeFor(1000), 25, 'sizeFor beyond the domain');
	if (!Number.isNaN(mapping.sizeFor(Number.NaN))) { throw new Error('sizeFor(NaN) should be NaN'); }
	// A snapshot: changing it changes nothing.
	mapping.range.max = 99;
	if (series.sizeMapping().range.max !== 25) { throw new Error('sizeMapping() exposes the series state'); }
	close(series.pointById('big').radius, 20, 'radius of a 40 px point');

	const top = () => series.series().priceToCoordinate(90);
	const topBefore = top();
	const p2 = series.pointById('p2');
	if (pixel(p2.x, p2.y - 7)[0] > 120) { throw new Error(`The 19 px point is not painted: ${pixel(p2.x, p2.y - 7)}`); }

	// Small limits: every size follows, area scale too, and the price scale keeps less room.
	series.applyOptions({ pointSizeLimits: { min: 2, max: 3 }, sizeRange: { min: 1, max: 10 }, sizeScale: 'area' });
	await frames(3);
	mapping = expectParity('small limits');
	if (mapping.range.min !== 2 || mapping.range.max !== 3 || mapping.scale !== 'area') {
		throw new Error(`The mapping does not follow the limits: ${JSON.stringify(mapping)}`);
	}
	close(series.pointById('big').radius, 1.5, 'radius of a 40 px point limited to 3 px');
	if (series.options().pointSizeLimits.max !== 3) { throw new Error('options() does not report pointSizeLimits'); }
	if (!(top() < topBefore - 5)) { throw new Error(`The price scale margins did not shrink with the sizes: ${topBefore} → ${top()}`); }
	const small = series.pointById('p2');
	const away = pixel(small.x, small.y - 7);
	if (away[0] < 250 || away[1] < 250) { throw new Error(`The point was not redrawn smaller: ${away}`); }

	// Large limits: past the default 50 px.
	series.applyOptions({ pointSizeLimits: { min: 5, max: 120 }, sizeRange: { min: 10, max: 100 } });
	await frames(3);
	mapping = expectParity('large limits');
	close(mapping.range.max, 100, 'a size range past 50 px');
	close(series.pointById('p3').radius, 50, 'radius of the largest value');

	// A small point keeps its colour: a 6 px dot with a 3 px ring is not all ring.
	series.applyOptions({ pointSizeLimits: { min: 1, max: 50 }, pointSize: 6, strokeWidth: 3, sizeDomain: { min: 0, max: 100 } });
	series.setData([{ id: 'dot', x: 50, y: 50, group: 'shown', color: '#F23645' }, { x: 0, y: 0, size: 1 }, { x: 100, y: 100, size: 1 }]);
	await frames(3);
	if (series.sizeMapping() !== null) { throw new Error('sizeMapping() should be null without sizeValue'); }
	const dot = series.pointById('dot');
	close(dot.radius, 3, 'radius of the 6 px dot');
	close(dot.strokeWidth, 1.5, 'the ring of a 6 px dot is a quarter of its size');
	// groups() reports the ring as drawn on a point of the group's size, so a legend matches the dots.
	close(series.groups()[0].strokeWidth, dot.strokeWidth, 'groups() and pointById disagree on the ring of a 6 px dot');
	series.applyOptions({ groups: [{ id: 'shown', hollow: true, strokeWidth: 0, pointSize: 2 }, { id: 'hidden', visible: false }] });
	await frames(2);
	close(series.groups()[0].strokeWidth, 0.5, 'the outline of a hollow 2 px group');
	close(series.pointById('dot').strokeWidth, 0.5, 'the outline of a hollow 2 px dot');
	series.applyOptions({ groups: [{ id: 'shown' }, { id: 'hidden', visible: false }] });
	await frames(2);
	// The pixel holding the centre.
	const centre = pixel(dot.x - 0.5, dot.y - 0.5);
	if (centre[0] < 200 || centre[1] > 120) { throw new Error(`The 6 px dot lost its colour under its ring: ${centre}`); }

	// A degenerate domain: every point at the middle of the range, as sizeFor says.
	series.applyOptions({ sizeDomain: { min: null, max: null }, sizeRange: { min: 10, max: 20 }, sizeScale: 'linear' });
	series.setData([{ id: 'e1', x: 10, y: 10, sizeValue: 7 }, { id: 'e2', x: 90, y: 90, sizeValue: 7 }]);
	await frames(3);
	mapping = series.sizeMapping();
	if (mapping.domain.min !== 7 || mapping.domain.max !== 7) { throw new Error(`Degenerate domain: ${JSON.stringify(mapping.domain)}`); }
	close(mapping.sizeFor(7), 15, 'sizeFor on a degenerate domain');
	close(mapping.sizeFor(-100), 15, 'sizeFor of any value on a degenerate domain');
	close(series.pointById('e1').radius * 2, 15, 'drawn size on a degenerate domain');
}
