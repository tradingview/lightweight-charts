// Where neighboring dots touch, the pointer is reported on the dot it is
// nearest to as drawn. Near the corner of the square around one dot, the
// pointer can be closer to the next dot's circle, which sits 6 px higher: the
// series has to report that dot, not the one whose square the pointer is in.
// The test finds such a pixel from the dots' positions on screen.
let chart;
let series;
let lastId;
let target;

const RADIUS = 6;

function boxDistance(px, py, center) {
	const dx = Math.max(0, Math.abs(px - center.x) - RADIUS);
	const dy = Math.max(0, Math.abs(py - center.y) - RADIUS);
	return Math.hypot(dx, dy);
}

function circleDistance(px, py, center) {
	return Math.max(0, Math.hypot(px - center.x, py - center.y) - RADIUS);
}

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 2 * RADIUS },
	});
	// A fixed price range, so that the gap between the two heights can be set
	// in pixels.
	series = LwcPlugin.createLollipopSeries(chart, {
		markerSize: 2 * RADIUS,
		priceLineVisible: false,
		lastValueVisible: false,
		autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
	});
	const times = Array.from({ length: 30 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map(time => ({ time, value: 50 })));
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const higher = 50 + 6 / (series.priceToCoordinate(50) - series.priceToCoordinate(51));
	series.setData(times.map((time, i) => ({ time, value: i % 2 === 0 ? 50 : higher })));
	chart.subscribeCrosshairMove(param => {
		lastId = param.hoveredInfo?.series === series ? param.hoveredInfo.objectId : undefined;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

	const at = index => ({
		x: chart.timeScale().timeToCoordinate(times[index]),
		y: series.priceToCoordinate(index % 2 === 0 ? 50 : higher),
	});
	const a = at(20);
	const b = at(21);
	for (let px = Math.floor(a.x); px <= Math.ceil(a.x + RADIUS) && target === undefined; px++) {
		for (let py = Math.floor(a.y - RADIUS); py <= Math.ceil(a.y) && target === undefined; py++) {
			if (boxDistance(px, py, a) < boxDistance(px, py, b) && circleDistance(px, py, b) < circleDistance(px, py, a) && circleDistance(px, py, b) <= 2) {
				target = { x: px, y: py };
			}
		}
	}
	if (target === undefined) {
		throw new Error('No pixel near the first dot is closer to the second dot');
	}
}

window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: target }];

window.afterInitialInteractions = () => {
	if (lastId !== 'bar-21') {
		throw new Error(`Expected the nearer dot, bar-21, to be hovered, got ${JSON.stringify(lastId)}`);
	}
};
