import { CanvasElementBitmapSizeBinding, equalSizes, Size, size } from 'fancy-canvas';

import { clearRect } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { makeFont } from '../helpers/make-font';

import { IDataSource } from '../model/idata-source';
import { InvalidationLevel } from '../model/invalidate-mask';
import { LayoutOptions } from '../model/layout-options';
import { TextWidthCache } from '../model/text-width-cache';
import { TickMarkWeight } from '../model/time-data';
import { TimeMark } from '../model/time-scale';
import { CanvasRenderingTarget, createCanvasRenderingTarget } from '../renderers/canvas-rendering-target';
import { TimeAxisViewRendererOptions } from '../renderers/itime-axis-view-renderer';

import { createBoundCanvas } from './canvas-utils';
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

function markWithGreaterWeight(a: TimeMark, b: TimeMark): TimeMark {
	return a.weight > b.weight ? a : b;
}

export class TimeAxisWidget implements MouseEventHandlers, IDestroyable {
	private readonly _chart: ChartWidget;
	private readonly _options: LayoutOptions;
	private readonly _element: HTMLElement;
	private readonly _leftStubCell: HTMLElement;
	private readonly _rightStubCell: HTMLElement;
	private readonly _cell: HTMLElement;
	private readonly _dv: HTMLElement;
	private readonly _canvasBinding: CanvasElementBitmapSizeBinding;
	private readonly _topCanvasBinding: CanvasElementBitmapSizeBinding;
	private _leftStub: PriceAxisStub | null = null;
	private _rightStub: PriceAxisStub | null = null;
	private readonly _mouseEventHandler: MouseEventHandler;
	private _rendererOptions: TimeAxisViewRendererOptions | null = null;
	private _mouseDown: boolean = false;
	private _size: Size = size({ width: 0, height: 0 });
	private readonly _sizeChanged: Delegate<Size> = new Delegate();
	private readonly _widthCache: TextWidthCache = new TextWidthCache(5);

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

		this._canvasBinding = createBoundCanvas(this._dv, size({ width: 16, height: 16 }));
		this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		const canvas = this._canvasBinding.canvasElement;
		canvas.style.position = 'absolute';
		canvas.style.zIndex = '1';
		canvas.style.left = '0';
		canvas.style.top = '0';

		this._topCanvasBinding = createBoundCanvas(this._dv, size({ width: 16, height: 16 }));
		this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		const topCanvas = this._topCanvasBinding.canvasElement;
		topCanvas.style.position = 'absolute';
		topCanvas.style.zIndex = '2';
		topCanvas.style.left = '0';
		topCanvas.style.top = '0';

		this._element.appendChild(this._leftStubCell);
		this._element.appendChild(this._cell);
		this._element.appendChild(this._rightStubCell);

		this._recreateStubs();
		this._chart.model().priceScalesOptionsChanged().subscribe(this._recreateStubs.bind(this), this);

