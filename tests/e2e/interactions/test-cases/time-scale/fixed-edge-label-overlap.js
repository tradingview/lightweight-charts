let chart;
let axisCanvas;
let labels = [];
let originalFillText;
let originalFillRect;

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function assertLabelsDoNotOverlap() {
	if (labels.length === 0) {
		throw new Error('Expected at least one time scale label');
	}
	const drawn = labels.slice().sort((a, b) => a.x - b.x);
	for (let i = 1; i < drawn.length; i++) {
		const previous = drawn[i - 1];
		if (previous.x + previous.width / 2 > drawn[i].x - drawn[i].width / 2 + 0.01) {
			throw new Error('Time scale labels overlap after fixed-edge alignment');
		}
	}
}

function beforeInteractions(container) {
	originalFillText = CanvasRenderingContext2D.prototype.fillText;
	originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
	CanvasRenderingContext2D.prototype.fillRect = function(x, y, width, height) {
		if (this.canvas === axisCanvas && x === 0 && y === 0 && width === axisCanvas.width && height === axisCanvas.height) {
			labels = [];
		}
		return originalFillRect.call(this, x, y, width, height);
	};
	CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...args) {
		if (this.canvas === axisCanvas) {
			labels.push({ x, width: this.measureText(text).width });
		}
		return originalFillText.call(this, text, x, y, ...args);
	};
	const formatter = new Intl.DateTimeFormat('ja-JP', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
	const Behavior = LightweightCharts.defaultHorzScaleBehavior();
	class UniformWeights extends Behavior {
		fillWeightsForPoints(points, startIndex) {
			for (let i = startIndex; i < points.length; i++) {
				points[i].timeWeight = 1;
			}
		}
	}
	chart = LightweightCharts.createChartEx(container, new UniformWeights(), {
		width: 360,
		height: 300,
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
			tickMarkMaxCharacterLength: 12,
			tickMarkFormatter: time => formatter.format(new Date(time * 1000)),
		},
	});
	axisCanvas = container.querySelector('tr:last-child td:nth-child(2) canvas');
	chart.addSeries(LightweightCharts.LineSeries).setData(Array.from({ length: 150 }, (_, i) => ({
		time: 1539907200 + i * 86400,
		value: 100 + Math.sin(i),
	})));
	chart.timeScale().fitContent();
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function afterInitialInteractions() {
	assertLabelsDoNotOverlap();
	chart.applyOptions({ width: 180 });
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function afterFinalInteractions() {
	CanvasRenderingContext2D.prototype.fillText = originalFillText;
	CanvasRenderingContext2D.prototype.fillRect = originalFillRect;
	assertLabelsDoNotOverlap();
	chart.remove();
	return Promise.resolve();
}
