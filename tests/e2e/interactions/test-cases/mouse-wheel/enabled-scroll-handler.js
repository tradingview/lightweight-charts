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
	return [{ action: 'scrollLeft' }, { action: 'scrollDown' }];
}

function finalInteractionsToPerform() {
	return [];
}

let chart;
let startRange;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		handleScroll: {
			mouseWheel: true,
		},
		handleScale: {
			mouseWheel: true,
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			startRange = chart.timeScale().getVisibleLogicalRange();
			resolve();
		});
	});
}

function afterFinalInteractions() {
	const endRange = chart.timeScale().getVisibleLogicalRange();

	const pass = Boolean(startRange.from !== endRange.from && startRange.to !== endRange.to);

	if (!pass) {
		throw new Error('Expected visible logical range to have changed.');
	}

	return Promise.resolve();
}
