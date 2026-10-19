// Relative rotation graph: groups connected by lines in data order (opaque
// points by default with lines), a dashed 2 px tail, a hidden group (neither
// drawn nor scaled), baselines at 100.

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

// Four sectors rotating around (100, 100), ten weeks each, the head drawn bigger.
function rotation() {
	const random = seededRandom(6);
	const sectors = [
		{ id: 'tech', x: 102.6, y: 100.6, heading: 2.2 },
		{ id: 'energy', x: 97.6, y: 99.0, heading: 4.2 },
		{ id: 'utilities', x: 98.2, y: 99.6, heading: 0.2 },
		{ id: 'health', x: 101.6, y: 99.2, heading: 3.0 },
	];
	const points = [];
	for (const sector of sectors) {
		let { x, y, heading } = sector;
		for (let week = 1; week <= 10; week++) {
			points.push({ id: `${sector.id}-${week}`, group: sector.id, x, y, size: week === 10 ? 13 : undefined });
			heading -= 0.32 + random() * 0.18;
			const step = 0.45 + random() * 0.35;
			x = Math.min(103.7, Math.max(96.3, x + Math.cos(heading) * step));
			y = Math.min(103.7, Math.max(96.3, y + Math.sin(heading) * step));
		}
	}
	return points;
}

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		groups: [
			{ id: 'tech', color: '#4CAF50', lineVisible: true, pointSize: 7 },
			{ id: 'energy', color: '#2962FF', lineVisible: true, pointSize: 7, lineColor: 'rgba(41, 98, 255, 0.5)' },
			{ id: 'utilities', color: '#FBC02D', lineVisible: true, pointSize: 7, lineWidth: 2, lineStyle: LightweightCharts.LineStyle.Dashed },
			{ id: 'health', color: '#9C27B0', lineVisible: true, pointSize: 7, visible: false },
		],
		xRange: { min: 96, max: 104 },
		baselines: [{ axis: 'y', value: 100 }, { axis: 'x', value: 100 }],
		priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
	});
	series.setData(rotation());
}
