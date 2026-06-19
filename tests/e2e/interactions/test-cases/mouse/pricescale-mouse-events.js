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
	return [
		{ action: 'moveMouseBottomRight', target: 'rightpricescale' },
		{ action: 'moveMouseTopLeft', target: 'rightpricescale' },
		{ action: 'moveMouseCenter', target: 'rightpricescale' },
		{ action: 'click', target: 'rightpricescale' },
	];
}

function finalInteractionsToPerform() {
	return [];
}

let chart;
let moveCount = 0;
let clickCount = 0;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	const mainSeriesData = generateData();
	mainSeries.setData(mainSeriesData);

	mainSeries.priceScale().subscribeClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		clickCount += 1;
	});
	mainSeries.priceScale().subscribeMouseMove(mouseParams => {
		if (!mouseParams) {
			return;
		}
		moveCount += 1;
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
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
	if (clickCount < 1) {
		throw new Error('Expected Click event handler to be evoked.');
	}
	if (moveCount < 1) {
		throw new Error('Expected MouseMove event handler to be evoked.');
	}
	if (moveCount === 1) {
		throw new Error(
			'Expected MouseMove event handler to be evoked more than once.'
		);
	}
	if (clickCount > 1) {
		throw new Error('Expected click event handler to be evoked only once.');
	}

	return Promise.resolve();
}
