function generateBar(i, target) {
	var step = (i % 20) / 5000;
	var base = i / 5;
	target.open = base;
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		var item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateBar(i, item);
		res.push(item);
	}
	return res;
}

function generateDataHist() {
	var colors = [
		'#013370',
		'#3a9656',
		undefined, // default color should be used
	];

	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
			color: colors[i % colors.length],
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 20,
		},
		leftPriceScale: {
			visible: true,
		},
	});

	var mainSeries = chart.addCandlestickSeries({
		drawBorder: true,
		borderColor: 'blue',
	});

	mainSeries.setData(generateData());

	var histSeries = chart.addHistogramSeries({
		lineWidth: 1,
		color: '#ff0000',
		priceLineWidth: 1,
		priceLineStyle: 3,
		priceScaleId: 'left',
		scaleMargins: {
			top: 0.75,
			bottom: 0,
		},
	});

	histSeries.setData(generateDataHist());

	// create canvas to draw screenshot
	chart.resize(600, 240, true);

	var screenshot = chart.takeScreenshot();
	screenshot.style.position = 'absolute';
	screenshot.style.top = '260px';

	var parent = container.parentNode;
	parent.appendChild(screenshot);
}
