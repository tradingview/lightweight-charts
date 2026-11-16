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

class PaneRenderer {
	constructor(color, band) {
		this._color = color;
		this._band = band;
	}
	draw(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			const height = scope.mediaSize.height;
			const bandHeight = Math.round(height / 3);
			ctx.fillStyle = this._color;
			ctx.fillRect(0, this._band * bandHeight, scope.mediaSize.width, bandHeight);
		});
	}
}

class PaneView {
	constructor(color, band, zOrder) {
		this._renderer = new PaneRenderer(color, band);
		this._zOrder = zOrder;
	}
	zOrder() {
		return this._zOrder;
	}
	renderer() {
		return this._renderer;
	}
}

class TestPlugin {
	constructor() {
		this._paneViews = [
			new PaneView('rgba(247, 37, 133, 0.85)', 0, 'bottom'),
			new PaneView('rgba(67, 97, 238, 0.85)', 1, 'normal'),
			new PaneView('rgba(76, 201, 240, 0.85)', 2, 'top'),
		];
	}
	paneViews() {
		return this._paneViews;
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));
	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	mainSeries.setData(generateData());
	chart.panes()[0].attachPrimitive(new TestPlugin());
}
