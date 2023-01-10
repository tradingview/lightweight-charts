import {
	BitmapCoordinatesRenderingScope,
	CanvasElementBitmapSizeBinding,
	CanvasRenderingTarget2D,
	equalSizes,
	Size,
	size,
	tryCreateCanvasRenderingTarget2D,
} from 'fancy-canvas';

import { ensureNotNull } from '../helpers/assertions';
import { clearRect, clearRectWithGradient } from '../helpers/canvas-helpers';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';

import { ChartModel, HoveredObject, TrackingModeExitMode } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { IDataSource } from '../model/idata-source';
import { InvalidationLevel } from '../model/invalidate-mask';
import { IPriceDataSource } from '../model/iprice-data-source';
import { KineticAnimation } from '../model/kinetic-animation';
import { Pane } from '../model/pane';
import { Point } from '../model/point';
import { TimePointIndex } from '../model/time-data';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';
import { IPaneRenderer } from '../renderers/ipane-renderer';
import { IPaneView } from '../views/pane/ipane-view';

import { createBoundCanvas } from './canvas-utils';
import { ChartWidget } from './chart-widget';
import { MouseEventHandler, MouseEventHandlerEventBase, MouseEventHandlerMouseEvent, MouseEventHandlers, MouseEventHandlerTouchEvent, Position, TouchMouseEvent } from './mouse-event-handler';
import { PriceAxisWidget, PriceAxisWidgetSide } from './price-axis-widget';

const enum KineticScrollConstants {
	MinScrollSpeed = 0.2,
	MaxScrollSpeed = 7,
	DumpingCoeff = 0.997,
	ScrollMinMove = 15,
}

type DrawFunction = (renderer: IPaneRenderer, target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown) => void;

function drawBackground(renderer: IPaneRenderer, target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
	if (renderer.drawBackground) {
		renderer.drawBackground(target, isHovered, hitTestData);
	}
}

function drawForeground(renderer: IPaneRenderer, target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
	renderer.draw(target, isHovered, hitTestData);
}

type PaneViewsGetter = (source: IDataSource, pane: Pane) => readonly IPaneView[];

function sourcePaneViews(source: IDataSource, pane: Pane): readonly IPaneView[] {
	return source.paneViews(pane);
}

function sourceLabelPaneViews(source: IDataSource, pane: Pane): readonly IPaneView[] {
	return source.labelPaneViews(pane);
}

function sourceTopPaneViews(source: IDataSource, pane: Pane): readonly IPaneView[] {
	return source.topPaneViews !== undefined ? source.topPaneViews(pane) : [];
}

export interface HitTestResult {
	source: IPriceDataSource;
	object?: HoveredObject;
	view: IPaneView;
}

interface HitTestPaneViewResult {
	view: IPaneView;
	object?: HoveredObject;
}

interface StartScrollPosition extends Point {
	timestamp: number;
	localX: Coordinate;
	localY: Coordinate;
}

export class PaneWidget implements IDestroyable, MouseEventHandlers {
	private readonly _chart: ChartWidget;
	private _state: Pane | null;
	private _size: Size = size({ width: 0, height: 0 });
	private _leftPriceAxisWidget: PriceAxisWidget | null = null;
	private _rightPriceAxisWidget: PriceAxisWidget | null = null;
	private readonly _paneCell: HTMLElement;
	private readonly _leftAxisCell: HTMLElement;
	private readonly _rightAxisCell: HTMLElement;
	private readonly _canvasBinding: CanvasElementBitmapSizeBinding;
	private readonly _topCanvasBinding: CanvasElementBitmapSizeBinding;
	private readonly _rowElement: HTMLElement;
	private readonly _mouseEventHandler: MouseEventHandler;
	private _startScrollingPos: StartScrollPosition | null = null;
	private _isScrolling: boolean = false;
	private _clicked: Delegate<TimePointIndex | null, Point, TouchMouseEventData> = new Delegate();
	private _prevPinchScale: number = 0;
	private _longTap: boolean = false;
	private _startTrackPoint: Point | null = null;
	private _exitTrackingModeOnNextTry: boolean = false;
	private _initCrosshairPosition: Point | null = null;

