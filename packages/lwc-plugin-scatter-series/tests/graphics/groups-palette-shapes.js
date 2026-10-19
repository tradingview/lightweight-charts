// Ten groups without colours take the default palette in group order, each
// with a marker shape; a hidden group is skipped.

// A seeded generator (mulberry32), so that both screenshots draw the same data.
function seededRandom(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const shapes = ['circle', 'square', 'diamond', 'triangleUp', 'triangleDown'];
	const groups = [];
	for (let g = 0; g < 10; g++) {
		groups.push({ id: `g${g}`, name: `Group ${g + 1}`, shape: shapes[g % shapes.length] });
	}
	groups.push({ id: 'hidden', visible: false });
	const series = LwcPlugin.createScatterSeries(chart, { groups, pointSize: 14, opacity: 0.9 });
	const random = seededRandom(4);
	const points = [];
	for (let g = 0; g < 10; g++) {
		for (let i = 0; i < 6; i++) {
			points.push({ group: `g${g}`, x: i * 2 + random(), y: g + random() * 0.6 });
		}
	}
	points.push({ group: 'hidden', x: 5, y: 4.5, size: 50 });
	series.setData(points);
}
