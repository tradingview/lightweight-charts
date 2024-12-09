class TestPaneRenderer {
	constructor(size, drawBackground, colours) {
		this._size = size;
		this._drawBackground = drawBackground;
		this._colours = colours;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.fillStyle = this._colours[0];
			ctx.fillRect(0, 0, this._size, this._size);
		});
	}
	drawBackground(target) {
		if (!this._drawBackground) {
			return;
		}
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.fillStyle = this._colours[1];
			ctx.fillRect(0, 0, this._size + 25, this._size + 25);
		});
	}
}

class TestsPaneView {
	constructor(zorder, size, drawBackground, colours) {
		this._zorder = zorder;
		this._renderer = new TestPaneRenderer(size, drawBackground, colours);
	}
	renderer() {
		return this._renderer;
	}
	zOrder() {
		return this._zorder;
	}
}

class TestPlugin {
	constructor() {
		this._paneViews = [
			new TestsPaneView('top', 100, true, ['red', 'blue']),
			new TestsPaneView('normal', 200, true, ['green', 'yellow']),
			new TestsPaneView('bottom', 300, true, ['orange', 'black']),
		];
		this._pricePaneViews = [
			new TestsPaneView('top', 50, true, ['red', 'blue']),
			new TestsPaneView('normal', 100, true, ['green', 'yellow']),
			new TestsPaneView('bottom', 150, true, ['orange', 'black']),
		];
		this._timePaneViews = [
			new TestsPaneView('top', 50, true, ['red', 'blue']),
			new TestsPaneView('normal', 100, true, ['green', 'yellow']),
			new TestsPaneView('bottom', 150, true, ['orange', 'black']),
		];
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
