function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = (window.chart = LightweightCharts.createChart(container));

	chart.timeScale().applyOptions({
		barSpacing: 50,
		rightOffset: 5,
	});
	const s1 = chart.addSeries(LightweightCharts.LineSeries, {
		color: 'red',
	});
	s1.setData([
		{ time: '2019-04-11', value: 80.01 },
		{ time: '2019-04-12', value: 96.63 },
		{ time: '2019-04-13', value: 76.64 },
		{ time: '2019-04-14', value: 81.89 },
		{ time: '2019-04-15', value: 74.43 },
		{ time: '2019-04-16', value: 80.01 },
	]);

	const rect = new Rectangle(
		chart,
		s1,
		{ time: '2019-04-11', price: 70.01 },
		{ time: '2019-04-16', price: 90.01 }
	);
	s1.attachPrimitive(rect);

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return Promise.resolve();
}

class RectanglePaneRenderer {
	constructor(p1, p2) {
		this._p1 = p1;
		this._p2 = p2;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			const x1Scaled = Math.round(this._p1.x * scope.horizontalPixelRatio);
			const y1Scaled = Math.round(this._p1.y * scope.verticalPixelRatio);
			const x2Scaled = Math.round(this._p2.x * scope.horizontalPixelRatio);
			const y2Scaled = Math.round(this._p2.y * scope.verticalPixelRatio);
			const width = x2Scaled - x1Scaled + 1;
			const height = y2Scaled - y1Scaled + 1;
			ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
			ctx.fillRect(x1Scaled, y1Scaled, width, height);
		});
	}
}

class RectanglePaneView {
	constructor(source) {
		this._source = source;
	}
	update() {
		const series = this._source._series;
		const y1 = series.priceToCoordinate(this._source._p1.price);
		const y2 = series.priceToCoordinate(this._source._p2.price);
		const timeScale = this._source._chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source._p1.time);
		const x2 = timeScale.timeToCoordinate(this._source._p2.time);
		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}
	renderer() {
		return new RectanglePaneRenderer(this._p1, this._p2, this._source._color);
	}
}

class RectangleTimeAxisView {
	constructor(source, p) {
		this._source = source;
		this._p = p;
	}
	update() {
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._p.time);
	}
	coordinate() {
		return this._x;
	}
	text() {
		return this._p.time;
	}
	textColor() {
		return 'white';
	}
	backColor() {
		return 'blue';
	}
}

class RectanglePriceAxisView {
	constructor(source, p) {
		this._source = source;
		this._p = p;
	}
	update() {
		const series = this._source._series;
		this._y = series.priceToCoordinate(this._p.price);
	}
	coordinate() {
		return this._y;
	}
	text() {
		return '' + this._p.price;
	}
	textColor() {
		return 'white';
	}
	backColor() {
		return 'blue';
	}
}

class Rectangle {
	constructor(chart, series, p1, p2, color) {
		this._chart = chart;
		this._series = series;
		this._p1 = p1;
		this._p2 = p2;
		this._color = color;
		this._paneViews = [new RectanglePaneView(this)];
		this._timeAxisViews = [
			new RectangleTimeAxisView(this, p1),
			new RectangleTimeAxisView(this, p2),
		];
		this._priceAxisViews = [
			new RectanglePriceAxisView(this, p1),
			new RectanglePriceAxisView(this, p2),
		];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(pw => pw.update());
		this._priceAxisViews.forEach(pw => pw.update());
	}
	priceAxisViews() {
		return this._priceAxisViews;
	}
	timeAxisViews() {
		return this._timeAxisViews;
	}
	paneViews() {
		return this._paneViews;
	}
}
