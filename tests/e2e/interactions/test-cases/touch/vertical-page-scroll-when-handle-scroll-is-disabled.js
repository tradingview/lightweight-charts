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
	return [{ action: 'swipeTouchVertical', target: 'rightpricescale' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'swipeTouchVertical', target: 'rightpricescale' }];
}

let chart;
let initialScrollPosition = 0;

function beforeInteractions(container) {
	container.style.height = '300px';
	container.style.position = 'relative';
	const windowHeight = window.innerHeight;
	const beforeContent = document.createElement('div');
	beforeContent.style.height = Math.round(windowHeight / 2) + 'px';
	beforeContent.style.width = '100%';
	document.body.insertBefore(beforeContent, container);
	const afterContent = document.createElement('div');
	afterContent.style.height = Math.round(windowHeight / 2) + 'px';
	afterContent.style.width = '100%';
	document.body.appendChild(afterContent);

	window.scrollTo(0, 300);

	chart = LightweightCharts.createChart(container, {
		handleScroll: {
			vertTouchDrag: false,
		},
	});

	const mainSeries = chart.addLineSeries();

	const mainSeriesData = generateData();
	mainSeries.setData(mainSeriesData);

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			initialScrollPosition = window.scrollY;
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
	if (Math.abs(window.scrollY - initialScrollPosition) < 100) {
		throw new Error(
			`Expected page to be scrolled by at least 100 pixels. Starting: ${initialScrollPosition}, End: ${window.scrollY}`
		);
	}

	return Promise.resolve();
}
