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
	return [{
		action: 'clickXY',
		options: {
			// set the cursor aside from the marker
			x: markerX - 30,
			y: markerY + 5,
		},
	}];
}

let chart;
let lastHoveredObjectId = null;
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
				time: markerTime,
				position: 'inBar',
				color: '#2196F3',
				size: 3,
				shape: 'circle',
				text: '',
				id: 'TEST',
			},
		]
	);
	mainSeries.createPriceLine({
		price: price,
		color: '#000',
		lineWidth: 2,
		lineStyle: 2,
		axisLabelVisible: false,
		title: '',
		id: 'LINE',
	});
	chart.subscribeCrosshairMove(params => {
		if (!params) {
			return;
		}
		lastHoveredObjectId = params.hoveredObjectId;
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
	// scroll to the marker
	chart.timeScale().scrollToPosition(chart.timeScale().scrollPosition() + 5, false);
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const pass = lastHoveredObjectId === 'TEST';
			if (!pass) {
				throw new Error("Expected hoveredObjectId to be equal to 'TEST'.");
			}
			resolve();
		});
	});
}
