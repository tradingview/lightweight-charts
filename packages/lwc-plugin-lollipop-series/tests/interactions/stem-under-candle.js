// The chart prefers a point hit to any other, whatever the distance. A stem is
// a range, so with the pointer inside a candle body and a stem 1 px away, the
// candle is hovered, not the lollipop; on the dot itself the lollipop is.
let chart;
let candles;
let lollipops;
let lastInfo;
let stemX;
let dotY;
let bodyY;

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false }, timeScale: { barSpacing: 40 } });
	const times = Array.from({ length: 8 }, (_, i) => 1704067200 + i * 86400);
	candles = chart.addSeries(LightweightCharts.CandlestickSeries);
	candles.setData(times.map(time => ({ time, open: 40, high: 70, low: 10, close: 60 })));
	lollipops = LwcPlugin.createLollipopSeries(chart, { lineWidth: 2, markerSize: 10 });
	lollipops.setData(times.map(time => ({ time, value: 80 })));
	chart.timeScale().fitContent();
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	stemX = Math.round(chart.timeScale().timeToCoordinate(times[4]));
	dotY = Math.round(lollipops.priceToCoordinate(80));
	bodyY = Math.round(candles.priceToCoordinate(50));
}

window.initialInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: stemX + 2, y: bodyY } }];

window.afterInitialInteractions = () => {
	if (lastInfo === undefined || lastInfo.series !== candles) {
		throw new Error(`Expected the candle body to be hovered over the stem, got ${JSON.stringify(lastInfo && lastInfo.objectId)}`);
	}
};

window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'pane', options: { x: stemX, y: dotY } }];

window.afterFinalInteractions = () => {
	if (lastInfo === undefined || lastInfo.series !== lollipops || lastInfo.objectId !== 'bar-4') {
		throw new Error(`Expected the dot to be hovered, got ${JSON.stringify(lastInfo && lastInfo.objectId)}`);
	}
};
