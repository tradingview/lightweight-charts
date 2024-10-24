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

class LegendPaneRenderer {
	constructor(sections) {
		this._sections = Object.values(sections);
	}
	draw(target) {
		const count = this._sections.length;
		const longestText = this._sections.reduce((longest, section) => {
			if (section.name.length > longest.length) {
				return section.name;
			}
			return longest;
		}, '');
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			const longestTextMeasurements = ctx.measureText(longestText);
			ctx.beginPath();
			ctx.roundRect(
				20,
				20,
				longestTextMeasurements.width + 40,
				(count + 0) * 20 + 10,
				8
			);
			ctx.globalAlpha = 0.95;
			ctx.fillStyle = '#FFFFFF';
			ctx.fill();
			ctx.globalAlpha = 1;
			let currentY = 30;
			this._sections.forEach(section => {
				ctx.beginPath();
				ctx.roundRect(30, currentY, 10, 10, 3);
				ctx.fillStyle = section.color;
				ctx.fill();
				ctx.fillStyle = '#000000';
				ctx.textBaseline = 'bottom';
				ctx.fillText(section.name, 50, currentY + 10);
				currentY += 20;
			});
		});
	}
}

class LegendView {
	constructor(sections) {
		this._renderer = new LegendPaneRenderer(sections);
	}
	zOrder() {
		return 'top';
	}
	renderer() {
		return this._renderer;
	}
}

class PaneRenderer {
	constructor(color) {
		this._color = color;
	}
	draw(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.beginPath();
			ctx.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
			ctx.globalAlpha = 0.3;
			ctx.fillStyle = this._color;
			ctx.fill();
			ctx.globalAlpha = 0.6;
			ctx.lineWidth = 8;
			ctx.strokeStyle = this._color;
			ctx.stroke();
			ctx.globalAlpha = 1;
		});
	}
}

class PaneView {
	constructor(color) {
		this._renderer = new PaneRenderer(color);
	}
	zOrder() {
		return 'bottom';
	}
	renderer() {
		return this._renderer;
	}
}

class TestPlugin {
	constructor() {
		this.sections = {
			pane: { color: '#4cc9f0', name: 'Chart Pane (paneViews)' },
			price: {
				color: '#f72585',
				name: 'Price Pane (priceAxisPaneViews)',
			},
			time: { color: '#4361ee', name: 'Time Pane (timeAxisPaneViews)' },
		};
		this._paneViews = [
			new PaneView(this.sections.pane.color),
			new LegendView(this.sections),
		];
		this._pricePaneViews = [new PaneView(this.sections.price.color)];
		this._timePaneViews = [new PaneView(this.sections.time.color)];
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