	private _scrollXAnimation: KineticAnimation | null = null;

	private _isSettingSize: boolean = false;

	public constructor(chart: ChartWidget, state: Pane) {
		this._chart = chart;

		this._state = state;
		this._state.onDestroyed().subscribe(this._onStateDestroyed.bind(this), this, true);

		this._paneCell = document.createElement('td');
		this._paneCell.style.padding = '0';
		this._paneCell.style.position = 'relative';

		const paneWrapper = document.createElement('div');
		paneWrapper.style.width = '100%';
		paneWrapper.style.height = '100%';
		paneWrapper.style.position = 'relative';
		paneWrapper.style.overflow = 'hidden';

		this._leftAxisCell = document.createElement('td');
		this._leftAxisCell.style.padding = '0';

		this._rightAxisCell = document.createElement('td');
		this._rightAxisCell.style.padding = '0';

		this._paneCell.appendChild(paneWrapper);

		this._canvasBinding = createBoundCanvas(paneWrapper, size({ width: 16, height: 16 }));
		this._canvasBinding.subscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		const canvas = this._canvasBinding.canvasElement;
		canvas.style.position = 'absolute';
		canvas.style.zIndex = '1';
		canvas.style.left = '0';
		canvas.style.top = '0';

		this._topCanvasBinding = createBoundCanvas(paneWrapper, size({ width: 16, height: 16 }));
		this._topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		const topCanvas = this._topCanvasBinding.canvasElement;
		topCanvas.style.position = 'absolute';
		topCanvas.style.zIndex = '2';
		topCanvas.style.left = '0';
		topCanvas.style.top = '0';

		this._rowElement = document.createElement('tr');
		this._rowElement.appendChild(this._leftAxisCell);
		this._rowElement.appendChild(this._paneCell);
		this._rowElement.appendChild(this._rightAxisCell);
		this.updatePriceAxisWidgetsStates();

		this._mouseEventHandler = new MouseEventHandler(
			this._topCanvasBinding.canvasElement,
			this,
			{
				treatVertTouchDragAsPageScroll: () => this._startTrackPoint === null && !this._chart.options().handleScroll.vertTouchDrag,
				treatHorzTouchDragAsPageScroll: () => this._startTrackPoint === null && !this._chart.options().handleScroll.horzTouchDrag,
			}
		);
	}

	public destroy(): void {
		if (this._leftPriceAxisWidget !== null) {
			this._leftPriceAxisWidget.destroy();
		}
		if (this._rightPriceAxisWidget !== null) {
			this._rightPriceAxisWidget.destroy();
		}

		this._topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._topCanvasSuggestedBitmapSizeChangedHandler);
		this._topCanvasBinding.dispose();

