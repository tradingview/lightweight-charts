/* eslint-disable max-classes-per-file */
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

class SectionsPrimitive {
	constructor() {
		this.sections = {
			pane: { color: '#4cc9f0', name: 'Chart Pane (paneViews)' },
			price: { color: '#f72585', name: 'Price Pane (priceAxisPaneViews)' },
			time: { color: '#4361ee', name: 'Time Pane (timeAxisPaneViews)' },
			priceLabel: { color: '#f77f00', name: 'Price Label (priceAxisViews)' },
			timeLabel: { color: '#40916c', name: 'Time Label (timeAxisViews)' },
		};
		this._paneViews = [
			new PaneView(this.sections.pane.color),
			new LegendView(this.sections),
		];
		this._pricePaneViews = [new PaneView(this.sections.price.color)];
		this._timePaneViews = [new PaneView(this.sections.time.color)];
		this._priceAxisViews = [
			new AxisView('price label', this.sections.priceLabel.color, 80),
		];
		this._timeAxisViews = [
			new AxisView('time label', this.sections.timeLabel.color, 200),
		];
	}

	updateAllViews() {}

	paneViews() {
		return this._paneViews;
	}

	timeAxisPaneViews() {
		return this._timePaneViews;
	}

	priceAxisPaneViews() {
		return this._pricePaneViews;
	}

	timeAxisViews() {
		return this._timeAxisViews;
	}

	priceAxisViews() {
		return this._priceAxisViews;
	}
}

let randomFactor = 25 + Math.random() * 25;
const samplePoint = i =>
	i *
		(0.5 +
			Math.sin(i / 10) * 0.2 +
			Math.sin(i / 20) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 500) * 0.5) +
	200;

function generateLineData(numberOfPoints = 500) {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = date.getTime() / 1000;
		const value = samplePoint(i);
		res.push({
			time,
			value,
			customValues: {
				text: 'hello',
			},
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
};

const chart = createChart(document.getElementById('container'), chartOptions);
const lineSeries = chart.addLineSeries({
	color: CHART_TEXT_COLOR,
});
const data = generateLineData();
lineSeries.setData(data);
lineSeries.attachPrimitive(new SectionsPrimitive());
