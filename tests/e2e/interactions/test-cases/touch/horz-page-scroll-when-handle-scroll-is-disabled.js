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
	return [{ action: 'swipeTouchHorizontal', target: 'timescale' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'swipeTouchHorizontal', target: 'timescale' }];
}

let chart;
let initialScrollPosition = 0;

function beforeInteractions(container) {
	const halfWindowWidth = Math.round(window.innerWidth / 2);
	container.style.height = '300px';
	container.style.width = `${halfWindowWidth}px`;
	container.style.position = 'relative';
	const beforeContent = document.createElement('div');
	beforeContent.style.height = '300px';
	beforeContent.style.width = `${halfWindowWidth}px`;
	document.body.insertBefore(beforeContent, container);
	const afterContent = document.createElement('div');
	afterContent.style.height = '300px';
	afterContent.style.width = `${halfWindowWidth}px`;
	document.body.appendChild(afterContent);
	document.body.style.whiteSpace = 'nowrap';
	document.body.style.overflowX = 'auto';
	document.body.style.display = 'flex';
	document.body.style.flexDirection = 'row';
	document.body.style.width = halfWindowWidth * 3 + 'px';

	window.scrollTo(halfWindowWidth / 2, 0);

	chart = LightweightCharts.createChart(container, {
		handleScroll: {
			horzTouchDrag: false,
		},
	});

	const mainSeries = chart.addLineSeries();

	const mainSeriesData = generateData();
	mainSeries.setData(mainSeriesData);

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			initialScrollPosition = window.scrollX;
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
	if (Math.abs(window.scrollX - initialScrollPosition) < 100) {
		throw new Error(
			`Expected page to be scrolled by at least 100 pixels. Starting: ${initialScrollPosition}, End: ${window.scrollX}`
		);
	}

	return Promise.resolve();
}
