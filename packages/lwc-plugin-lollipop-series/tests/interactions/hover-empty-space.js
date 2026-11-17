// Halfway between two lollipops the pointer is too far from either to hover
// one. The chart's own fallback, which covers each bar's slot between its plot
// values, still reports the series there, but without an objectId. Above a
// dot, outside that range, nothing is hovered at all.
let chart;
let series;
let data;
let lastInfo;
let moves = 0;

function pointAt(index) {
	return {
		x: Math.round(chart.timeScale().timeToCoordinate(data[index].time)),
		y: Math.round(series.priceToCoordinate(data[index].value)),
	};
}

function expectNoLollipop(where) {
	if (moves === 0) {
		throw new Error('No crosshair move was reported');
	}
	if (lastInfo !== undefined && lastInfo.objectId !== undefined) {
		throw new Error(`${where}: expected no lollipop hovered, got ${JSON.stringify(lastInfo.objectId)}`);
	}
}

function expectNothingHovered(where) {
	expectNoLollipop(where);
	if (lastInfo !== undefined && lastInfo.series === series) {
		throw new Error(`${where}: expected the series not to be hovered`);
	}
}

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 40 },
	});
	series = LwcPlugin.createLollipopSeries(chart, { lineWidth: 2, markerSize: 10 });
	data = Array.from({ length: 10 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 10 + i }));
	series.setData(data);
	chart.timeScale().fitContent();
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
		moves++;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

window.initialInteractionsToPerform = () => {
	const left = pointAt(2);
	const right = pointAt(3);
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: Math.round((left.x + right.x) / 2), y: right.y } }];
};

window.afterInitialInteractions = () => {
	expectNoLollipop('between two lollipops');
	if (lastInfo === undefined || lastInfo.series !== series) {
		throw new Error('Expected the chart\'s own fallback to report the series between two lollipops');
	}
};

window.finalInteractionsToPerform = () => {
	const dot = pointAt(5);
	return [{ action: 'moveMouseXY', target: 'pane', options: { x: dot.x, y: dot.y - 20 } }];
};

window.afterFinalInteractions = () => expectNothingHovered('above a dot');
