// groups() hands a host legend the groups as they are drawn: declared ones
// first, then the ones the points name, in order of appearance, each with its
// palette colour, shape, visibility and point count. setGroupVisible switches
// a group off and on — even one never declared — without changing any colour
// or order, without moving the X axis, and with the price scale following.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, {
		groups: [
			{ id: 'declared', name: 'Declared', shape: 'diamond' },
			{ id: 'own', name: 'Own colour', color: '#123456', lineVisible: true },
		],
	});
	const palette = LwcPlugin.DEFAULT_SCATTER_PALETTE;
	series.setData([
		{ id: 'u1', x: 0, y: 0, group: 'undeclared-1' },
		{ id: 'd1', x: 10, y: 10, group: 'declared' },
		{ id: 'u2', x: 20, y: 500, group: 'undeclared-2' },
		{ id: 'u2b', x: 30, y: 400, group: 'undeclared-2' },
		{ id: 'o1', x: 40, y: 40, group: 'own' },
		{ id: 'n1', x: 50, y: 50 },
	]);
	await frames(3);

	const describe = () => series.groups().map(group => [group.id, group.name, group.color, group.shape, group.visible, group.pointCount]);
	const expected = [
		['declared', 'Declared', palette[0], 'diamond', true, 1],
		['own', 'Own colour', '#123456', 'circle', true, 1],
		['undeclared-1', 'undeclared-1', palette[2], 'circle', true, 1],
		['undeclared-2', 'undeclared-2', palette[3], 'circle', true, 2],
	];
	const check = (stage, visible) => {
		const actual = describe();
		const want = expected.map(row => [...row.slice(0, 4), visible[row[0]] !== false, row[5]]);
		if (JSON.stringify(actual) !== JSON.stringify(want)) {
			throw new Error(`${stage}: groups() is ${JSON.stringify(actual)}, expected ${JSON.stringify(want)}`);
		}
	};
	check('initially', {});
	const own = series.groups()[1];
	if (own.opacity !== 1 || own.lineVisible !== true || own.lineColor !== '#123456' || own.lineWidth !== 1 || own.pointSize !== 9) {
		throw new Error(`A group with lines is not resolved: ${JSON.stringify(own)}`);
	}
	// The colours are the ones drawn.
	if (series.pointById('u2').color !== palette[3] || series.pointById('d1').color !== palette[0]) { throw new Error('groups() and the drawn colours disagree'); }

	const domain = series.xDomain();
	const top = () => series.series().coordinateToPrice(0);
	const topWithAll = top();

	// An undeclared group in the middle of the undeclared ones.
	series.setGroupVisible('undeclared-2', false);
	await frames(3);
	check('undeclared-2 hidden', { 'undeclared-2': false });
	if (series.pointById('u2') !== null) { throw new Error('A hidden group is still drawn'); }
	if (series.pointById('u1').color !== palette[2]) { throw new Error('Hiding a group changed the colour of another'); }
	const after = series.xDomain();
	if (after.min !== domain.min || after.max !== domain.max) { throw new Error(`Hiding a group moved the X axis: ${JSON.stringify(after)}`); }
	if (!(top() < topWithAll / 2)) { throw new Error(`The price scale should drop to the visible points: ${topWithAll} -> ${top()}`); }

	series.setGroupVisible('declared', false);
	series.setGroupVisible('declared', false);
	await frames(3);
	check('declared hidden too', { 'undeclared-2': false, declared: false });

	series.setGroupVisible('undeclared-2', true);
	series.setGroupVisible('declared', true);
	// Unknown groups and groups already shown: nothing happens.
	series.setGroupVisible('nonexistent', false);
	series.setGroupVisible('undeclared-1', true);
	await frames(3);
	check('all shown again', {});
	if (Math.abs(top() - topWithAll) > 1e-6) { throw new Error(`Showing every group again should restore the price scale: ${topWithAll} vs ${top()}`); }
	// The returned infos are copies: changing one changes nothing.
	series.groups()[0].color = 'red';
	if (series.groups()[0].color !== palette[0]) { throw new Error('groups() returned the internal state'); }
}
