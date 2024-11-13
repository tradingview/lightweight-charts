function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'container' },
		{ action: 'moveMouseCenter', target: 'pane' },
		{ action: 'tap', target: 'pane' },
		{ action: 'click', target: 'pane' },
	];
}

const testLayer = 'normal';
const drawBackground = false; // whether the renderer is using drawBackground or draw

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
			externalId: 'HitTestID',
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

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries);

	mainSeries.setData(generateLineData());

	mainSeries.attachPrimitive(new HitTest());
	chart.subscribeClick(p => {
		console.log(p);
	});
	chart.subscribeCrosshairMove(p => {
		console.log(p);
	});
	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
