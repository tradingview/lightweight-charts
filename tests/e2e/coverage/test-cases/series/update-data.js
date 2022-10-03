function interactionsToPerform() {
	return [];
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

let chart;
let lineSeries;
let leftSeries;
let lineData;
let barData;
let lastTime;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	lineSeries = chart.addLineSeries({
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.Continuous,
	});

	lineData = generateLineData();
	lastTime = new Date(lineData[lineData.length - 1].time);
	lineSeries.setData(lineData);

	leftSeries = chart.addCandlestickSeries({
		priceScaleId: 'left',
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.OnDataUpdate,
	});

	barData = generateBars();
	leftSeries.setData(barData);

	chart.timeScale().fitContent();

	return Promise.resolve();
}

async function afterInteractions() {
	lastTime.setUTCDate(lastTime.getUTCDate() + 1);
	lineSeries.update({
		time: lastTime.toISOString().slice(0, 10),
		value: 0.012,
	});

	lastTime.setUTCDate(lastTime.getUTCDate() + 1);
	lineSeries.update({
		time: lastTime.toISOString().slice(0, 10),
		value: 2411,
	});

	await awaitNewFrame();
	leftSeries.applyOptions({
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.Disabled,
	});

	lastTime.setUTCDate(lastTime.getUTCDate() + 1);
	lineSeries.update({
		time: lastTime.toISOString().slice(0, 10),
		value: 1234,
	});

	await awaitNewFrame();
	chart.timeScale().scrollToRealTime();

	lastTime.setUTCDate(lastTime.getUTCDate() + 1);
	lineSeries.update({
		time: lastTime.toISOString().slice(0, 10),
		value: 1234567,
	});

	await awaitNewFrame();

	lastTime.setUTCDate(lastTime.getUTCDate() + 1);
	lineSeries.update({
		time: lastTime.toISOString().slice(0, 10),
		value: 12345678912,
	});

	leftSeries.update({
		...barData[barData.length - 1],
		close: barData[barData.length - 1].close - 10,
	});
	leftSeries.update({
		...barData[barData.length - 1],
		time: barData[barData.length - 1].time + 3600,
	});
	return Promise.resolve();
}