		this._canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._canvasSuggestedBitmapSizeChangedHandler);
		this._canvasBinding.dispose();

		if (this._state !== null) {
			this._state.onDestroyed().unsubscribeAll(this);
		}

		this._mouseEventHandler.destroy();
	}

	public state(): Pane {
		return ensureNotNull(this._state);
	}

	public setState(pane: Pane | null): void {
		if (this._state !== null) {
			this._state.onDestroyed().unsubscribeAll(this);
		}

		this._state = pane;

		if (this._state !== null) {
			this._state.onDestroyed().subscribe(PaneWidget.prototype._onStateDestroyed.bind(this), this, true);
		}

		this.updatePriceAxisWidgetsStates();
	}

	public chart(): ChartWidget {
		return this._chart;
	}

	public getElement(): HTMLElement {
		return this._rowElement;
	}

	public updatePriceAxisWidgetsStates(): void {
		if (this._state === null) {
			return;
		}

		this._recreatePriceAxisWidgets();
		if (this._model().serieses().length === 0) {
			return;
		}

		if (this._leftPriceAxisWidget !== null) {
			const leftPriceScale = this._state.leftPriceScale();
			this._leftPriceAxisWidget.setPriceScale(ensureNotNull(leftPriceScale));
		}
		if (this._rightPriceAxisWidget !== null) {
			const rightPriceScale = this._state.rightPriceScale();
			this._rightPriceAxisWidget.setPriceScale(ensureNotNull(rightPriceScale));
		}
	}

	public updatePriceAxisWidgets(): void {
		if (this._leftPriceAxisWidget !== null) {
			this._leftPriceAxisWidget.update();
		}
		if (this._rightPriceAxisWidget !== null) {
			this._rightPriceAxisWidget.update();
		}
	}

	public stretchFactor(): number {
		return this._state !== null ? this._state.stretchFactor() : 0;
	}

	public setStretchFactor(stretchFactor: number): void {
		if (this._state) {
			this._state.setStretchFactor(stretchFactor);
		}
	}

	public mouseEnterEvent(event: MouseEventHandlerMouseEvent): void {
		if (!this._state) {
			return;
		}
		this._onMouseEvent();
		const x = event.localX;
		const y = event.localY;
		this._setCrosshairPosition(x, y, event);
	}

	public mouseDownEvent(event: MouseEventHandlerMouseEvent): void {
		this._onMouseEvent();
		this._mouseTouchDownEvent();
		this._setCrosshairPosition(event.localX, event.localY, event);
	}

	public mouseMoveEvent(event: MouseEventHandlerMouseEvent): void {
		if (!this._state) {
			return;
		}
		this._onMouseEvent();

		const x = event.localX;
		const y = event.localY;
		this._setCrosshairPosition(x, y, event);
		const hitTest = this.hitTest(x, y);
		this._model().setHoveredSource(hitTest && { source: hitTest.source, object: hitTest.object });
	}

	public mouseClickEvent(event: MouseEventHandlerMouseEvent): void {
		if (this._state === null) {
			return;
		}
		this._onMouseEvent();
		this._fireClickedDelegate(event);
	}

	public pressedMouseMoveEvent(event: MouseEventHandlerMouseEvent): void {
		this._onMouseEvent();
		this._pressedMouseTouchMoveEvent(event);
		this._setCrosshairPosition(event.localX, event.localY, event);
	}

	public mouseUpEvent(event: MouseEventHandlerMouseEvent): void {
		if (this._state === null) {
			return;
		}
		this._onMouseEvent();

		this._longTap = false;

		this._endScroll(event);
	}

	public tapEvent(event: MouseEventHandlerTouchEvent): void {
		if (this._state === null) {
			return;
		}
		this._fireClickedDelegate(event);
	}

	public longTapEvent(event: MouseEventHandlerTouchEvent): void {
		this._longTap = true;

		if (this._startTrackPoint === null) {
			const point: Point = { x: event.localX, y: event.localY };
			this._startTrackingMode(point, point, event);
		}
	}

	public mouseLeaveEvent(event: MouseEventHandlerMouseEvent): void {
		if (this._state === null) {
			return;
		}
		this._onMouseEvent();

		this._state.model().setHoveredSource(null);
		this._clearCrosshairPosition();
	}

	public clicked(): ISubscription<TimePointIndex | null, Point, TouchMouseEventData> {
		return this._clicked;
	}

	public pinchStartEvent(): void {
		this._prevPinchScale = 1;
		this._model().stopTimeScaleAnimation();
	}

	public pinchEvent(middlePoint: Position, scale: number): void {
		if (!this._chart.options().handleScale.pinch) {
			return;
		}

		const zoomScale = (scale - this._prevPinchScale) * 5;
		this._prevPinchScale = scale;

		this._model().zoomTime(middlePoint.x as Coordinate, zoomScale);
	}

	public touchStartEvent(event: MouseEventHandlerTouchEvent): void {
		this._longTap = false;
		this._exitTrackingModeOnNextTry = this._startTrackPoint !== null;

		this._mouseTouchDownEvent();

		if (this._startTrackPoint !== null) {
			const crosshair = this._model().crosshairSource();
			this._initCrosshairPosition = { x: crosshair.appliedX(), y: crosshair.appliedY() };
			this._startTrackPoint = { x: event.localX, y: event.localY };
		}
	}

	public touchMoveEvent(event: MouseEventHandlerTouchEvent): void {
		if (this._state === null) {
			return;
		}

		const x = event.localX;
		const y = event.localY;
		if (this._startTrackPoint !== null) {
			// tracking mode: move crosshair
			this._exitTrackingModeOnNextTry = false;
			const origPoint = ensureNotNull(this._initCrosshairPosition);
			const newX = origPoint.x + (x - this._startTrackPoint.x) as Coordinate;
			const newY = origPoint.y + (y - this._startTrackPoint.y) as Coordinate;
			this._setCrosshairPosition(newX, newY, event);
			return;
		}

		this._pressedMouseTouchMoveEvent(event);
	}

	public touchEndEvent(event: MouseEventHandlerTouchEvent): void {
		if (this.chart().options().trackingMode.exitMode === TrackingModeExitMode.OnTouchEnd) {
			this._exitTrackingModeOnNextTry = true;
		}
		this._tryExitTrackingMode();
		this._endScroll(event);
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult | null {
		const state = this._state;
		if (state === null) {
			return null;
		}

		const sources = state.orderedSources();
		for (const source of sources) {
			const sourceResult = this._hitTestPaneView(source.paneViews(state), x, y);
			if (sourceResult !== null) {
				return {
					source: source,
					view: sourceResult.view,
					object: sourceResult.object,
				};
			}
		}

		return null;
	}

	public setPriceAxisSize(width: number, position: PriceAxisWidgetSide): void {
		const priceAxisWidget = position === 'left' ? this._leftPriceAxisWidget : this._rightPriceAxisWidget;
		ensureNotNull(priceAxisWidget).setSize(size({ width, height: this._size.height }));
	}

	public getSize(): Size {
		return this._size;
	}

	public setSize(newSize: Size): void {
		if (equalSizes(this._size, newSize)) {
			return;
		}

		this._size = newSize;
		this._isSettingSize = true;
		this._canvasBinding.resizeCanvasElement(newSize);
		this._topCanvasBinding.resizeCanvasElement(newSize);
		this._isSettingSize = false;
		this._paneCell.style.width = newSize.width + 'px';
		this._paneCell.style.height = newSize.height + 'px';
	}

	public recalculatePriceScales(): void {
		const pane = ensureNotNull(this._state);
		pane.recalculatePriceScale(pane.leftPriceScale());
		pane.recalculatePriceScale(pane.rightPriceScale());

		for (const source of pane.dataSources()) {
			if (pane.isOverlay(source)) {
				const priceScale = source.priceScale();
				if (priceScale !== null) {
					pane.recalculatePriceScale(priceScale);
				}

				// for overlay drawings price scale is owner's price scale
				// however owner's price scale could not contain ds
				source.updateAllViews();
			}
		}
	}

	public getBitmapSize(): Size {
		return this._canvasBinding.bitmapSize;
	}

	public drawBitmap(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		const bitmapSize = this.getBitmapSize();
		if (bitmapSize.width > 0 && bitmapSize.height > 0) {
			ctx.drawImage(this._canvasBinding.canvasElement, x, y);
		}
	}

	public paint(type: InvalidationLevel): void {
		if (type === InvalidationLevel.None) {
			return;
		}

		if (this._state === null) {
			return;
		}

		if (type > InvalidationLevel.Cursor) {
			this.recalculatePriceScales();
		}

		if (this._leftPriceAxisWidget !== null) {
			this._leftPriceAxisWidget.paint(type);
		}
		if (this._rightPriceAxisWidget !== null) {
			this._rightPriceAxisWidget.paint(type);
		}

		if (type !== InvalidationLevel.Cursor) {
			this._canvasBinding.applySuggestedBitmapSize();
			const target = tryCreateCanvasRenderingTarget2D(this._canvasBinding);
			if (target !== null) {
				target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
					this._drawBackground(scope);
				});
				if (this._state) {
					this._drawGrid(target);
					this._drawWatermark(target);
					this._drawSources(target, sourcePaneViews);
					this._drawSources(target, sourceLabelPaneViews);
				}
			}
		}

		this._topCanvasBinding.applySuggestedBitmapSize();
		const topTarget = tryCreateCanvasRenderingTarget2D(this._topCanvasBinding);
		if (topTarget !== null) {
			topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }: BitmapCoordinatesRenderingScope) => {
				ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
			});
			this._drawSources(topTarget, sourceTopPaneViews);
			this._drawCrosshair(topTarget);
		}
	}

	public leftPriceAxisWidget(): PriceAxisWidget | null {
		return this._leftPriceAxisWidget;
	}

	public rightPriceAxisWidget(): PriceAxisWidget | null {
		return this._rightPriceAxisWidget;
	}

	private _onStateDestroyed(): void {
		if (this._state !== null) {
			this._state.onDestroyed().unsubscribeAll(this);
		}

		this._state = null;
	}

	private _fireClickedDelegate(event: MouseEventHandlerEventBase): void {
		const x = event.localX;
		const y = event.localY;
		if (this._clicked.hasListeners()) {
			this._clicked.fire(this._model().timeScale().coordinateToIndex(x), { x, y }, event);
		}
	}

	private _drawBackground({ context: ctx, bitmapSize }: BitmapCoordinatesRenderingScope): void {
		const { width, height } = bitmapSize;
		const model = this._model();
		const topColor = model.backgroundTopColor();
		const bottomColor = model.backgroundBottomColor();

		if (topColor === bottomColor) {
			clearRect(ctx, 0, 0, width, height, bottomColor);
		} else {
			clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
		}
	}

	private _drawGrid(target: CanvasRenderingTarget2D): void {
		const state = ensureNotNull(this._state);
		const paneView = state.grid().paneView();
		const renderer = paneView.renderer();

		if (renderer !== null) {
			renderer.draw(target, false);
		}
	}

	private _drawWatermark(target: CanvasRenderingTarget2D): void {
		const source = this._model().watermarkSource();
		this._drawSourceImpl(target, sourcePaneViews, drawBackground, source);
		this._drawSourceImpl(target, sourcePaneViews, drawForeground, source);
	}

	private _drawCrosshair(target: CanvasRenderingTarget2D): void {
		this._drawSourceImpl(target, sourcePaneViews, drawForeground, this._model().crosshairSource());
	}

	private _drawSources(target: CanvasRenderingTarget2D, paneViewsGetter: PaneViewsGetter): void {
		const state = ensureNotNull(this._state);
		const sources = state.orderedSources();

		for (const source of sources) {
			this._drawSourceImpl(target, paneViewsGetter, drawBackground, source);
		}

		for (const source of sources) {
			this._drawSourceImpl(target, paneViewsGetter, drawForeground, source);
		}
	}

	private _drawSourceImpl(
		target: CanvasRenderingTarget2D,
		paneViewsGetter: PaneViewsGetter,
		drawFn: DrawFunction,
		source: IDataSource
	): void {
		const state = ensureNotNull(this._state);
		const paneViews = paneViewsGetter(source, state);
		const hoveredSource = state.model().hoveredSource();
		const isHovered = hoveredSource !== null && hoveredSource.source === source;
		const objecId = hoveredSource !== null && isHovered && hoveredSource.object !== undefined
			? hoveredSource.object.hitTestData
			: undefined;

		for (const paneView of paneViews) {
			const renderer = paneView.renderer();
			if (renderer !== null) {
				drawFn(renderer, target, isHovered, objecId);
			}
		}
	}

	private _hitTestPaneView(paneViews: readonly IPaneView[], x: Coordinate, y: Coordinate): HitTestPaneViewResult | null {
		for (const paneView of paneViews) {
			const renderer = paneView.renderer();
			if (renderer !== null && renderer.hitTest) {
				const result = renderer.hitTest(x, y);
				if (result !== null) {
					return {
						view: paneView,
						object: result,
					};
				}
			}
		}

		return null;
	}

	private _recreatePriceAxisWidgets(): void {
		if (this._state === null) {
			return;
		}
		const chart = this._chart;
		const leftAxisVisible = this._state.leftPriceScale().options().visible;
		const rightAxisVisible = this._state.rightPriceScale().options().visible;
		if (!leftAxisVisible && this._leftPriceAxisWidget !== null) {
			this._leftAxisCell.removeChild(this._leftPriceAxisWidget.getElement());
			this._leftPriceAxisWidget.destroy();
			this._leftPriceAxisWidget = null;
		}
		if (!rightAxisVisible && this._rightPriceAxisWidget !== null) {
			this._rightAxisCell.removeChild(this._rightPriceAxisWidget.getElement());
			this._rightPriceAxisWidget.destroy();
			this._rightPriceAxisWidget = null;
		}
		const rendererOptionsProvider = chart.model().rendererOptionsProvider();
		if (leftAxisVisible && this._leftPriceAxisWidget === null) {
			this._leftPriceAxisWidget = new PriceAxisWidget(this, chart.options(), rendererOptionsProvider, 'left');
			this._leftAxisCell.appendChild(this._leftPriceAxisWidget.getElement());
		}
		if (rightAxisVisible && this._rightPriceAxisWidget === null) {
			this._rightPriceAxisWidget = new PriceAxisWidget(this, chart.options(), rendererOptionsProvider, 'right');
			this._rightAxisCell.appendChild(this._rightPriceAxisWidget.getElement());
		}
	}

	private _preventScroll(event: TouchMouseEvent): boolean {
		return event.isTouch && this._longTap || this._startTrackPoint !== null;
	}

	private _correctXCoord(x: Coordinate): Coordinate {
		return Math.max(0, Math.min(x, this._size.width - 1)) as Coordinate;
	}

	private _correctYCoord(y: Coordinate): Coordinate {
		return Math.max(0, Math.min(y, this._size.height - 1)) as Coordinate;
	}

	private _setCrosshairPosition(x: Coordinate, y: Coordinate, event: MouseEventHandlerEventBase): void {
		this._model().setAndSaveCurrentPosition(this._correctXCoord(x), this._correctYCoord(y), event, ensureNotNull(this._state));
	}

	private _clearCrosshairPosition(): void {
		this._model().clearCurrentPosition();
	}

	private _tryExitTrackingMode(): void {
		if (this._exitTrackingModeOnNextTry) {
			this._startTrackPoint = null;
			this._clearCrosshairPosition();
		}
	}

	private _startTrackingMode(startTrackPoint: Point, crossHairPosition: Point, event: MouseEventHandlerEventBase): void {
		this._startTrackPoint = startTrackPoint;
		this._exitTrackingModeOnNextTry = false;
		this._setCrosshairPosition(crossHairPosition.x, crossHairPosition.y, event);
		const crosshair = this._model().crosshairSource();
		this._initCrosshairPosition = { x: crosshair.appliedX(), y: crosshair.appliedY() };
	}

	private _model(): ChartModel {
		return this._chart.model();
	}

	private _endScroll(event: TouchMouseEvent): void {
		if (!this._isScrolling) {
			return;
		}

		const model = this._model();
		const state = this.state();

		model.endScrollPrice(state, state.defaultPriceScale());

		this._startScrollingPos = null;
		this._isScrolling = false;
		model.endScrollTime();

		if (this._scrollXAnimation !== null) {
			const startAnimationTime = performance.now();
			const timeScale = model.timeScale();

			this._scrollXAnimation.start(timeScale.rightOffset() as Coordinate, startAnimationTime);

			if (!this._scrollXAnimation.finished(startAnimationTime)) {
				model.setTimeScaleAnimation(this._scrollXAnimation);
			}
		}
	}

	private _onMouseEvent(): void {
		this._startTrackPoint = null;
	}

	private _mouseTouchDownEvent(): void {
		if (!this._state) {
			return;
		}

		this._model().stopTimeScaleAnimation();

		if (document.activeElement !== document.body && document.activeElement !== document.documentElement) {
			// If any focusable element except the page itself is focused, remove the focus
			(ensureNotNull(document.activeElement) as HTMLElement).blur();
		} else {
			// Clear selection
			const selection = document.getSelection();
			if (selection !== null) {
				selection.removeAllRanges();
			}
		}

		const priceScale = this._state.defaultPriceScale();

		if (priceScale.isEmpty() || this._model().timeScale().isEmpty()) {
			return;
		}
	}

	// eslint-disable-next-line complexity
	private _pressedMouseTouchMoveEvent(event: TouchMouseEvent): void {
		if (this._state === null) {
			return;
		}

		const model = this._model();
		const timeScale = model.timeScale();

		if (timeScale.isEmpty()) {
			return;
		}

		const chartOptions = this._chart.options();
		const scrollOptions = chartOptions.handleScroll;
		const kineticScrollOptions = chartOptions.kineticScroll;
		if (
			(!scrollOptions.pressedMouseMove || event.isTouch) &&
			(!scrollOptions.horzTouchDrag && !scrollOptions.vertTouchDrag || !event.isTouch)
		) {
			return;
		}

		const priceScale = this._state.defaultPriceScale();

		const now = performance.now();

		if (this._startScrollingPos === null && !this._preventScroll(event)) {
			this._startScrollingPos = {
				x: event.clientX,
				y: event.clientY,
				timestamp: now,
				localX: event.localX,
				localY: event.localY,
			};
		}

		if (
			this._startScrollingPos !== null &&
			!this._isScrolling &&
			(this._startScrollingPos.x !== event.clientX || this._startScrollingPos.y !== event.clientY)
		) {
			if (event.isTouch && kineticScrollOptions.touch || !event.isTouch && kineticScrollOptions.mouse) {
				const barSpacing = timeScale.barSpacing();
				this._scrollXAnimation = new KineticAnimation(
					KineticScrollConstants.MinScrollSpeed / barSpacing,
					KineticScrollConstants.MaxScrollSpeed / barSpacing,
					KineticScrollConstants.DumpingCoeff,
					KineticScrollConstants.ScrollMinMove / barSpacing
				);
				this._scrollXAnimation.addPosition(timeScale.rightOffset() as Coordinate, this._startScrollingPos.timestamp);
			} else {
				this._scrollXAnimation = null;
			}

			if (!priceScale.isEmpty()) {
				model.startScrollPrice(this._state, priceScale, event.localY);
			}

			model.startScrollTime(event.localX);
			this._isScrolling = true;
		}

		if (this._isScrolling) {
			// this allows scrolling not default price scales
			if (!priceScale.isEmpty()) {
				model.scrollPriceTo(this._state, priceScale, event.localY);
			}

			model.scrollTimeTo(event.localX);
			if (this._scrollXAnimation !== null) {
				this._scrollXAnimation.addPosition(timeScale.rightOffset() as Coordinate, now);
			}
		}
	}

	private readonly _canvasSuggestedBitmapSizeChangedHandler = () => {
		if (this._isSettingSize || this._state === null) {
			return;
		}

		this._model().lightUpdate();
	};

	private readonly _topCanvasSuggestedBitmapSizeChangedHandler = () => {
		if (this._isSettingSize || this._state === null) {
			return;
		}

		this._model().lightUpdate();
	};
}