		this._mouseEventHandler = new MouseEventHandler(
			this._topCanvasBinding.canvasElement,
			this,
			{
				treatVertTouchDragAsPageScroll: true,
				treatHorzTouchDragAsPageScroll: false,
			}
		);
	}

	public destroy(): void {
		this._mouseEventHandler.destroy();
		if (this._leftStub !== null) {
			this._leftStub.destroy();
		}
		if (this._rightStub !== null) {
			this._rightStub.destroy();
		}

		this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		this._topCanvasBinding.dispose();

		this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		this._canvasBinding.dispose();
	}

	public getElement(): HTMLElement {
		return this._element;
	}

	public leftStub(): PriceAxisStub | null {
		return this._leftStub;
	}

	public rightStub(): PriceAxisStub | null {
		return this._rightStub;
	}

	public mouseDownEvent(event: TouchMouseEvent): void {
		if (this._mouseDown) {
			return;
		}

		this._mouseDown = true;
		const model = this._chart.model();
		if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove.time) {
			return;
		}

		model.startScaleTime(event.localX);
	}

	public mouseDownOutsideEvent(): void {
		const model = this._chart.model();
		if (!model.timeScale().isEmpty() && this._mouseDown) {
			this._mouseDown = false;
			if (this._chart.options().handleScale.axisPressedMouseMove.time) {
				model.endScaleTime();
			}
		}
	}

	public pressedMouseMoveEvent(event: TouchMouseEvent): void {
		const model = this._chart.model();
		if (model.timeScale().isEmpty() || !this._chart.options().handleScale.axisPressedMouseMove.time) {
			return;
		}

		model.scaleTimeTo(event.localX);
	}

	public mouseUpEvent(event: TouchMouseEvent): void {
		this._mouseDown = false;
		const model = this._chart.model();
		if (model.timeScale().isEmpty() && !this._chart.options().handleScale.axisPressedMouseMove.time) {
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
		if (this._chart.model().options().handleScale.axisPressedMouseMove.time) {
			this._setCursor(CursorType.EwResize);
		}
	}

	public mouseLeaveEvent(e: TouchMouseEvent): void {
		this._setCursor(CursorType.Default);
	}

	public getSize(): Size {
		return this._size;
	}

	public sizeChanged(): ISubscription<Size> {
		return this._sizeChanged;
	}

	public setSizes(timeAxisSize: Size, leftStubWidth: number, rightStubWidth: number): void {
		if (!equalSizes(this._size, timeAxisSize)) {
			this._size = timeAxisSize;

			this._canvasBinding.resizeCanvasElement(timeAxisSize);
			this._topCanvasBinding.resizeCanvasElement(timeAxisSize);

			this._cell.style.width = `${timeAxisSize.width}px`;
			this._cell.style.height = `${timeAxisSize.height}px`;

			this._sizeChanged.fire(timeAxisSize);
		}

		if (this._leftStub !== null) {
			this._leftStub.setSize(size({ width: leftStubWidth, height: timeAxisSize.height }));
		}
		if (this._rightStub !== null) {
			this._rightStub.setSize(size({ width: rightStubWidth, height: timeAxisSize.height }));
		}
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
		// this call has side-effect - it regenerates marks on the time scale
		this._chart.model().timeScale().marks();
	}

	public getImage(): HTMLCanvasElement {
		return this._canvasBinding.canvasElement;
	}

	public paint(type: InvalidationLevel): void {
		if (type === InvalidationLevel.None) {
			return;
		}

		if (type !== InvalidationLevel.Cursor) {
			const target = createCanvasRenderingTarget(this._canvasBinding);
			if (target !== null) {
				this._drawBackground(target);
				this._drawBorder(target);

				this._drawTickMarks(target);
				// atm we don't have sources to be drawn on time axis except crosshair which is rendered on top level canvas
				// so let's don't call this code at all for now
				// this._drawLabels(this._chart.model().dataSources(), target);
			}
			target?.destroy();

			if (this._leftStub !== null) {
				this._leftStub.paint(type);
			}
			if (this._rightStub !== null) {
				this._rightStub.paint(type);
			}
		}

		const topTarget = createCanvasRenderingTarget(this._topCanvasBinding);
		if (topTarget !== null) {
			topTarget.context.clearRect(0, 0, topTarget.bitmapSize.width, topTarget.bitmapSize.height);
			this._drawLabels([this._chart.model().crosshairSource()], topTarget);
		}
		topTarget?.destroy();
	}

	private _drawBackground(target: CanvasRenderingTarget): void {
		clearRect(target.context, 0, 0, target.bitmapSize.width, target.bitmapSize.height, this._chart.model().backgroundBottomColor());
	}

	private _drawBorder(target: CanvasRenderingTarget): void {
		if (this._chart.options().timeScale.borderVisible) {
			const ctx = target.context;
			ctx.save();

			ctx.fillStyle = this._lineColor();

			const borderSize = Math.max(1, Math.floor(this._getRendererOptions().borderSize * target.verticalPixelRatio));

			ctx.fillRect(0, 0, target.bitmapSize.width, borderSize);
			ctx.restore();
		}
	}

	private _drawTickMarks(target: CanvasRenderingTarget): void {
		const tickMarks = this._chart.model().timeScale().marks();

		if (!tickMarks || tickMarks.length === 0) {
			return;
		}

		let maxWeight = tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;

		// special case: it looks strange if 15:00 is bold but 14:00 is not
		// so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
		if (maxWeight > TickMarkWeight.Hour1 && maxWeight < TickMarkWeight.Day) {
			maxWeight = TickMarkWeight.Hour1;
		}

		const ctx = target.context;
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

		const { horizontalPixelRatio, verticalPixelRatio } = target;

		const borderSize = Math.floor(this._getRendererOptions().borderSize * verticalPixelRatio);
		const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
		const tickOffset = Math.floor(horizontalPixelRatio * 0.5);

		if (this._chart.model().timeScale().options().borderVisible) {
			ctx.beginPath();
			const tickLen = Math.round(rendererOptions.tickLength * verticalPixelRatio);
			for (let index = tickMarks.length; index--;) {
				const x = Math.round(tickMarks[index].coord * horizontalPixelRatio);
				ctx.rect(x - tickOffset, borderSize, tickWidth, tickLen);
			}

			ctx.fill();
		}

		target.useCanvasElementCoordinates(({ context }: { context: CanvasRenderingContext2D }) => {
			context.fillStyle = this._textColor();

			// draw base marks
			context.font = this._baseFont();
			for (const tickMark of tickMarks) {
				if (tickMark.weight < maxWeight) {
					const coordinate = tickMark.needAlignCoordinate ? this._alignTickMarkLabelCoordinate(context, tickMark.coord, tickMark.label) : tickMark.coord;
					context.fillText(tickMark.label, coordinate, yText);
				}
			}
			context.font = this._baseBoldFont();
			for (const tickMark of tickMarks) {
				if (tickMark.weight >= maxWeight) {
					const coordinate = tickMark.needAlignCoordinate ? this._alignTickMarkLabelCoordinate(context, tickMark.coord, tickMark.label) : tickMark.coord;
					context.fillText(tickMark.label, coordinate, yText);
				}
			}
		});
	}

	private _alignTickMarkLabelCoordinate(ctx: CanvasRenderingContext2D, coordinate: number, labelText: string): number {
		const labelWidth = this._widthCache.measureText(ctx, labelText);
		const labelWidthHalf = labelWidth / 2;
		const leftTextCoordinate = Math.floor(coordinate - labelWidthHalf) + 0.5;

		if (leftTextCoordinate < 0) {
			coordinate = coordinate + Math.abs(0 - leftTextCoordinate);
		} else if (leftTextCoordinate + labelWidth > this._size.width) {
			coordinate = coordinate - Math.abs(this._size.width - (leftTextCoordinate + labelWidth));
		}

		return coordinate;
	}

	private _drawLabels(sources: readonly IDataSource[], target: CanvasRenderingTarget): void {
		const rendererOptions = this._getRendererOptions();
		for (const source of sources) {
			for (const view of source.timeAxisViews()) {
				target.context.save();
				view.renderer().draw(target, rendererOptions);
				target.context.restore();
			}
		}
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

	private _recreateStubs(): void {
		const model = this._chart.model();
		const options = model.options();
		if (!options.leftPriceScale.visible && this._leftStub !== null) {
			this._leftStubCell.removeChild(this._leftStub.getElement());
			this._leftStub.destroy();
			this._leftStub = null;
		}
		if (!options.rightPriceScale.visible && this._rightStub !== null) {
			this._rightStubCell.removeChild(this._rightStub.getElement());
			this._rightStub.destroy();
			this._rightStub = null;
		}
		const rendererOptionsProvider = this._chart.model().rendererOptionsProvider();
		const params: PriceAxisStubParams = {
			rendererOptionsProvider: rendererOptionsProvider,
		};

		const borderVisibleGetter = () => {
			return options.leftPriceScale.borderVisible && model.timeScale().options().borderVisible;
		};

		const bottomColorGetter = () => model.backgroundBottomColor();

		if (options.leftPriceScale.visible && this._leftStub === null) {
			this._leftStub = new PriceAxisStub('left', options, params, borderVisibleGetter, bottomColorGetter);
			this._leftStubCell.appendChild(this._leftStub.getElement());
		}
		if (options.rightPriceScale.visible && this._rightStub === null) {
			this._rightStub = new PriceAxisStub('right', options, params, borderVisibleGetter, bottomColorGetter);
			this._rightStubCell.appendChild(this._rightStub.getElement());
		}
	}

	private readonly _canvasSuggestedBitmapSizeChangedHandler = () => {
		this._canvasBinding.applySuggestedBitmapSize();
		this._chart.model().lightUpdate();
	};

	private readonly _topCanvasSuggestedBitmapSizeChangedHandler = () => {
		this._topCanvasBinding.applySuggestedBitmapSize();
		this._chart.model().lightUpdate();
	};
}
