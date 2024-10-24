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
	constructor(color) {
		this._color = color;
	}
	draw(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.beginPath();
			ctx.rect(
				Math.round(scope.mediaSize.width / 2) - 1,
				0,
				scope.mediaSize.width,
				scope.mediaSize.height
			);
			ctx.fillStyle = this._color;
			ctx.fill();
		});
	}
	drawBackground(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.beginPath();
			ctx.rect(
				0,
				0,
				Math.round(scope.mediaSize.width / 2),
				scope.mediaSize.height
			);
			ctx.fillStyle = this._color;
			ctx.fill();
		});
	}
}

class PaneView {
	constructor(color) {
		this._renderer = new PaneRenderer(color);
	}
	zOrder() {
		return 'top';
	}
	renderer() {
		return this._renderer;
	}
}

class TestPlugin {
	constructor() {
		this._paneViews = [new PaneView('#4361ee')];
		this._pricePaneViews = [new PaneView('#f72585')];
		this._timePaneViews = [new PaneView('#4cc9f0')];
	}
	paneViews() {
		return this._paneViews;
	}

	timeAxisPaneViews() {
		return this._timePaneViews;
	}

	priceAxisPaneViews() {
		return this._pricePaneViews;
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));
	const mainSeries = chart.addLineSeries();
	mainSeries.setData(generateData());
	mainSeries.attachPrimitive(new TestPlugin());
}
