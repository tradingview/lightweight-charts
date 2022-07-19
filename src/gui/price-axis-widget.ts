import { CanvasElementBitmapSizeBinding, equalSizes, Size, size } from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';
import { clearRect, clearRectWithGradient } from '../helpers/canvas-helpers';
import { IDestroyable } from '../helpers/idestroyable';
import { makeFont } from '../helpers/make-font';

import { Coordinate } from '../model/coordinate';
import { IDataSource } from '../model/idata-source';
import { InvalidationLevel } from '../model/invalidate-mask';
import { IPriceDataSource } from '../model/iprice-data-source';
import { LayoutOptions } from '../model/layout-options';
import { PriceScalePosition } from '../model/pane';
import { PriceScale } from '../model/price-scale';
import { TextWidthCache } from '../model/text-width-cache';
import { BitmapCoordsRenderingScope, CanvasRenderingTarget, createCanvasRenderingTarget } from '../renderers/canvas-rendering-target';
import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';

import { createBoundCanvas } from './canvas-utils';
import { LabelsImageCache } from './labels-image-cache';
import { MouseEventHandler, MouseEventHandlers, TouchMouseEvent } from './mouse-event-handler';
import { PaneWidget } from './pane-widget';

export type PriceAxisWidgetSide = Exclude<PriceScalePosition, 'overlay'>;

const enum CursorType {
	Default,
	NsResize,
}

const enum Constants {
	DefaultOptimalWidth = 34,
}

type IPriceAxisViewArray = readonly IPriceAxisView[];

const enum Constants {
	LabelOffset = 5,
}

export class PriceAxisWidget implements IDestroyable {
	private readonly _pane: PaneWidget;
	private readonly _options: LayoutOptions;
	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;
	private readonly _isLeft: boolean;

	private _priceScale: PriceScale | null = null;

	private _size: Size | null = null;

	private readonly _cell: HTMLDivElement;
	private readonly _canvasBinding: CanvasElementBitmapSizeBinding;
	private readonly _topCanvasBinding: CanvasElementBitmapSizeBinding;

	private _mouseEventHandler: MouseEventHandler;
	private _mousedown: boolean = false;

	private readonly _widthCache: TextWidthCache = new TextWidthCache(50);
	private _tickMarksCache: LabelsImageCache = new LabelsImageCache(11, '#000');

	private _color: string | null = null;
	private _font: string | null = null;
	private _prevOptimalWidth: number = 0;
	private _isSettingSize: boolean = false;

	public constructor(pane: PaneWidget, options: LayoutOptions, rendererOptionsProvider: PriceAxisRendererOptionsProvider, side: PriceAxisWidgetSide) {
		this._pane = pane;
		this._options = options;
		this._rendererOptionsProvider = rendererOptionsProvider;
		this._isLeft = side === 'left';

		this._cell = document.createElement('div');
		this._cell.style.height = '100%';
		this._cell.style.overflow = 'hidden';
		this._cell.style.width = '25px';
		this._cell.style.left = '0';
		this._cell.style.position = 'relative';

		this._canvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
		this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		const canvas = this._canvasBinding.canvasElement;
		canvas.style.position = 'absolute';
		canvas.style.zIndex = '1';
		canvas.style.left = '0';
		canvas.style.top = '0';

		this._topCanvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
		this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		const topCanvas = this._topCanvasBinding.canvasElement;
		topCanvas.style.position = 'absolute';
		topCanvas.style.zIndex = '2';
		topCanvas.style.left = '0';
		topCanvas.style.top = '0';

		const handler: MouseEventHandlers = {
			mouseDownEvent: this._mouseDownEvent.bind(this),
			touchStartEvent: this._mouseDownEvent.bind(this),
			pressedMouseMoveEvent: this._pressedMouseMoveEvent.bind(this),
			touchMoveEvent: this._pressedMouseMoveEvent.bind(this),
			mouseDownOutsideEvent: this._mouseDownOutsideEvent.bind(this),
			mouseUpEvent: this._mouseUpEvent.bind(this),
			touchEndEvent: this._mouseUpEvent.bind(this),
			mouseDoubleClickEvent: this._mouseDoubleClickEvent.bind(this),
			doubleTapEvent: this._mouseDoubleClickEvent.bind(this),
			mouseEnterEvent: this._mouseEnterEvent.bind(this),
			mouseLeaveEvent: this._mouseLeaveEvent.bind(this),
		};
		this._mouseEventHandler = new MouseEventHandler(
			this._topCanvasBinding.canvasElement,
			handler,
			{
				treatVertTouchDragAsPageScroll: () => false,
				treatHorzTouchDragAsPageScroll: () => true,
			}
		);
	}

