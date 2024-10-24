function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 1; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

class AxisView {
	constructor(text, color, position) {
		this._color = color;
		this._text = text;
		this._position = position;
	}
	coordinate() {
		return this._position;
	}
	text() {
		return this._text;
	}
	textColor() {
		return '#FFFFFF';
	}
	backColor() {
		return this._color;
	}
}

class TestPlugin {
	constructor() {
		this._priceAxisViews = [new AxisView('price label', '#BB3355', 80)];
		this._timeAxisViews = [new AxisView('time label', '#33AA55', 200)];
	}
	timeAxisViews() {
		return this._timeAxisViews;
	}

	priceAxisViews() {
		return this._priceAxisViews;
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));
	const mainSeries = chart.addLineSeries();
	mainSeries.setData(generateData());
	mainSeries.attachPrimitive(new TestPlugin());
}
