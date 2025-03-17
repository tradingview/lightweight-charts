function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function initialInteractionsToPerform() {
	return [];
}

let markerX = 0;
let markerY = 0;
function finalInteractionsToPerform() {
	// we want to test to the left of the marker so we can test clicking on the text only
	const x = markerX - 15;
	// we want to try click a few places in a vertical line
	const interactions = [];
	for (let y = markerY - 50; y < markerY + 50; y += 5) {
		interactions.push({
			action: 'clickXY',
			options: {
				x,
				y,
			},
		});
	}
	return interactions;
}

let chart;
let pass = false;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	const mainSeriesData = generateData();
	const markerTime = mainSeriesData[450].time;
	const price = mainSeriesData[450].value;

	mainSeries.setData(mainSeriesData);
	LightweightCharts.createSeriesMarkers(
		mainSeries,
		[
			{
				price: price,
				time: markerTime,
				position: 'atPriceMiddle',
				color: '#2196F3',
				shape: 'arrowUp',
				text: 'This is a Marker',
				id: 'TEST',
			},
		]
	);

	chart.subscribeClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		if (mouseParams.hoveredObjectId === 'TEST') {
			pass = true;
		}
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			// get coordinates for marker bar
			markerX = chart.timeScale().timeToCoordinate(markerTime);
			markerY = mainSeries.priceToCoordinate(price);
			resolve();
		});
	});
}

function afterInitialInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterFinalInteractions() {
	if (!pass) {
		throw new Error("Expected hoveredObjectId to be equal to 'TEST'.");
	}

	return Promise.resolve();
}