	public destroy(): void {
		this._mouseEventHandler.destroy();

		this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		this._topCanvasBinding.dispose();

		this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		this._canvasBinding.dispose();

		if (this._priceScale !== null) {
			this._priceScale.onMarksChanged().unsubscribeAll(this);
		}

		this._priceScale = null;

		this._tickMarksCache.destroy();
	}

	public getElement(): HTMLElement {
		return this._cell;
	}

	public lineColor(): string {
		return ensureNotNull(this._priceScale).options().borderColor;
	}

	public textColor(): string {
		return this._options.textColor;
	}

	public fontSize(): number {
		return this._options.fontSize;
	}

	public baseFont(): string {
		return makeFont(this.fontSize(), this._options.fontFamily);
	}

	public rendererOptions(): Readonly<PriceAxisViewRendererOptions> {
		const options = this._rendererOptionsProvider.options();

		const isColorChanged = this._color !== options.color;
		const isFontChanged = this._font !== options.font;

		if (isColorChanged || isFontChanged) {
			this._recreateTickMarksCache(options);
			this._color = options.color;
		}

		if (isFontChanged) {
			this._widthCache.reset();
			this._font = options.font;
		}

		return options;
	}

	public optimalWidth(): number {
		if (this._priceScale === null) {
			return 0;
		}

		let tickMarkMaxWidth = 0;
		const rendererOptions = this.rendererOptions();

		const ctx = ensureNotNull(this._canvasBinding.canvasElement.getContext('2d'));
		ctx.save();
		// do no use resetTransform to respect Edge
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		const tickMarks = this._priceScale.marks();

		ctx.font = this.baseFont();

		if (tickMarks.length > 0) {
			tickMarkMaxWidth = Math.max(
				this._widthCache.measureText(ctx, tickMarks[0].label),
				this._widthCache.measureText(ctx, tickMarks[tickMarks.length - 1].label)
			);
		}

		const views = this._backLabels();
		for (let j = views.length; j--;) {
			const width = this._widthCache.measureText(ctx, views[j].text());
			if (width > tickMarkMaxWidth) {
				tickMarkMaxWidth = width;
			}
		}

		const firstValue = this._priceScale.firstValue();
		if (firstValue !== null && this._size !== null) {
			const topValue = this._priceScale.coordinateToPrice(1 as Coordinate, firstValue);
			const bottomValue = this._priceScale.coordinateToPrice(this._size.height - 2 as Coordinate, firstValue);

			tickMarkMaxWidth = Math.max(
				tickMarkMaxWidth,
				this._widthCache.measureText(ctx, this._priceScale.formatPrice(Math.floor(Math.min(topValue, bottomValue)) + 0.11111111111111, firstValue)),
				this._widthCache.measureText(ctx, this._priceScale.formatPrice(Math.ceil(Math.max(topValue, bottomValue)) - 0.11111111111111, firstValue))
			);
		}

		ctx.restore();

		const resultTickMarksMaxWidth = tickMarkMaxWidth || Constants.DefaultOptimalWidth;
		let res = Math.ceil(
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingInner +
			rendererOptions.paddingOuter +
			Constants.LabelOffset +
			resultTickMarksMaxWidth
		);

		// make it even, remove this after migration to perfect fancy canvas
		res += res % 2;
		return res;
	}

	public setSize(newSize: Size): void {
		if (this._size === null || !equalSizes(this._size, newSize)) {
			this._size = newSize;

			this._isSettingSize = true;
			this._canvasBinding.resizeCanvasElement(newSize);
			this._topCanvasBinding.resizeCanvasElement(newSize);
			this._isSettingSize = false;

			this._cell.style.width = `${newSize.width}px`;
			// need this for IE11
			this._cell.style.height = `${newSize.height}px`;
			this._cell.style.minWidth = `${newSize.width}px`; // for right calculate position of .pane-legend
		}
	}

	public getWidth(): number {
		return ensureNotNull(this._size).width;
	}

