function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

class AnchoredTextRenderer {
	constructor(options) {
		this._data = options;
	}

	draw(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.font = this._data.font;
			const textWidth = ctx.measureText(this._data.text).width;
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
					x = width / 2 - textWidth / 2;
					break;
				}
			}
			const vertMargin = 10;
			const lineHeight = this._data.lineHeight;
			let y = vertMargin + lineHeight;
			switch (this._data.vertAlign) {
				case 'middle': {
					y = height / 2 + lineHeight / 2;
					break;
				}
				case 'bottom': {
					y = height - vertMargin;
					break;
				}
			}
			ctx.fillStyle = this._data.color;
			ctx.fillText(this._data.text, x, y);
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
	constructor(options) {
		this._data = options;
		this._paneViews = [new AnchoredTextPaneView(this)];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	requestUpdate() {}
	attached({ requestUpdate }) {
		this.requestUpdate = requestUpdate;
	}

	detached() {
		this.requestUpdate = undefined;
	}

	applyOptions(options) {
		this._data = { ...this._data, ...options };
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: false,
		},
	}));

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries,
		{
			priceFormat: {
				minMove: 1,
				precision: 0,
			},
		},
		0
	);
	mainSeries.setData(generateData());

	const secondSeries = chart.addSeries(LightweightCharts.LineSeries,
		{
			priceFormat: {
				minMove: 1,
				precision: 0,
			},
		},
		1
	);
	secondSeries.setData(generateData());

	const anchoredText = new AnchoredText({
		vertAlign: 'middle',
		horzAlign: 'middle',
		text: 'Pane 1',
		lineHeight: 54,
		font: 'italic 54px Arial',
		color: 'red',
	});
	chart.panes()[0].attachPrimitive(anchoredText);

	const anchoredText2 = new AnchoredText({
		vertAlign: 'middle',
		horzAlign: 'middle',
		text: 'Pane 2',
		lineHeight: 26,
		font: 'bold 26px Arial',
		color: 'blue',
	});
	chart.panes()[1].attachPrimitive(anchoredText2);
}
