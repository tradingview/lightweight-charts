class PaneRenderer {
	constructor(layer, showName, index, numBands) {
		this._layer = layer;
		this._showName = showName;
		this._index = index;
		this._selected = 'all';
		this._numBands = numBands;
	}
	draw(target) {
		if (this._layer.background) {
			return;
		}
		if (this._selected !== 'all' && this._selected !== this._layer.id) {
			return;
		}
		this._drawImpl(target);
	}
	drawBackground(target) {
		if (!this._layer.background) {
			return;
		}
		if (this._selected !== 'all' && this._selected !== this._layer.id) {
			return;
		}
		this._drawImpl(target);
	}

	_drawingAngle(scope) {
		const isPriceScale = scope.mediaSize.width < 100;
		const isTimeScale = scope.mediaSize.height < 50;
		if (isPriceScale) {
			return 0;
		}
		if (isTimeScale) {
			return Math.PI / 2;
		}
		return Math.PI / 3;
	}

	_drawImpl(target) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.save();
			if (this._selected === 'all') {
				const isScale = scope.mediaSize.height < 50 || scope.mediaSize.width < 100;
				const numBands = this._numBands + (isScale ? 2 : 0);
				const angle = this._drawingAngle(scope);
				const shift = Math.cos(angle) * scope.mediaSize.height;
				const bandWidth = Math.round(
					(scope.mediaSize.width - shift) / numBands
				);
				const offset = isScale ? 2 : 0;
				const startX = (this._index + (isScale ? 1 : 0)) * bandWidth;
				ctx.beginPath();
				ctx.moveTo(startX, scope.mediaSize.height);
				ctx.lineTo(startX + shift, offset);
				ctx.lineTo(startX + shift + bandWidth, offset);
				ctx.lineTo(startX + bandWidth, scope.mediaSize.height);
				ctx.closePath();
				ctx.fillStyle = this._layer.color;
				ctx.fill();
				if (this._showName) {
					ctx.fillStyle = this._layer.textColor;
					ctx.font = 'normal 16px sans-serif';
					ctx.translate(startX, scope.mediaSize.height);
					ctx.rotate(-1.06 * angle);
					ctx.fillText(this._layer.name, 20, 20);
				}
			} else {
				ctx.beginPath();
				ctx.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
				ctx.fillStyle = this._layer.color;
				ctx.fill();
			}
			ctx.restore();
		});
	}
	update(name) {
		this._selected = name;
	}
}

class PaneView {
	constructor(layer, showName, index, numBands) {
		this._layer = layer;
		this._renderer = new PaneRenderer(layer, showName, index, numBands);
	}
	zOrder() {
		return this._layer.zOrder;
	}
	renderer() {
		return this._renderer;
	}
	update(name) {
		this._renderer.update(name);
	}
}

class LayersPrimitive {
	constructor() {
		this.layers = {
			bottom: {
				name: 'bottom',
				color: '#f72585',
				textColor: '#ffffff',
				zOrder: 'bottom',
				background: false,
				id: 'bottom',
			},
			normalBackground: {
				name: 'normal (background)',
				color: '#7209b7',
				textColor: '#ffffff',
				zOrder: 'normal',
				background: true,
				id: 'normalBackground',
			},
			normal: {
				name: 'normal',
				color: '#4361ee',
				textColor: '#ffffff',
				zOrder: 'normal',
				background: false,
				id: 'normal',
			},
			top: {
				name: 'top',
				color: '#4cc9f0',
				textColor: '#000000',
				zOrder: 'top',
				background: false,
				id: 'top',
			},
		};
		const layerKeys = ['bottom', 'normalBackground', 'normal', 'top'];
		const numBands = layerKeys.length;
		this._paneViews = layerKeys.map(
			(key, index) => new PaneView(this.layers[key], true, index, numBands)
		);
		this._pricePaneViews = layerKeys.map(
			(key, index) => new PaneView(this.layers[key], false, index, numBands)
		);
		this._timePaneViews = layerKeys.map(
			(key, index) => new PaneView(this.layers[key], false, index, numBands)
		);
	}

	changeSelectedLayer(id) {
		if (id !== 'all' && !Object.keys(this.layers).includes(id)) {
			return;
		}
		this._paneViews.forEach(view => view.update(id));
		this._pricePaneViews.forEach(view => view.update(id));
		this._timePaneViews.forEach(view => view.update(id));
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}

	attached({ requestUpdate }) {
		this._requestUpdate = requestUpdate;
	}
	detached() {
		this._requestUpdate = undefined;
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
const layersPrimitive = new LayersPrimitive();
lineSeries.attachPrimitive(layersPrimitive);

function generateLayerOption(id, name, selected) {
	const element = document.createElement('option');
	element.value = id;
	element.innerHTML = name;
	element.selected = selected;
	return element;
}

const chartContainer = document.querySelector('#container');
if (chartContainer) {
	const layerSelect = document.createElement('select');
	layerSelect.id = 'layer-select';
	layerSelect.name = 'layer';
	chartContainer.parentElement.appendChild(layerSelect);
	layerSelect.style.position = 'absolute';
	layerSelect.style.zIndex = 10;
	layerSelect.style.left = '10px';
	layerSelect.style.top = '10px';
}

const layerSelectDiv = document.querySelector('#layer-select');
// eslint-disable-next-line no-console
console.log(layerSelectDiv);
if (layerSelectDiv) {
	layerSelectDiv.appendChild(generateLayerOption('all', 'All', true));
	for (const layerInfo of Object.values(layersPrimitive.layers)) {
		layerSelectDiv.appendChild(
			generateLayerOption(layerInfo.id, layerInfo.name, false)
		);
	}
	layerSelectDiv.addEventListener('change', () => {
		layersPrimitive.changeSelectedLayer(layerSelectDiv.value);
	});
}