	public setPriceScale(priceScale: PriceScale): void {
		if (this._priceScale === priceScale) {
			return;
		}

		if (this._priceScale !== null) {
			this._priceScale.onMarksChanged().unsubscribeAll(this);
		}

		this._priceScale = priceScale;
		priceScale.onMarksChanged().subscribe(this._onMarksChanged.bind(this), this);
	}

	public priceScale(): PriceScale | null {
		return this._priceScale;
	}

	public reset(): void {
		const pane = this._pane.state();
		const model = this._pane.chart().model();
		model.resetPriceScale(pane, ensureNotNull(this.priceScale()));
	}

	public paint(type: InvalidationLevel): void {
		if (this._size === null) {
			return;
		}

		if (type !== InvalidationLevel.Cursor) {
			this._alignLabels();
			this._canvasBinding.applySuggestedBitmapSize();
			const target = createCanvasRenderingTarget(this._canvasBinding);
			if (target !== null) {
				target.useBitmapCoordinates((scope: BitmapCoordsRenderingScope) => {
					this._drawBackground(scope);
					this._drawBorder(scope);
					this._drawTickMarks(scope);
				});
				this._drawBackLabels(target);
			}
			target?.destroy();
		}

		this._topCanvasBinding.applySuggestedBitmapSize();
		const topTarget = createCanvasRenderingTarget(this._topCanvasBinding);
		if (topTarget !== null) {
			topTarget.context.clearRect(0, 0, topTarget.bitmapSize.width, topTarget.bitmapSize.height);
			this._drawCrosshairLabel(topTarget);
		}
		topTarget?.destroy();
	}

	public getImage(): HTMLCanvasElement {
		return this._canvasBinding.canvasElement;
	}

	public update(): void {
		// this call has side-effect - it regenerates marks on the price scale
		this._priceScale?.marks();
	}

	private _mouseDownEvent(e: TouchMouseEvent): void {
		if (this._priceScale === null || this._priceScale.isEmpty() || !this._pane.chart().options().handleScale.axisPressedMouseMove.price) {
			return;
		}

		const model = this._pane.chart().model();
		const pane = this._pane.state();
		this._mousedown = true;
		model.startScalePrice(pane, this._priceScale, e.localY);
	}

	private _pressedMouseMoveEvent(e: TouchMouseEvent): void {
		if (this._priceScale === null || !this._pane.chart().options().handleScale.axisPressedMouseMove.price) {
			return;
		}

		const model = this._pane.chart().model();
		const pane = this._pane.state();
		const priceScale = this._priceScale;
		model.scalePriceTo(pane, priceScale, e.localY);
	}

	private _mouseDownOutsideEvent(): void {
		if (this._priceScale === null || !this._pane.chart().options().handleScale.axisPressedMouseMove.price) {
			return;
		}

		const model = this._pane.chart().model();
		const pane = this._pane.state();

		const priceScale = this._priceScale;
		if (this._mousedown) {
			this._mousedown = false;
			model.endScalePrice(pane, priceScale);
		}
	}

	private _mouseUpEvent(e: TouchMouseEvent): void {
		if (this._priceScale === null || !this._pane.chart().options().handleScale.axisPressedMouseMove.price) {
			return;
		}
		const model = this._pane.chart().model();
		const pane = this._pane.state();
		this._mousedown = false;
		model.endScalePrice(pane, this._priceScale);
	}

	private _mouseDoubleClickEvent(e: TouchMouseEvent): void {
		if (this._pane.chart().options().handleScale.axisDoubleClickReset) {
			this.reset();
		}
	}

	private _mouseEnterEvent(e: TouchMouseEvent): void {
		if (this._priceScale === null) {
			return;
		}

		const model = this._pane.chart().model();
		if (model.options().handleScale.axisPressedMouseMove.price && !this._priceScale.isPercentage() && !this._priceScale.isIndexedTo100()) {
			this._setCursor(CursorType.NsResize);
		}
	}

	private _mouseLeaveEvent(e: TouchMouseEvent): void {
		this._setCursor(CursorType.Default);
	}

	private _backLabels(): IPriceAxisView[] {
		const res: IPriceAxisView[] = [];

		const priceScale = (this._priceScale === null) ? undefined : this._priceScale;

		const addViewsForSources = (sources: readonly IDataSource[]) => {
			for (let i = 0; i < sources.length; ++i) {
				const source = sources[i];
				const views = source.priceAxisViews(this._pane.state(), priceScale);
				for (let j = 0; j < views.length; j++) {
					res.push(views[j]);
				}
			}
		};

		// calculate max and min coordinates for views on selection
		// crosshair individually
		addViewsForSources(this._pane.state().orderedSources());

		return res;
	}

