// Every group hidden, as a legend switching them all off: nothing is drawn,
// but the X axis stays where the points are, fitted edge to edge, and the
// price scale keeps their range, with the border and the baseline.

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
	const series = LwcPlugin.createScatterSeries(chart, {
		groups: [{ id: 'win', color: '#089981', visible: false }, { id: 'loss', color: '#F23645', visible: false }],
		plotBorder: { visible: true, top: false, right: false },
		baselines: [{ axis: 'y', value: 0 }],
	});
	const random = seededRandom(5);
	const points = [];
	for (let i = 0; i < 60; i++) {
		const win = random() < 0.5;
		points.push({ x: 2 + random() * 80, y: (win ? 1 : -1) * (100 + random() * 900), group: win ? 'win' : 'loss' });
	}
	series.setData(points);
}
