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

const testLayer = 'normal';
const drawBackground = true; // whether the renderer is using drawBackground or draw

class HitTestRenderer {
	_draw(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.save();
			const width = scope.mediaSize.width;
			const height = scope.mediaSize.height;
			const boxWidth = Math.round(width / 2);
			const boxHeight = Math.round(height / 2);
			const x = Math.round((width - boxWidth) / 2);
			const y = Math.round((height - boxHeight) / 2);

			ctx.beginPath();
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect(x, y, boxWidth, boxHeight);
			this._hitBox = {
				x,
				y,
				height: boxHeight,
				width: boxWidth,
			};
			ctx.restore();
		});
	}

	draw(target) {
		if (!drawBackground) {this._draw(target);}
	}

	drawBackground(target) {
		if (drawBackground) {this._draw(target);}
	}

	hitTest(x, y) {
		if (
			!this._hitBox ||
						x < this._hitBox.x ||
						y < this._hitBox.y ||
						x > this._hitBox.x + this._hitBox.width ||
						y > this._hitBox.y + this._hitBox.height
		) {return null;}
		return {
			cursorStyle: 'pointer',
			externalId: 'PLUGIN',
		};
	}
}

class HitTestPaneView {
	constructor() {
		this._renderer = new HitTestRenderer();
	}

	update() {}

	renderer() {
		return this._renderer;
	}

	hitTest(x, y) {
		const result = this._renderer.hitTest(x, y);
		if (result) {
			return {
				...result,
				zOrder: this.zOrder(),
				isBackground: drawBackground,
			};
		}
		return null;
	}

	zOrder() {
		return testLayer;
	}
}

class HitTest {
	constructor() {
		this._paneViews = [new HitTestPaneView()];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	hitTest(x, y) {
		return this._paneViews[0].hitTest(x, y);
	}
}

function initialInteractionsToPerform() {
	return [{ action: 'click' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'click' }];
}

let chart;
let pass = false;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	mainSeries.setData(generateData());
	const firstPane = chart.panes()[0];
	firstPane.attachPrimitive(new HitTest());

	chart.subscribeClick(mouseParams => {
		if (!mouseParams) {
			return;
		}
		if (mouseParams.hoveredObjectId === 'PLUGIN') {
			pass = true;
			return;
		}
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			resolve();
		});
	});
}

function afterInitialInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			setTimeout(resolve, 500); // large enough so the browser doesn't think it is a double click
		});
	});
}

function afterFinalInteractions() {
	if (!pass) {
		throw new Error("Expected hoveredObjectId to be equal to 'PLUGIN'.");
	}

	return Promise.resolve();
}
