import { Binding as CanvasCoordinateSpaceBinding } from 'fancy-canvas/coordinate-space';

import { clearRect, drawScaled } from '../helpers/canvas-helpers';
import { IDestroyable } from '../helpers/idestroyable';
import { makeFont } from '../helpers/make-font';

import { Coordinate } from '../model/coordinate';
import { IDataSource } from '../model/idata-source';
import { InvalidationLevel } from '../model/invalidate-mask';
import { LayoutOptions } from '../model/layout-options';
import { PriceAxisPosition } from '../model/price-scale';
import { TextWidthCache } from '../model/text-width-cache';
import { MarkSpanBorder, TimeMark } from '../model/time-scale';
import { TimeAxisViewRendererOptions } from '../renderers/itime-axis-view-renderer';
import { TimeAxisView } from '../views/time-axis/time-axis-view';

import { createBoundCanvas, getContext2D, Size } from './canvas-utils';
import { ChartWidget } from './chart-widget';
import { MouseEventHandler, MouseEventHandlers, TouchMouseEvent } from './mouse-event-handler';
import { PriceAxisStub, PriceAxisStubParams } from './price-axis-stub';

const enum Constants {
	BorderSize = 1,
	TickLength = 3,
}

const enum CursorType {
	Default,
	EwResize,
}

function markWithGreaterSpan(a: TimeMark, b: TimeMark): TimeMark {
	return a.span > b.span ? a : b;
}

export class TimeAxisWidget implements MouseEventHandlers, IDestroyable {
	private readonly _chart: ChartWidget;
	private readonly _options: LayoutOptions;
	private readonly _element: HTMLElement;
	private readonly _leftStubCell: HTMLElement;
	private readonly _rightStubCell: HTMLElement;
	private readonly _cell: HTMLElement;
	private readonly _dv: HTMLElement;
	private readonly _canvasBinding: CanvasCoordinateSpaceBinding;
	private readonly _topCanvasBinding: CanvasCoordinateSpaceBinding;
	private _stub: PriceAxisStub | null = null;
	private _minVisibleSpan: number = MarkSpanBorder.Year;
	private readonly _mouseEventHandler: MouseEventHandler;
	private _rendererOptions: TimeAxisViewRendererOptions | null = null;
	private _mouseDown: boolean = false;
	private _size: Size = new Size(0, 0);
	private _priceAxisPosition: PriceAxisPosition = 'none';

	public constructor(chartWidget: ChartWidget) {
		this._chart = chartWidget;
		this._options = chartWidget.options().layout;

		this._element = document.createElement('tr');

		this._leftStubCell = document.createElement('td');
		this._leftStubCell.style.padding = '0';

		this._rightStubCell = document.createElement('td');
		this._rightStubCell.style.padding = '0';

		this._cell = document.createElement('td');
		this._cell.style.height = '25px';
		this._cell.style.padding = '0';

		this._dv = document.createElement('div');
		this._dv.style.width = '100%';
		this._dv.style.height = '100%';
		this._dv.style.position = 'relative';
		this._dv.style.overflow = 'hidden';
		this._cell.appendChild(this._dv);

		this._canvasBinding = createBoundCanvas(this._dv, new Size(16, 16));
		this._canvasBinding.subscribeCanvasConfigured(this._canvasConfiguredHandler);
		const canvas = this._canvasBinding.canvas;
		canvas.style.position = 'absolute';
		canvas.style.zIndex = '1';
		canvas.style.left = '0';
		canvas.style.top = '0';

		this._topCanvasBinding = createBoundCanvas(this._dv, new Size(16, 16));
		this._topCanvasBinding.subscribeCanvasConfigured(this._topCanvasConfiguredHandler);
		const topCanvas = this._topCanvasBinding.canvas;
		topCanvas.style.position = 'absolute';
		topCanvas.style.zIndex = '2';
		topCanvas.style.left = '0';
		topCanvas.style.top = '0';

		this._element.appendChild(this._leftStubCell);
		this._element.appendChild(this._cell);
		this._element.appendChild(this._rightStubCell);

		this._recreateStub();
		this._chart.model().mainPriceScaleOptionsChanged().subscribe(this._recreateStub.bind(this), this);

		this._mouseEventHandler = new MouseEventHandler(
			this._topCanvasBinding.canvas,
			this,
			{
				treatVertTouchDragAsPageScroll: true,
				treatHorzTouchDragAsPageScroll: false,
			}
		);
	}

