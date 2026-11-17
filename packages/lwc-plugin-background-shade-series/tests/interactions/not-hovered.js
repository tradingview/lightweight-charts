// The shade is a background: a pointer over a shaded slot, away from any other
// series, never reports the shade as hovered. The shade shares the line's
// scale here, and the pointer is at the height of the shade's own value, where
// the chart's fallback hit test would find it if it had plot values.
let chart;
let shade;
let line;
let lastInfo;
let moves = 0;

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	line = chart.addSeries(LightweightCharts.LineSeries);
	line.setData(times.map((time, i) => ({ time, value: i % 2 === 0 ? 0 : 100 })));
	shade = LwcPlugin.createBackgroundShadeSeries(chart, { priceScaleId: 'right' });
	shade.setData(times.map((time, i) => ({ time, value: i * 5 })));
	chart.timeScale().fitContent();
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
		moves++;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

window.initialInteractionsToPerform = () => {
	// Bar 10 has the value 50; the line is at 0 and 100 around it.
	const x = chart.timeScale().timeToCoordinate(1704067200 + 10 * 86400);
	const y = line.priceToCoordinate(50);
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(x), y: Math.round(y) } }];
};

window.afterInitialInteractions = () => {
	if (moves === 0) {
		throw new Error('No crosshair move was reported');
	}
	if (lastInfo !== undefined && lastInfo.series === shade) {
		throw new Error('The shade was reported as hovered');
	}
};
