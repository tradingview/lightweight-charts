function interactionsToPerform() {
	return [];
}

let chart;
let mainSeries;
let timeScale;
let data;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	mainSeries = chart.addCandlestickSeries();

	data = generateBars();
	mainSeries.setData(data);

	timeScale = chart.timeScale();

	timeScale.fitContent();
	timeScale.options();

	const logical = timeScale.coordinateToLogical(300);
	timeScale.logicalToCoordinate(logical);

	const time = timeScale.coordinateToTime(300);
	timeScale.timeToCoordinate(time);

	timeScale.width();
	timeScale.height();

	return Promise.resolve();
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

async function delay(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}

async function afterInteractions() {
	timeScale.getVisibleRange();
	timeScale.setVisibleRange({
		from: data[0].time,
		to: data[data.length - 1].time,
	});

	mainSeries.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());

	timeScale.applyOptions({ fixLeftEdge: true });

	timeScale.applyOptions({
		timeVisible: true,
		secondsVisible: true,
	});

	await awaitNewFrame();

	// set timeout
	const pos = timeScale.scrollPosition();
	timeScale.scrollToPosition(pos - 20, false);
	await awaitNewFrame();
	await delay(50);
	timeScale.scrollToPosition(pos - 10, true);

	await awaitNewFrame();
	await delay(50);

	timeScale.scrollToRealTime();

	await awaitNewFrame();
	await delay(50);

	chart.applyOptions({
		layout: {
			fontFamily: undefined,
		},
		timeScale: {
			barSpacing: 12,
			minBarSpacing: 2,
			rightOffset: 4,
			fixRightEdge: true,
			fixLeftEdge: true,
		},
	});

	await awaitNewFrame();
	await delay(50);

	timeScale.resetTimeScale();

	await awaitNewFrame();

	chart.timeScale().applyOptions({ lockVisibleTimeRangeOnResize: true });
	chart.resize(200, 200);

	await awaitNewFrame();

	return Promise.resolve();
}
