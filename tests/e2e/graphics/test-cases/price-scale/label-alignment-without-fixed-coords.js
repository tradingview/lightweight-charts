function runTestCase(container) {
	const chartOptions = {
		height: 500,
		width: 600,
		rightPriceScale: {
			scaleMargins: {
				top: 0,
				bottom: 0,
			},
			entireTextOnly: true,
			alignLabels: true,
		},
		layout: { attributionLogo: false },
	};

	const chart = (window.chart = LightweightCharts.createChart(
		container,
		chartOptions
	));

	// Reproduce issue #1986:
	// Plugin axis views that DON'T implement fixedCoordinate() (since it's optional)
	// would cause getFixedCoordinate() to return 0 in the old code, creating false overlaps.

	// Create a plugin axis view WITHOUT fixedCoordinate() - this is the key!
	class PluginAxisView {
		constructor(source, price, text, color) {
			this._source = source;
			this._price = price;
			this._coordinate = null;
			this._text = text;
			this._color = color;
		}

		update() {
			this._coordinate = this._source.series.priceToCoordinate(this._price);
		}

		coordinate() {
			return this._coordinate ?? -1;
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

		// NOTE: fixedCoordinate() is NOT implemented - this is intentional!
		// This causes the bug in the old code where getFixedCoordinate() returns 0
	}

	class PluginBase {
		constructor() {
			this._chart = undefined;
			this._series = undefined;
			this._requestUpdate = undefined;
		}

		attached({ chart: chart2, series, requestUpdate }) {
			this._chart = chart2;
			this._series = series;
			this._series.subscribeDataChanged(this._fireDataUpdated.bind(this));
			this._requestUpdate = requestUpdate;
			this.requestUpdate();
		}

		detached() {
			this._chart = undefined;
			this._series = undefined;
			this._requestUpdate = undefined;
		}

		get chart() {
			return this._chart;
		}

		get series() {
			return this._series;
		}

		requestUpdate() {
			if (this._requestUpdate) {
				this._requestUpdate();
			}
		}

		_fireDataUpdated(scope) {
			if (this.dataUpdated) {
				this.dataUpdated(scope);
			}
		}
	}

	class TestPlugin extends PluginBase {
		constructor() {
			super();
			// Create plugin views at coordinates that will overlap with series labels
			// OLD BUG: These views without fixedCoordinate() would return 0,
			// causing false overlaps and incorrect repositioning
			this._priceAxisViews = [
				new PluginAxisView(this, 96, 'Plugin label', '#333'),
			];
		}

		updateAllViews() {
			this._priceAxisViews.forEach(view => view.update());
		}

		priceAxisViews() {
			return this._priceAxisViews;
		}
	}

	const series1 = chart.addSeries(LightweightCharts.LineSeries, { color: 'blue' });
	series1.setData([
		{ time: 10000, value: 100 },
		{ time: 20000, value: 95 },
		{ time: 30000, value: 90 },
	]);

	series1.attachPrimitive(new TestPlugin());

	series1.createPriceLine({
		price: 98,
		color: 'blue',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Dotted,
	});

	chart.timeScale().fitContent();
}
