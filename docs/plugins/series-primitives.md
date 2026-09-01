# Series Primitives

Primitives are extensions to the series which can define views and renderers to
draw on the chart using
[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).

Primitives are defined by implementing the
[`ISeriesPrimitive`](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/ISeriesPrimitive) interface. The
interface defines the basic functionality and structure required for creating
custom primitives.

## Views

The primary purpose of a series primitive is to provide one, or more, views to
the library which contain the state and logic required to draw on the chart
panes.

There are two types of views which are supported within `ISeriesPrimitive` which
are:

- [`IPrimitivePaneView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneView)
- [`ISeriesPrimitiveAxisView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveAxisView)

The library will evoke the following getter functions (if defined) to get
references to the primitive's defined views for the corresponding section of the
chart:

- [`paneViews`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#paneviews)
- [`priceAxisPaneViews`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#priceaxispaneviews)
- [`timeAxisPaneViews`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#timeaxispaneviews)
- [`priceAxisViews`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#priceaxisviews)
- [`timeAxisViews`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#timeaxisviews)

The first three views allow drawing on the corresponding panes (main chart pane,
price scale pane, and horizontal time scale pane) using the
[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
and should implement the `ISeriesPrimitivePaneView` interface.

The views returned by the `priceAxisViews` and `timeAxisViews` getter methods
should implement the `ISeriesPrimitiveAxisView` interface and are used to define
labels to be drawn on the corresponding scales.

Below is a visual example showing the various sections of the chart where a
Primitive can draw.

_Source of the interactive example shown on this page:_

```js
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
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};

const chart = createChart(document.getElementById('container'), chartOptions);

const lineSeries = chart.addSeries(LineSeries, {
	color: 'black',
});
const data = generateLineData();
lineSeries.setData(data);
lineSeries.attachPrimitive(new SectionsPrimitive());
```

### IPrimitivePaneView

The [`IPrimitivePaneView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneView)
interface can be used to define a view which provides a renderer (implementing
the
[`IPrimitivePaneRenderer`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneRenderer)
interface) for drawing on the corresponding area of the chart using the
[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
API. The view can define a
[`zOrder`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneView#zorder) to control where
in the visual stack the drawing will occur (See
[`PrimitivePaneViewZOrder`](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PrimitivePaneViewZOrder)
for more information).

Renderers should provide a
[`draw`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneRenderer#draw) method which will
be given a `CanvasRenderingTarget2D` target on which it can draw. Additionally,
a renderer can optionally provide a
[`drawBackground`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneRenderer#drawbackground)
method for drawing beneath other elements on the same zOrder.

:::tip

`CanvasRenderingTarget2D` is explained in more detail on the [Canvas Rendering Target](https://tradingview.github.io/lightweight-charts/docs/plugins/canvas-rendering-target.md) page.

:::

#### Interactive Demo of zOrder layers

Below is an interactive demo chart illustrating where each zOrder is drawn
relative to the existing chart elements such as the grid, series, and crosshair.

_Source of the interactive example shown on this page:_

```js
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
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};

const chart = createChart(document.getElementById('container'), chartOptions);

const lineSeries = chart.addSeries(LineSeries, {
	color: 'black',
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
```

### ISeriesPrimitiveAxisView

The [`ISeriesPrimitiveAxisView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveAxisView)
interface can be used to define a label on the price or time axis.

This interface provides several methods to define the appearance and position of
the label, such as the
[`coordinate`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveAxisView#coordinate) method,
which should return the desired coordinate for the label on the axis. It also
defines optional methods to set the fixed coordinate, text, text color,
background color, and visibility of the label.

Please see the
[`ISeriesPrimitiveAxisView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveAxisView)
interface for more details.

## Lifecycle Methods

Your primitive can use the
[`attached`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#attached) and
[`detached`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#detached) lifecycle methods to
manage the lifecycle of the primitive, such as creating or removing external
objects and event handlers.

### attached

This method is called when the primitive is attached to a chart. The attached
method is evoked with a
[single argument](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesAttachedParameter) containing
properties for the chart, series, and a callback to request an update. The
`chart` and `series` properties are references to the chart API and the series
API instances for convenience purposes so that they don't need to be manually
provided within the primitive's constructor (if needed by the primitive).

The `requestUpdate` callback allows the primitive to notify the chart that it
should be updated and redrawn.

### detached

This method is called when the primitive is detached from a chart. This can be
used to remove any external objects or event handlers that were created during
the attached lifecycle method.

## Updating Views

Your primitive should update the views in the
[`updateAllViews()`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#updateallviews) method
such that when the renderers are evoked, they can draw with the latest
information. The library invokes this method when it wants to update and redraw
the chart. If you would like to notify the library that it should trigger an
update then you can use the `requestUpdate` callback provided by the attached
lifecycle method.

## Extending the Autoscale Info

The [`autoscaleInfo()`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase#autoscaleinfo)
method can be provided to extend the base autoScale information of the series.
This can be used to ensure that the chart is automatically scaled correctly to
include all the graphics drawn by the primitive.

Whenever the chart needs to calculate the vertical visible range of the series
within the current time range then it will evoke this method. This method can be
omitted and the library will use the normal autoscale information for the
series. If the method is implemented then the returned values will be merged
with the base autoscale information to define the vertical visible range.

:::warning

Please note that this method will be evoked very often during
scrolling and zooming of the chart, thus it is recommended that this method is
either simple to execute, or makes use of optimisations such as caching to
ensure that the chart remains responsive.

:::

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
