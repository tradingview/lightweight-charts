function generateBar(i, target) {
	const step = (i % 20) / 5000;
	const base = i / 5;
	target.open = base;
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		const item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateBar(i, item);
		res.push(item);
	}
	return res;
}

function generateDataHist() {
	const colors = [
		'#013370',
		'#3a9656',
		undefined, // default color should be used
	];

	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
			color: colors[i % colors.length],
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Ignore the mouse movement check because we are covering the chart.
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 20,
		},
		layout: {
			background: {
				type: LightweightCharts.ColorType.Solid,
				color: '#fff',
			},
		},
		leftPriceScale: {
			visible: true,
			scaleMargins: {
				top: 0.75,
				bottom: 0,
			},
		},
		rightPriceScale: {
			visible: true,
		},
	});

	const mainSeries = chart.addCandlestickSeries({
		drawBorder: true,
		borderColor: 'blue',
		priceScaleId: 'left',
	});

	mainSeries.setData(generateData());

	const secondarySeries = chart.addCandlestickSeries({
		drawBorder: true,
		borderColor: 'blue',
		priceScaleId: 'right',
	});

	secondarySeries.setData(generateData());

	const histSeries = chart.addHistogramSeries({
		lineWidth: 1,
		color: '#ff0000',
		priceLineWidth: 1,
		priceLineStyle: 3,
		priceScaleId: 'left',
	});

	histSeries.setData(generateDataHist());

	// create canvas to draw screenshot
	chart.resize(600, 240, true);

	const screenshot = chart.takeScreenshot();
	screenshot.style.position = 'absolute';
	screenshot.style.top = '260px';

	const parent = container.parentNode;
	parent.style.backgroundColor = 'yellow';
	parent.appendChild(screenshot);
}
