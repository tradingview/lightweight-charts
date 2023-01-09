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
	return [{ action: 'click' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'click' }];
}

let chart;
let createdPriceLine = false;
let pass = false;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	chart.subscribeClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		console.log({ createdPriceLine, p: mouseParams.hoveredObjectId });
		if (createdPriceLine && mouseParams.hoveredObjectId === undefined) {
			pass = true;
			return;
		}
		if (!createdPriceLine) {
			/**
             * HitTestThreshold is 7, and this test will fail if the number below is
             * set to 7 but we will use 10 to ensure that it misses.
             */
			const price = mainSeries.coordinateToPrice(mouseParams.point.y + 10);
			const myPriceLine = {
				price,
				color: '#000',
				lineWidth: 2,
				lineStyle: 2,
				axisLabelVisible: false,
				title: '',
				id: 'TEST',
			};
			mainSeries.createPriceLine(myPriceLine);
			createdPriceLine = true;
		}
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			resolve();
		});
	});
}

function afterInitialInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			setTimeout(resolve, 500); // large enough so the browser doesn't think it is a double click
		});
	});
}

function afterFinalInteractions() {
	if (!createdPriceLine) {
		throw new Error('Expected price line to be created and added to series.');
	}

	if (!pass) {
		throw new Error('Expected hoveredObjectId to be equal to undefined.');
	}

	return Promise.resolve();
}
