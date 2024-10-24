/* eslint-disable max-classes-per-file */
class VolumeProfileRenderer {
	constructor(data) {
		this._data = data;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			const scaledX = Math.round(this._data.x * scope.horizontalPixelRatio);
			const scaledTop = Math.round(this._data.top * scope.verticalPixelRatio);
			const scaledWidth = Math.round(this._data.width * scope.horizontalPixelRatio);
			const scaledHeight = Math.round(this._data.columnHeight * this._data.items.length * scope.verticalPixelRatio);

			const scaledRowHeight = Math.round(this._data.columnHeight * scope.verticalPixelRatio);

			ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
			ctx.fillRect(scaledX, scaledTop, scaledWidth, -scaledHeight);

			ctx.fillStyle = 'rgba(80, 80, 255, 0.8)';
			this._data.items.forEach(row => {
				ctx.fillRect(scaledX, Math.round(row.y * scope.verticalPixelRatio), Math.round(row.width * scope.horizontalPixelRatio), 1 - scaledRowHeight);
			});
		});
	}
}

class VolumeProfilePaneView {
	constructor(source) {
		this._source = source;
	}
	update() {
		const data = this._source._vpData;
		const series = this._source._series;
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(data.time);
		this._width = timeScale.options().barSpacing;

		const y1 = series.priceToCoordinate(data.profile[0].price);
		const y2 = series.priceToCoordinate(data.profile[1].price);
		this._columnHeight = Math.max(1, y1 - y2);
		const maxVolume = data.profile.reduce((acc, item) => Math.max(acc, item.vol), 0);

		this._top = y1;

		this._items = data.profile.map(row => ({
			y: series.priceToCoordinate(row.price),
			width: this._width * row.vol / maxVolume,
		}));
	}

	renderer() {
		return new VolumeProfileRenderer({
			x: this._x,
			top: this._top,
			columnHeight: this._columnHeight,
			width: this._width,
			items: this._items,
		});
	}
}

class VolumeProfile {
	// points - {date, price}
	constructor(chart, series, vpData) {
		this._chart = chart;
		this._series = series;
		this._vpData = vpData;
		this._paneViews = [new VolumeProfilePaneView(this)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}
	priceAxisViews() {
		return [];
	}
	timeAxisViews() {
		return [];
	}
	paneViews() {
		return this._paneViews;
	}
}

class VertLinePaneRenderer {
	constructor(x) {
		this._x = x;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			const xScaled = Math.round(this._x * scope.horizontalPixelRatio) + 0.5;
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(xScaled, 0);
			ctx.lineTo(xScaled, scope.bitmapSize.height);
			ctx.stroke();
		});
	}
}

class VertLinePaneView {
	constructor(source) {
		this._source = source;
	}
	update() {
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._source._time);
	}
	renderer() {
		return new VertLinePaneRenderer(this._x);
	}
}

class VertLineTimeAxisView {
	constructor(source) {
		this._source = source;
	}
	update() {
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(this._source._time);
	}
	coordinate() {
		return this._x;
	}
	text() {
		return this._source._time;
	}
	textColor() {
		return 'white';
	}
	backColor() {
		return 'green';
	}
}

