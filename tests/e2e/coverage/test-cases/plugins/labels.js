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

function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries);

	mainSeries.setData(generateLineData());
	mainSeries.attachPrimitive(new TestPlugin());

	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