	private _drawBackground({ context: ctx, bitmapSize }: BitmapCoordsRenderingScope): void {
		const { width, height } = bitmapSize;
		const model = this._pane.state().model();
		const topColor = model.backgroundTopColor();
		const bottomColor = model.backgroundBottomColor();

		if (topColor === bottomColor) {
			clearRect(ctx, 0, 0, width, height, topColor);
		} else {
			clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
		}
	}

	private _drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio }: BitmapCoordsRenderingScope): void {
		if (this._size === null || this._priceScale === null || !this._priceScale.options().borderVisible) {
			return;
		}

		ctx.fillStyle = this.lineColor();

		const borderSize = Math.max(1, Math.floor(this.rendererOptions().borderSize * horizontalPixelRatio));

		let left: number;
		if (this._isLeft) {
			left = bitmapSize.width - borderSize;
		} else {
			left = 0;
		}

		ctx.fillRect(left, 0, borderSize, bitmapSize.height);
	}

	private _drawTickMarks(renderingScope: BitmapCoordsRenderingScope): void {
		if (this._size === null || this._priceScale === null) {
			return;
		}

		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
		const tickMarks = this._priceScale.marks();

		ctx.save();

		ctx.strokeStyle = this.lineColor();

		ctx.font = this.baseFont();
		ctx.fillStyle = this.lineColor();
		const rendererOptions = this.rendererOptions();

		const tickMarkLeftX = this._isLeft ?
			Math.floor((this._size.width - rendererOptions.tickLength) * horizontalPixelRatio) :
			0;

		const textLeftX = this._isLeft ?
			Math.round(tickMarkLeftX - rendererOptions.paddingInner * horizontalPixelRatio) :
			Math.round(tickMarkLeftX + rendererOptions.tickLength * horizontalPixelRatio + rendererOptions.paddingInner * horizontalPixelRatio);

		const textAlign = this._isLeft ? 'right' : 'left';
		const tickHeight = Math.max(1, Math.floor(verticalPixelRatio));
		const tickOffset = Math.floor(verticalPixelRatio * 0.5);

		const options = this._priceScale.options();
		if (options.borderVisible && options.ticksVisible) {
			const tickLength = Math.round(rendererOptions.tickLength * horizontalPixelRatio);

			ctx.beginPath();
			for (const tickMark of tickMarks) {
				ctx.rect(tickMarkLeftX, Math.round(tickMark.coord * verticalPixelRatio) - tickOffset, tickLength, tickHeight);
			}

			ctx.fill();
		}

		ctx.fillStyle = this.textColor();
		for (const tickMark of tickMarks) {
			this._tickMarksCache.paintTo(renderingScope, tickMark.label, textLeftX, Math.round(tickMark.coord * verticalPixelRatio), textAlign);
		}

		ctx.restore();
	}

	private _alignLabels(): void {
		if (this._size === null || this._priceScale === null) {
			return;
		}
		let center = this._size.height / 2;

		const views: IPriceAxisView[] = [];
		const orderedSources = this._priceScale.orderedSources().slice(); // Copy of array
		const pane = this._pane;
		const paneState = pane.state();
		const rendererOptions = this.rendererOptions();

		// if we are default price scale, append labels from no-scale
		const isDefault = this._priceScale === paneState.defaultVisiblePriceScale();

		if (isDefault) {
			this._pane.state().orderedSources().forEach((source: IPriceDataSource) => {
				if (paneState.isOverlay(source)) {
					orderedSources.push(source);
				}
			});
		}

		// we can use any, but let's use the first source as "center" one
		const centerSource = this._priceScale.dataSources()[0];
		const priceScale = this._priceScale;

		const updateForSources = (sources: IDataSource[]) => {
			sources.forEach((source: IDataSource) => {
				const sourceViews = source.priceAxisViews(paneState, priceScale);
				// never align selected sources
				sourceViews.forEach((view: IPriceAxisView) => {
					view.setFixedCoordinate(null);
					if (view.isVisible()) {
						views.push(view);
					}
				});
				if (centerSource === source && sourceViews.length > 0) {
					center = sourceViews[0].coordinate();
				}
			});
		};

		// crosshair individually
		updateForSources(orderedSources);

		// split into two parts
		const top = views.filter((view: IPriceAxisView) => view.coordinate() <= center);
		const bottom = views.filter((view: IPriceAxisView) => view.coordinate() > center);

		// sort top from center to top
		top.sort((l: IPriceAxisView, r: IPriceAxisView) => r.coordinate() - l.coordinate());

		// share center label
		if (top.length && bottom.length) {
			bottom.push(top[0]);
		}

		bottom.sort((l: IPriceAxisView, r: IPriceAxisView) => l.coordinate() - r.coordinate());

		views.forEach((view: IPriceAxisView) => view.setFixedCoordinate(view.coordinate()));

		const options = this._priceScale.options();
		if (!options.alignLabels) {
			return;
		}

		for (let i = 1; i < top.length; i++) {
			const view = top[i];
			const prev = top[i - 1];
			const height = prev.height(rendererOptions, false);
			const coordinate = view.coordinate();
			const prevFixedCoordinate = prev.getFixedCoordinate();

			if (coordinate > prevFixedCoordinate - height) {
				view.setFixedCoordinate(prevFixedCoordinate - height);
			}
		}

		for (let j = 1; j < bottom.length; j++) {
			const view = bottom[j];
			const prev = bottom[j - 1];
			const height = prev.height(rendererOptions, true);
			const coordinate = view.coordinate();
			const prevFixedCoordinate = prev.getFixedCoordinate();

			if (coordinate < prevFixedCoordinate + height) {
				view.setFixedCoordinate(prevFixedCoordinate + height);
			}
		}
	}

	private _drawBackLabels(target: CanvasRenderingTarget): void {
		if (this._size === null) {
			return;
		}

		target.context.save();

		const views = this._backLabels();

		const rendererOptions = this.rendererOptions();
		const align = this._isLeft ? 'right' : 'left';

		views.forEach((view: IPriceAxisView) => {
			if (view.isAxisLabelVisible()) {
				const renderer = view.renderer(ensureNotNull(this._priceScale));
				target.context.save();
				renderer.draw(target, rendererOptions, this._widthCache, align);
				target.context.restore();
			}
		});

		target.context.restore();
	}

	private _drawCrosshairLabel(target: CanvasRenderingTarget): void {
		if (this._size === null || this._priceScale === null) {
			return;
		}

		const ctx = target.context;
		ctx.save();

		const model = this._pane.chart().model();

		const views: IPriceAxisViewArray[] = []; // array of arrays
		const pane = this._pane.state();

		const v = model.crosshairSource().priceAxisViews(pane, this._priceScale);
		if (v.length) {
			views.push(v);
		}

		const ro = this.rendererOptions();
		const align = this._isLeft ? 'right' : 'left';

		views.forEach((arr: IPriceAxisViewArray) => {
			arr.forEach((view: IPriceAxisView) => {
				ctx.save();
				view.renderer(ensureNotNull(this._priceScale)).draw(target, ro, this._widthCache, align);
				ctx.restore();
			});
		});

		ctx.restore();
	}

	private _setCursor(type: CursorType): void {
		this._cell.style.cursor = type === CursorType.NsResize ? 'ns-resize' : 'default';
	}

	private _onMarksChanged(): void {
		const width = this.optimalWidth();

		// avoid price scale is shrunk
		// using < instead !== to avoid infinite changes
		if (this._prevOptimalWidth < width) {
			this._pane.chart().model().fullUpdate();
		}

		this._prevOptimalWidth = width;
	}

	private _recreateTickMarksCache(options: PriceAxisViewRendererOptions): void {
		this._tickMarksCache.destroy();

		this._tickMarksCache = new LabelsImageCache(
			options.fontSize,
			options.color,
			options.fontFamily
		);
	}

	private readonly _canvasSuggestedBitmapSizeChangedHandler = () => {
		this._recreateTickMarksCache(this._rendererOptionsProvider.options());

		if (this._isSettingSize) {
			return;
		}

		this._pane.chart().model().lightUpdate();
	};

	private readonly _topCanvasSuggestedBitmapSizeChangedHandler = () => {
		if (this._isSettingSize) {
			return;
		}

		this._pane.chart().model().lightUpdate();
	};
}