	public destroy(): void {
		this._mouseEventHandler.destroy();
		if (this._stub !== null) {
			this._stub.destroy();
		}

		this._topCanvasBinding.unsubscribeCanvasConfigured(this._topCanvasConfiguredHandler);
		this._topCanvasBinding.destroy();

		this._canvasBinding.unsubscribeCanvasConfigured(this._canvasConfiguredHandler);
		this._canvasBinding.destroy();
	}

	public getElement(): HTMLElement {
		return this._element;
	}

	public stub(): PriceAxisStub | null {
		return this._stub;
	}

	public mouseDownEvent(event: TouchMouseEvent): void {
		if (this._mouseDown) {
			return;
		}

		this._mouseDown = true;
		const model = this._chart.model();
		if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove) {
			return;
		}

		model.startScaleTime(event.localX as Coordinate);
	}

	public mouseDownOutsideEvent(): void {
		const model = this._chart.model();
		if (!model.timeScale().isEmpty() && this._mouseDown) {
			this._mouseDown = false;
			if (this._chart.options().handleScale.axisPressedMouseMove) {
				model.endScaleTime();
			}
		}
	}

	public pressedMouseMoveEvent(event: TouchMouseEvent): void {
		const model = this._chart.model();
		if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove) {
			return;
		}

		model.scaleTimeTo(event.localX as Coordinate);
	}

	public mouseUpEvent(event: TouchMouseEvent): void {
		this._mouseDown = false;
		const model = this._chart.model();
		if (model.timeScale().isEmpty() && !this._chart.options().handleScale.axisPressedMouseMove) {
			return;
		}

		model.endScaleTime();
	}

	public mouseDoubleClickEvent(): void {
		if (this._chart.options().handleScale.axisDoubleClickReset) {
			this._chart.model().resetTimeScale();
		}
	}

	public mouseEnterEvent(e: TouchMouseEvent): void {
		if (this._chart.model().options().handleScale.axisPressedMouseMove) {
			this._setCursor(CursorType.EwResize);
		}
	}

	public mouseLeaveEvent(e: TouchMouseEvent): void {
		this._setCursor(CursorType.Default);
	}

	public getSize(): Readonly<Size> {
		return this._size;
	}

	public setSizes(timeAxisSize: Size, stubWidth: number): void {
		if (!this._size || !this._size.equals(timeAxisSize)) {
			this._size = timeAxisSize;

			this._canvasBinding.resizeCanvas({ width: timeAxisSize.w, height: timeAxisSize.h });
			this._topCanvasBinding.resizeCanvas({ width: timeAxisSize.w, height: timeAxisSize.h });

			this._cell.style.width = timeAxisSize.w + 'px';
			this._cell.style.height = timeAxisSize.h + 'px';
		}

		if (this._stub !== null) {
			this._stub.setSize(new Size(stubWidth, timeAxisSize.h));
		}
	}

	public width(): number {
		return this._size.w;
	}

	public height(): number {
		return this._size.h;
	}

	public optimalHeight(): number {
		const rendererOptions = this._getRendererOptions();
		return Math.ceil(
			// rendererOptions.offsetSize +
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.fontSize +
			rendererOptions.paddingTop +
			rendererOptions.paddingBottom
		);
	}

	public update(): void {
		const tickMarks = this._chart.model().timeScale().marks();

		if (!tickMarks) {
			return;
		}

		this._minVisibleSpan = MarkSpanBorder.Year;

		tickMarks.forEach((tickMark: TimeMark) => {
			this._minVisibleSpan = Math.min(tickMark.span, this._minVisibleSpan);
		});
	}

	public getImage(): HTMLCanvasElement {
		return this._canvasBinding.canvas;
	}

	public paint(type: InvalidationLevel): void {
		if (type === InvalidationLevel.None) {
			return;
		}

		if (type !== InvalidationLevel.Cursor) {
			const ctx = getContext2D(this._canvasBinding.canvas);
			this._drawBackground(ctx, this._canvasBinding.pixelRatio);
			this._drawBorder(ctx, this._canvasBinding.pixelRatio);

			this._drawTickMarks(ctx, this._canvasBinding.pixelRatio);
			this._drawBackLabels(ctx, this._canvasBinding.pixelRatio);

			if (this._stub !== null) {
				this._stub.paint(type);
			}
		}

		const topCtx = getContext2D(this._topCanvasBinding.canvas);
		this._drawCrosshairLabel(topCtx, this._topCanvasBinding.pixelRatio);
	}

	private _drawBackground(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		drawScaled(ctx, pixelRatio, () => {
			clearRect(ctx, 0, 0, this._size.w, this._size.h, this._backgroundColor());
		});
	}

	private _drawBorder(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		if (this._chart.options().timeScale.borderVisible) {
			ctx.save();

			ctx.fillStyle = this._lineColor();

			const borderSize = Math.max(1, Math.floor(this._getRendererOptions().borderSize * pixelRatio));

			ctx.fillRect(0, 0, Math.ceil(this._size.w * pixelRatio), borderSize);
			ctx.restore();
		}
	}

	private _drawTickMarks(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		const tickMarks = this._chart.model().timeScale().marks();

		if (!tickMarks || tickMarks.length === 0) {
			return;
		}

		// select max span
		/*
		5 * ?SEC -> 11;
		15 * ?SEC -> 12;
		30 * ?SEC -> 13;
		?MIN -> 20;
		5 * ?MIN -> 21;
		15 * ?MIN -> 21;
		30 * ?MIN -> 22;
		?HOUR -> 30;
		3 * ?HOUR -> 31;
		6 * ?HOUR -> 32;
		12 * ?HOUR -> 33;
		?DAY -> 40;
		?WEEK -> 50;
		?MONTH -> 60;
		?YEAR -> 70
		*/

		let maxSpan = tickMarks.reduce(markWithGreaterSpan, tickMarks[0]).span;

		// special case: it looks strange if 15:00 is bold but 14:00 is not
		// so if maxSpan > 30 and < 40 reduce it to 30
		if (maxSpan > 30 && maxSpan < 40) {
			maxSpan = 30;
		}

		ctx.save();

		ctx.strokeStyle = this._lineColor();

		const rendererOptions = this._getRendererOptions();
		const yText = (
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingTop +
			rendererOptions.fontSize -
			rendererOptions.baselineOffset
		);

		ctx.textAlign = 'center';
		ctx.fillStyle = this._lineColor();

		const borderSize = Math.floor(this._getRendererOptions().borderSize * pixelRatio);
		const tickWidth = Math.max(1, Math.floor(pixelRatio));
		const tickOffset = Math.floor(pixelRatio * 0.5);

		if (this._chart.model().timeScale().options().borderVisible) {
			ctx.beginPath();
			const tickLen = Math.round(rendererOptions.tickLength * pixelRatio);
			for (let index = tickMarks.length; index--;) {
				const x = Math.round(tickMarks[index].coord * pixelRatio);
				ctx.rect(x - tickOffset, borderSize, tickWidth, tickLen);
			}

			ctx.fill();
		}

		ctx.fillStyle = this._textColor();

		drawScaled(ctx, pixelRatio, () => {
			// draw base marks
			ctx.font = this._baseFont();
			for (const tickMark of tickMarks) {
				if (tickMark.span < maxSpan) {
					ctx.fillText(tickMark.label, tickMark.coord, yText);
				}
			}
			ctx.font = this._baseBoldFont();
			for (const tickMark of tickMarks) {
				if (tickMark.span >= maxSpan) {
					ctx.fillText(tickMark.label, tickMark.coord, yText);
				}
			}
		});
	}

	private _drawBackLabels(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		ctx.save();
		const topLevelSources: Set<IDataSource> = new Set();

		const model = this._chart.model();
		const sources = model.dataSources();
		topLevelSources.add(model.crosshairSource());

		const rendererOptions = this._getRendererOptions();
		for (const source of sources) {
			if (topLevelSources.has(source)) {
				continue;
			}

			const views = source.timeAxisViews();
			for (const view of views) {
				view.renderer().draw(ctx, rendererOptions, pixelRatio);
			}
		}

		ctx.restore();
	}

	private _drawCrosshairLabel(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		ctx.save();

		ctx.clearRect(0, 0, Math.ceil(this._size.w * pixelRatio), Math.ceil(this._size.h * pixelRatio));
		const model = this._chart.model();

		const views: ReadonlyArray<TimeAxisView>[] = []; // array of arrays

		const timeAxisViews = model.crosshairSource().timeAxisViews();
		views.push(timeAxisViews);

		const renderingOptions = this._getRendererOptions();

		views.forEach((arr: ReadonlyArray<TimeAxisView>) => {
			arr.forEach((view: TimeAxisView) => {
				ctx.save();
				view.renderer().draw(ctx, renderingOptions, pixelRatio);
				ctx.restore();
			});
		});

		ctx.restore();
	}

	private _backgroundColor(): string {
		return this._options.backgroundColor;
	}

	private _lineColor(): string {
		return this._chart.options().timeScale.borderColor;
	}

	private _textColor(): string {
		return this._options.textColor;
	}

	private _fontSize(): number {
		return this._options.fontSize;
	}

	private _baseFont(): string {
		return makeFont(this._fontSize(), this._options.fontFamily);
	}

	private _baseBoldFont(): string {
		return makeFont(this._fontSize(), this._options.fontFamily, 'bold');
	}

	private _getRendererOptions(): Readonly<TimeAxisViewRendererOptions> {
		if (this._rendererOptions === null) {
			this._rendererOptions = {
				borderSize: Constants.BorderSize,
				baselineOffset: NaN,
				paddingTop: NaN,
				paddingBottom: NaN,
				paddingHorizontal: NaN,
				tickLength: Constants.TickLength,
				fontSize: NaN,
				font: '',
				widthCache: new TextWidthCache(),
			};
		}

		const rendererOptions = this._rendererOptions;
		const newFont = this._baseFont();

		if (rendererOptions.font !== newFont) {
			const fontSize = this._fontSize();
			rendererOptions.fontSize = fontSize;
			rendererOptions.font = newFont;
			rendererOptions.paddingTop = Math.ceil(fontSize / 2.5);
			rendererOptions.paddingBottom = rendererOptions.paddingTop;
			rendererOptions.paddingHorizontal = Math.ceil(fontSize / 2);
			rendererOptions.baselineOffset = Math.round(this._fontSize() / 5);
			rendererOptions.widthCache.reset();
		}

		return this._rendererOptions;
	}

	private _setCursor(type: CursorType): void {
		this._cell.style.cursor = type === CursorType.EwResize ? 'ew-resize' : 'default';
	}

	private _recreateStub(): void {
		const priceAxisPosition = this._chart.model().mainPriceScale().options().position;
		if (priceAxisPosition === this._priceAxisPosition) {
			return;
		}
		if (this._stub !== null) {
			if (this._stub.isLeft()) {
				this._leftStubCell.removeChild(this._stub.getElement());
			} else {
				this._rightStubCell.removeChild(this._stub.getElement());
			}

			this._stub.destroy();
			this._stub = null;
		}

		if (priceAxisPosition !== 'none') {
			const rendererOptionsProvider = this._chart.model().rendererOptionsProvider();
			const params: PriceAxisStubParams = {
				rendererOptionsProvider: rendererOptionsProvider,
			};

			const model = this._chart.model();
			const borderVisibleGetter = () => {
				return model.mainPriceScale().options().borderVisible && model.timeScale().options().borderVisible;
			};

			this._stub = new PriceAxisStub(priceAxisPosition, this._chart.options(), params, borderVisibleGetter);
			const stubCell = priceAxisPosition === 'left' ? this._leftStubCell : this._rightStubCell;
			stubCell.appendChild(this._stub.getElement());
		}

		this._priceAxisPosition = priceAxisPosition;
	}

	private readonly _canvasConfiguredHandler = () => this._chart.model().lightUpdate();
	private readonly _topCanvasConfiguredHandler = () => this._chart.model().lightUpdate();
}