class VertLine {
	// points - {date, price}
	constructor(chart, series, time) {
		this._chart = chart;
		this._series = series;
		this._time = time;
		this._paneViews = [new VertLinePaneView(this)];
		this._timeAxisViews = [new VertLineTimeAxisView(this)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(tw => tw.update());
	}
	priceAxisViews() {
		return [];
	}
	timeAxisViews() {
		return this._timeAxisViews;
	}
	paneViews() {
		return this._paneViews;
	}
}

class TrendLinePaneRenderer {
	constructor(p1, p2, text) {
		this._p1 = p1;
		this._p2 = p2;
		this._text = text;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			const x1Scaled = Math.round(this._p1.x * scope.horizontalPixelRatio);
			const y1Scaled = Math.round(this._p1.y * scope.verticalPixelRatio);
			const x2Scaled = Math.round(this._p2.x * scope.horizontalPixelRatio);
			const y2Scaled = Math.round(this._p2.y * scope.verticalPixelRatio);
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'blue';
			ctx.beginPath();
			ctx.moveTo(x1Scaled, y1Scaled);
			ctx.lineTo(x2Scaled, y2Scaled);
			ctx.stroke();
			ctx.font = '24px Arial';
			ctx.fillStyle = 'green';
			ctx.fillText(this._text, x2Scaled, y2Scaled);
		});
	}
}
class TrendLinePaneView {
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
		return new TrendLinePaneRenderer(this._p1, this._p2, '' + this._source._p2.price);
	}
}
class TrendLine {
	// points - {date, price}
	constructor(chart, series, p1, p2) {
		this._chart = chart;
		this._series = series;
		this._p1 = p1;
		this._p2 = p2;
		this._paneViews = [new TrendLinePaneView(this)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}
	priceAxisViews() {
		return [];
	}
	timeAxisViews() {
		return [];
	}
	paneViews() {
		return this._paneViews;
	}
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
	renderer(height, width) {
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
	// points - {date, price}
	constructor(chart, series, p1, p2, color) {
		this._chart = chart;
		this._series = series;
		this._p1 = p1;
		this._p2 = p2;
		this._color = color;
		this._paneViews = [new RectanglePaneView(this)];
		this._timeAxisViews = [new RectangleTimeAxisView(this, p1), new RectangleTimeAxisView(this, p2)];
		this._priceAxisViews = [new RectanglePriceAxisView(this, p1), new RectanglePriceAxisView(this, p2)];
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

class AnchoredTextRenderer {
	constructor(data) {
		this._data = data;
	}
	draw(target) {
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.save();
			ctx.font = this._data.font;
			const textWidth = ctx.measureText(this._data.text).width;
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
			const horzMargin = 20;
			let x = horzMargin;
			const width = scope.mediaSize.width;
			const height = scope.mediaSize.height;
			switch (this._data.horzAlign) {
				case 'right': {
					x = width - horzMargin - textWidth;
					break;
				}
				case 'middle': {
					x = (width - textWidth / 2);
					break;
				}
			}
			const vertMargin = 10;
			let y = vertMargin + this._data.lineHeight;
			switch (this._data.vertAlign) {
				case 'middle': {
					y = (height - this._data.lineHeight) / 2;
					break;
				}
				case 'bottom': {
					y = height - vertMargin;
					break;
				}
			}
			ctx.fillStyle = this._data.color;
			ctx.fillText(this._data.text, x, y);
			ctx.restore();
		});
	}
}

class AnchoredTextPaneView {
	constructor(source) {
		this._source = source;
	}
	update() {}
	renderer() {
		return new AnchoredTextRenderer(this._source._data);
	}
}

class AnchoredText {
	constructor(chart, series, data) {
		this._chart = chart;
		this._series = series;
		this._data = data;
		this._paneViews = [new AnchoredTextPaneView(this)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}
	priceAxisViews() {
		return [];
	}
	timeAxisViews() {
		return [];
	}
	paneViews() {
		return this._paneViews;
	}
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	chart.timeScale().applyOptions({
		barSpacing: 50,
		rightOffset: 5,
	});
	const s1 = chart.addLineSeries({
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

	const rect = new Rectangle(chart, s1, { time: '2019-04-11', price: 70.01 }, { time: '2019-04-16', price: 90.01 });
	s1.attachPrimitive(rect);

	const trend = new TrendLine(chart, s1, { time: '2019-04-11', price: 70.01 }, { time: '2019-04-16', price: 90.01 }, 'trend');
	s1.attachPrimitive(trend);

	const vert = new VertLine(chart, s1, '2019-04-14');
	s1.attachPrimitive(vert);

	const vpData = {
		time: '2019-04-12',
		profile: [
			{
				price: 90,
				vol: 4,
			},
			{
				price: 91,
				vol: 7,
			},
			{
				price: 92,
				vol: 7,
			},
			{
				price: 93,
				vol: 11,
			},
			{
				price: 94,
				vol: 17,
			},
			{
				price: 95,
				vol: 15,
			},
			{
				price: 96,
				vol: 10,
			},
			{
				price: 97,
				vol: 13,
			},
			{
				price: 98,
				vol: 1,
			},
			{
				price: 99,
				vol: 6,
			},
		],
	};
	const vp = new VolumeProfile(chart, s1, vpData);
	s1.attachPrimitive(vp);

	const anchoredText = new AnchoredText(chart, s1, {
		vertAlign: 'top',
		horzAlign: 'right',
		text: 'My Text',
		lineHeight: 54,
		font: 'italic bold 54px Arial',
		color: 'red',
	});
	s1.attachPrimitive(anchoredText);
}
