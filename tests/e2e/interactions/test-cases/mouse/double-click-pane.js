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
	return [{ action: 'doubleClick', target: 'pane' }];
}

function finalInteractionsToPerform() {
	return [];
}

let chart;
let clickCount = 0;
let dblClickCount = 0;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();

	const mainSeriesData = generateData();
	mainSeries.setData(mainSeriesData);

	chart.subscribeDblClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		dblClickCount += 1;
	});
	chart.subscribeClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		clickCount += 1;
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
		throw new Error('Expected click event handler to be evoked.');
	}
	if (dblClickCount < 1) {
		throw new Error('Expected double click event handler to be evoked.');
	}
	if (clickCount > 1) {
		throw new Error('Expected click event handler to be evoked only once.');
	}
	if (dblClickCount > 1) {
		throw new Error(
			'Expected double click event handler to be evoked only once.'
		);
	}

	return Promise.resolve();
}
