// The hit test honors the series' hitTestTolerance option. 2 px right of the
// dot's edge the lollipop is hovered with the default tolerance of 3, and not
// once the tolerance is 0.
let chart;
let series;
let data;
let lastInfo;

function besideDot() {
	return {
		x: Math.round(chart.timeScale().timeToCoordinate(data[4].time)) + 10,
		y: Math.round(series.priceToCoordinate(data[4].value)),
	};
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

window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: besideDot() }];

window.afterInitialInteractions = () => {
	if (lastInfo === undefined || lastInfo.objectId !== 'bar-4') {
		throw new Error(`Expected the lollipop within the default tolerance, got ${JSON.stringify(lastInfo && lastInfo.objectId)}`);
	}
	series.applyOptions({ hitTestTolerance: 0 });
};

window.finalInteractionsToPerform = () => {
	const point = besideDot();
	return [
		{ action: 'moveMouseXY', target: 'pane', options: { x: point.x + 15, y: point.y } },
		{ action: 'moveMouseXY', target: 'pane', options: point },
	];
};

window.afterFinalInteractions = () => {
	if (lastInfo !== undefined && lastInfo.objectId !== undefined) {
		throw new Error(`Expected no lollipop with a tolerance of 0, got ${JSON.stringify(lastInfo.objectId)}`);
	}
};
