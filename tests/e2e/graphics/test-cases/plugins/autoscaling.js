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

class BandsIndicatorPaneRenderer {
	constructor(data) {
		this._viewData = data;
	}
	draw() {}
	drawBackground(target) {
		const points = this._viewData.data;
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.save();
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			ctx.strokeStyle = this._viewData.options.lineColor;
			ctx.lineWidth = this._viewData.options.lineWidth;
			ctx.beginPath();
			const region = new Path2D();
			const lines = new Path2D();
			region.moveTo(points[0].x, points[0].upper);
			lines.moveTo(points[0].x, points[0].upper);
			for (const point of points) {
				region.lineTo(point.x, point.upper);
				lines.lineTo(point.x, point.upper);
			}
			const end = points.length - 1;
			region.lineTo(points[end].x, points[end].lower);
			lines.moveTo(points[end].x, points[end].lower);
			for (let i = points.length - 2; i >= 0; i--) {
				region.lineTo(points[i].x, points[i].lower);
				lines.lineTo(points[i].x, points[i].lower);
			}
			region.lineTo(points[0].x, points[0].upper);
			region.closePath();
			ctx.stroke(lines);
			ctx.fillStyle = this._viewData.options.fillColor;
			ctx.fill(region);

			ctx.restore();
		});
	}
}

class BandsIndicatorPaneView {
	constructor(source) {
		this._source = source;
		this._data = {
			data: [],
			options: this._source._options,
		};
	}

	update() {
		const series = this._source.series;
		const timeScale = this._source.chart.timeScale();
		this._data.data = this._source._bandsData.map(d => ({
			x: timeScale.timeToCoordinate(d.time) ?? -100,
			upper: series.priceToCoordinate(d.upper) ?? -100,
			lower: series.priceToCoordinate(d.lower) ?? -100,
		}));
	}

	renderer() {
		return new BandsIndicatorPaneRenderer(this._data);
	}
}

function extractPrice(dataPoint) {
	if (dataPoint.close) {return dataPoint.close;}
	if (dataPoint.value) {return dataPoint.value;}
	return undefined;
}

class PluginBase {
	requestUpdate() {
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}
	constructor() {
		this._chart = undefined;
		this._series = undefined;
	}

	attached({ chart, series, requestUpdate }) {
		this._chart = chart;
		this._series = series;
		this._series.subscribeDataChanged(this._fireDataUpdated);
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

	_fireDataUpdated(scope) {
		if (this.dataUpdated) {
			this.dataUpdated(scope);
		}
	}
}

const defaults = {
	lineColor: 'rgb(25, 200, 100)',
	fillColor: 'rgba(25, 200, 100, 0.25)',
	lineWidth: 1,
};

class BandsIndicator extends PluginBase {
	constructor(options = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new BandsIndicatorPaneView(this)];
		this._minValue = Number.POSITIVE_INFINITY;
		this._maxValue = Number.NEGATIVE_INFINITY;
		this._seriesData = [];
		this._bandsData = [];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	attached(p) {
		super.attached(p);
		this.dataUpdated('full');
	}

	dataUpdated() {
		this._seriesData = JSON.parse(JSON.stringify(this.series.data()));
		this.calculateBands();
	}

	calculateBands() {
		const bandData = new Array(this._seriesData.length);
		let index = 0;
		this._minValue = Number.POSITIVE_INFINITY;
		this._maxValue = Number.NEGATIVE_INFINITY;
		this._seriesData.forEach(d => {
			const price = extractPrice(d);
			if (price === undefined) {
				return;
			}
			const upper = price * 2;
			const lower = price * 0.5;
			if (upper > this._maxValue) {
				this._maxValue = upper;
			}
			if (lower < this._minValue) {
				this._minValue = lower;
			}
			bandData[index] = {
				upper,
				lower,
				time: d.time,
			};
			index += 1;
		});
		bandData.length = index;
		this._bandsData = bandData;
	}

	autoscaleInfo() {
		return {
			priceRange: {
				minValue: this._minValue,
				maxValue: this._maxValue,
			},
		};
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));
	const mainSeries = chart.addLineSeries();
	const data = generateData();
	mainSeries.setData(data);
	const bandIndicator = new BandsIndicator();
	mainSeries.attachPrimitive(bandIndicator);
}
