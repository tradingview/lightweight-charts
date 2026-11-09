// A pointer inside a dot but farther from the stem than the hit tolerance,
// and then over the middle of a stem, reports that lollipop through the
// crosshair as `hoveredInfo.objectId`: each part is hit on its own.
let chart;
let series;
let data;
let lastInfo;

function pointAt(index) {
	return {
		x: Math.round(chart.timeScale().timeToCoordinate(data[index].time)),
		y: Math.round(series.priceToCoordinate(data[index].value)),
	};
}

function expectHovered(index) {
	if (lastInfo === undefined || lastInfo.series !== series) {
		throw new Error(`Expected the series to be hovered, got ${JSON.stringify(lastInfo && lastInfo.objectKind)}`);
	}
	if (lastInfo.objectId !== `bar-${index}`) {
		throw new Error(`Expected objectId "bar-${index}", got ${JSON.stringify(lastInfo.objectId)}`);
	}
}

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 40 },
	});
	series = LwcPlugin.createLollipopSeries(chart, { lineWidth: 2, markerSize: 16 });
	data = Array.from({ length: 10 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 10 + i }));
	series.setData(data);
	chart.timeScale().fitContent();
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

window.initialInteractionsToPerform = () => {
	// 6 px right of the stem's center: inside the 16 px dot, and 5 px from the
	// stem's edge, beyond the default 3 px tolerance.
	const dot = pointAt(4);
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: dot.x + 6, y: dot.y } }];
};

window.afterInitialInteractions = () => expectHovered(4);

window.finalInteractionsToPerform = () => {
	const top = pointAt(6);
	const baseY = series.priceToCoordinate(0);
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: top.x, y: Math.round((top.y + baseY) / 2) } }];
};

window.afterFinalInteractions = () => expectHovered(6);
