import { Size, size } from 'fancy-canvas';

import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { isChromiumBased, isWindows } from '../helpers/browsers';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial } from '../helpers/strict-type-checks';

import { ChartModel, ChartOptionsInternal } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { DefaultPriceScaleId } from '../model/default-price-scale';
import {
	InvalidateMask,
	InvalidationLevel,
	TimeScaleInvalidation,
	TimeScaleInvalidationType,
} from '../model/invalidate-mask';
import { Point } from '../model/point';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import { OriginalTime, TimePointIndex } from '../model/time-data';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';

// import { PaneSeparator, SEPARATOR_HEIGHT } from './pane-separator';
import { PaneWidget } from './pane-widget';
import { TimeAxisWidget } from './time-axis-widget';

export interface MouseEventParamsImpl {
	time?: OriginalTime;
	index?: TimePointIndex;
	point?: Point;
	seriesData: Map<Series, SeriesPlotRow>;
	hoveredSeries?: Series;
	hoveredObject?: string;
	touchMouseEventData?: TouchMouseEventData;
}

export type MouseEventParamsImplSupplier = () => MouseEventParamsImpl;

const windowsChrome = isChromiumBased() && isWindows();

export class ChartWidget implements IDestroyable {
	private readonly _options: ChartOptionsInternal;
	private _paneWidgets: PaneWidget[] = [];
	// private _paneSeparators: PaneSeparator[] = [];
	private readonly _model: ChartModel;
	private _drawRafId: number = 0;
	private _height: number = 0;
	private _width: number = 0;
	private _leftPriceAxisWidth: number = 0;
	private _rightPriceAxisWidth: number = 0;
	private _element: HTMLElement;
	private readonly _tableElement: HTMLElement;
	private _timeAxisWidget: TimeAxisWidget;
	private _invalidateMask: InvalidateMask | null = null;
	private _drawPlanned: boolean = false;
	private _clicked: Delegate<MouseEventParamsImplSupplier> = new Delegate();
	private _crosshairMoved: Delegate<MouseEventParamsImplSupplier> = new Delegate();
	private _onWheelBound: (event: WheelEvent) => void;

	public constructor(container: HTMLElement, options: ChartOptionsInternal) {
		this._options = options;

		this._element = document.createElement('div');
		this._element.classList.add('tv-lightweight-charts');
		this._element.style.overflow = 'hidden';
		this._element.style.width = '100%';
		this._element.style.height = '100%';
		disableSelection(this._element);

		this._tableElement = document.createElement('table');
		this._tableElement.setAttribute('cellspacing', '0');
		this._element.appendChild(this._tableElement);

		this._onWheelBound = this._onMousewheel.bind(this);
		if (shouldSubscribeMouseWheel(this._options)) {
			this._setMouseWheelEventListener(true);
		}
		this._model = new ChartModel(
			this._invalidateHandler.bind(this),
			this._options
		);
		this.model().crosshairMoved().subscribe(this._onPaneWidgetCrosshairMoved.bind(this), this);

		this._timeAxisWidget = new TimeAxisWidget(this);
		this._tableElement.appendChild(this._timeAxisWidget.getElement());

		let width = this._options.width;
		let height = this._options.height;

		if (width === 0 || height === 0) {
			const containerRect = container.getBoundingClientRect();
			// TODO: Fix it better
			// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
			// For chart widget we decreases because we must be inside container.
			// For time axis this is not important, since it just affects space for pane widgets
			if (width === 0) {
				width = Math.floor(containerRect.width);
				width -= width % 2;
			}

			if (height === 0) {
				height = Math.floor(containerRect.height);
				height -= height % 2;
			}
		}

		// BEWARE: resize must be called BEFORE _syncGuiWithModel (in constructor only)
		// or after but with adjustSize to properly update time scale
		this.resize(width, height);

		this._syncGuiWithModel();

		container.appendChild(this._element);
		this._updateTimeAxisVisibility();
		this._model.timeScale().optionsApplied().subscribe(this._model.fullUpdate.bind(this._model), this);
		this._model.priceScalesOptionsChanged().subscribe(this._model.fullUpdate.bind(this._model), this);
	}

	public model(): ChartModel {
		return this._model;
	}

	public options(): Readonly<ChartOptionsInternal> {
		return this._options;
	}

	public paneWidgets(): PaneWidget[] {
		return this._paneWidgets;
	}

	public timeAxisWidget(): TimeAxisWidget {
		return this._timeAxisWidget;
	}

	public destroy(): void {
		this._setMouseWheelEventListener(false);
		if (this._drawRafId !== 0) {
			window.cancelAnimationFrame(this._drawRafId);
		}

		this._model.crosshairMoved().unsubscribeAll(this);
		this._model.timeScale().optionsApplied().unsubscribeAll(this);
		this._model.priceScalesOptionsChanged().unsubscribeAll(this);
		this._model.destroy();

		for (const paneWidget of this._paneWidgets) {
			this._tableElement.removeChild(paneWidget.getElement());
			paneWidget.clicked().unsubscribeAll(this);
			paneWidget.destroy();
		}
		this._paneWidgets = [];

		// for (const paneSeparator of this._paneSeparators) {
		// 	this._destroySeparator(paneSeparator);
		// }
		// this._paneSeparators = [];

		ensureNotNull(this._timeAxisWidget).destroy();

		if (this._element.parentElement !== null) {
			this._element.parentElement.removeChild(this._element);
		}

		this._crosshairMoved.destroy();
		this._clicked.destroy();
	}

	public resize(width: number, height: number, forceRepaint: boolean = false): void {
		if (this._height === height && this._width === width) {
			return;
		}

		this._height = height;
		this._width = width;

		const heightStr = height + 'px';
		const widthStr = width + 'px';

		ensureNotNull(this._element).style.height = heightStr;
		ensureNotNull(this._element).style.width = widthStr;

		this._tableElement.style.height = heightStr;
		this._tableElement.style.width = widthStr;

		if (forceRepaint) {
			this._drawImpl(InvalidateMask.full(), performance.now());
		} else {
			this._model.fullUpdate();
		}
	}

	public paint(invalidateMask?: InvalidateMask): void {
		if (invalidateMask === undefined) {
			invalidateMask = InvalidateMask.full();
		}

		for (let i = 0; i < this._paneWidgets.length; i++) {
			this._paneWidgets[i].paint(invalidateMask.invalidateForPane(i).level);
		}

		if (this._options.timeScale.visible) {
			this._timeAxisWidget.paint(invalidateMask.fullInvalidation());
		}
	}

	public applyOptions(options: DeepPartial<ChartOptionsInternal>): void {
		const currentlyHasMouseWheelListener = shouldSubscribeMouseWheel(this._options);

		// we don't need to merge options here because it's done in chart model
		// and since both model and widget share the same object it will be done automatically for widget as well
		// not ideal solution for sure, but it work's for now ¯\_(ツ)_/¯
		this._model.applyOptions(options);

		const shouldHaveMouseWheelListener = shouldSubscribeMouseWheel(this._options);
		if (shouldHaveMouseWheelListener !== currentlyHasMouseWheelListener) {
			this._setMouseWheelEventListener(shouldHaveMouseWheelListener);
		}

		this._updateTimeAxisVisibility();

		const width = options.width || this._width;
		const height = options.height || this._height;

		this.resize(width, height);
	}

	public clicked(): ISubscription<MouseEventParamsImplSupplier> {
		return this._clicked;
	}

	public crosshairMoved(): ISubscription<MouseEventParamsImplSupplier> {
		return this._crosshairMoved;
	}

	public takeScreenshot(): HTMLCanvasElement {
		if (this._invalidateMask !== null) {
			this._drawImpl(this._invalidateMask, performance.now());
			this._invalidateMask = null;
		}

		const screeshotBitmapSize = this._traverseLayout(null);
		const screenshotCanvas = document.createElement('canvas');
		screenshotCanvas.width = screeshotBitmapSize.width;
		screenshotCanvas.height = screeshotBitmapSize.height;

		const ctx = ensureNotNull(screenshotCanvas.getContext('2d'));
		this._traverseLayout(ctx);

		return screenshotCanvas;
	}

	public getPriceAxisWidth(position: DefaultPriceScaleId): number {
		if (position === 'left' && !this._isLeftAxisVisible()) {
			return 0;
		}

		if (position === 'right' && !this._isRightAxisVisible()) {
			return 0;
		}

		if (this._paneWidgets.length === 0) {
			return 0;
		}

		// we don't need to worry about exactly pane widget here
		// because all pane widgets have the same width of price axis widget
		// see _adjustSizeImpl
		const priceAxisWidget = position === 'left'
			? this._paneWidgets[0].leftPriceAxisWidget()
			: this._paneWidgets[0].rightPriceAxisWidget();
		return ensureNotNull(priceAxisWidget).getWidth();
	}

	/**
	 * Traverses the widget's layout (pane and axis child widgets),
	 * draws the screenshot (if rendering context is passed) and returns the screenshot bitmap size
	 *
	 * @param ctx - if passed, used to draw the screenshot of widget
	 * @returns screenshot bitmap size
	 */
	private _traverseLayout(ctx: CanvasRenderingContext2D | null): Size {
		let totalWidth = 0;
		let totalHeight = 0;

		const firstPane = this._paneWidgets[0];

		const drawPriceAxises = (position: 'left' | 'right', targetX: number) => {
			let targetY = 0;
			for (let paneIndex = 0; paneIndex < this._paneWidgets.length; paneIndex++) {
				const paneWidget = this._paneWidgets[paneIndex];
				const priceAxisWidget = ensureNotNull(position === 'left' ? paneWidget.leftPriceAxisWidget() : paneWidget.rightPriceAxisWidget());
				const bitmapSize = priceAxisWidget.getBitmapSize();
				if (ctx !== null) {
					priceAxisWidget.drawBitmap(ctx, targetX, targetY);
				}
				targetY += bitmapSize.height;
				// if (paneIndex < this._paneWidgets.length - 1) {
				// 	const separator = this._paneSeparators[paneIndex];
				// 	const separatorBitmapSize = separator.getBitmapSize();
				// 	if (ctx !== null) {
				// 		separator.drawBitmap(ctx, targetX, targetY);
				// 	}
				// 	targetY += separatorBitmapSize.height;
				// }
			}
		};

		// draw left price scale if exists
		if (this._isLeftAxisVisible()) {
			drawPriceAxises('left', 0);
			const leftAxisBitmapWidth = ensureNotNull(firstPane.leftPriceAxisWidget()).getBitmapSize().width;
			totalWidth += leftAxisBitmapWidth;
		}
		for (let paneIndex = 0; paneIndex < this._paneWidgets.length; paneIndex++) {
			const paneWidget = this._paneWidgets[paneIndex];
			const bitmapSize = paneWidget.getBitmapSize();
			if (ctx !== null) {
				paneWidget.drawBitmap(ctx, totalWidth, totalHeight);
			}
			totalHeight += bitmapSize.height;
			// if (paneIndex < this._paneWidgets.length - 1) {
			// 	const separator = this._paneSeparators[paneIndex];
			// 	const separatorBitmapSize = separator.getBitmapSize();
			// 	if (ctx !== null) {
			// 		separator.drawBitmap(ctx, totalWidth, totalHeight);
			// 	}
			// 	totalHeight += separatorBitmapSize.height;
			// }
		}
		const firstPaneBitmapWidth = firstPane.getBitmapSize().width;
		totalWidth += firstPaneBitmapWidth;

		// draw right price scale if exists
		if (this._isRightAxisVisible()) {
			drawPriceAxises('right', totalWidth);
			const rightAxisBitmapWidth = ensureNotNull(firstPane.rightPriceAxisWidget()).getBitmapSize().width;
			totalWidth += rightAxisBitmapWidth;
		}

		const drawStub = (position: 'left' | 'right', targetX: number, targetY: number) => {
			const stub = ensureNotNull(position === 'left' ? this._timeAxisWidget.leftStub() : this._timeAxisWidget.rightStub());
			stub.drawBitmap(ensureNotNull(ctx), targetX, targetY);
		};

		// draw time scale and stubs
		if (this._options.timeScale.visible) {
			const timeAxisBitmapSize = this._timeAxisWidget.getBitmapSize();

			if (ctx !== null) {
				let targetX = 0;
				if (this._isLeftAxisVisible()) {
					drawStub('left', targetX, totalHeight);
					targetX = ensureNotNull(firstPane.leftPriceAxisWidget()).getBitmapSize().width;
				}

				this._timeAxisWidget.drawBitmap(ctx, targetX, totalHeight);
				targetX += timeAxisBitmapSize.width;

				if (this._isRightAxisVisible()) {
					drawStub('right', targetX, totalHeight);
				}
			}

			totalHeight += timeAxisBitmapSize.height;
		}

		return size({
			width: totalWidth,
			height: totalHeight,
		});
	}

	// eslint-disable-next-line complexity
	private _adjustSizeImpl(): void {
		let totalStretch = 0;
		let leftPriceAxisWidth = 0;
		let rightPriceAxisWidth = 0;

		for (const paneWidget of this._paneWidgets) {
			if (this._isLeftAxisVisible()) {
				leftPriceAxisWidth = Math.max(leftPriceAxisWidth, ensureNotNull(paneWidget.leftPriceAxisWidget()).optimalWidth());
			}
			if (this._isRightAxisVisible()) {
				rightPriceAxisWidth = Math.max(rightPriceAxisWidth, ensureNotNull(paneWidget.rightPriceAxisWidget()).optimalWidth());
			}

			totalStretch += paneWidget.stretchFactor();
		}

		const width = this._width;
		const height = this._height;

		const paneWidth = Math.max(width - leftPriceAxisWidth - rightPriceAxisWidth, 0);

		// const separatorCount = this._paneSeparators.length;
		// const separatorHeight = SEPARATOR_HEIGHT;
		const separatorsHeight = 0; // separatorHeight * separatorCount;
		const timeAxisVisible = this._options.timeScale.visible;
		let timeAxisHeight = timeAxisVisible ? this._timeAxisWidget.optimalHeight() : 0;
		// TODO: Fix it better
		// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
		if (timeAxisHeight % 2) {
			timeAxisHeight += 1;
		}
		const otherWidgetHeight = separatorsHeight + timeAxisHeight;
		const totalPaneHeight = height < otherWidgetHeight ? 0 : height - otherWidgetHeight;
		const stretchPixels = totalPaneHeight / totalStretch;

		let accumulatedHeight = 0;
		for (let paneIndex = 0; paneIndex < this._paneWidgets.length; ++paneIndex) {
			const paneWidget = this._paneWidgets[paneIndex];
			paneWidget.setState(this._model.panes()[paneIndex]);

			let paneHeight = 0;
			let calculatePaneHeight = 0;

			if (paneIndex === this._paneWidgets.length - 1) {
				calculatePaneHeight = totalPaneHeight - accumulatedHeight;
			} else {
				calculatePaneHeight = Math.round(paneWidget.stretchFactor() * stretchPixels);
			}

			paneHeight = Math.max(calculatePaneHeight, 2);

			accumulatedHeight += paneHeight;

			paneWidget.setSize(size({ width: paneWidth, height: paneHeight }));
			if (this._isLeftAxisVisible()) {
				paneWidget.setPriceAxisSize(leftPriceAxisWidth, 'left');
			}
			if (this._isRightAxisVisible()) {
				paneWidget.setPriceAxisSize(rightPriceAxisWidth, 'right');
			}

			if (paneWidget.state()) {
				this._model.setPaneHeight(paneWidget.state(), paneHeight);
			}
		}

		this._timeAxisWidget.setSizes(
			size({ width: timeAxisVisible ? paneWidth : 0, height: timeAxisHeight }),
			timeAxisVisible ? leftPriceAxisWidth : 0,
			timeAxisVisible ? rightPriceAxisWidth : 0
		);

		this._model.setWidth(paneWidth);
		if (this._leftPriceAxisWidth !== leftPriceAxisWidth) {
			this._leftPriceAxisWidth = leftPriceAxisWidth;
		}
		if (this._rightPriceAxisWidth !== rightPriceAxisWidth) {
			this._rightPriceAxisWidth = rightPriceAxisWidth;
		}
	}

	private _setMouseWheelEventListener(add: boolean): void {
		if (add) {
			this._element.addEventListener('wheel', this._onWheelBound, { passive: false });
			return;
		}
		this._element.removeEventListener('wheel', this._onWheelBound);
	}

	private _determineWheelSpeedAdjustment(event: WheelEvent): number {
		switch (event.deltaMode) {
			case event.DOM_DELTA_PAGE:
				// one screen at time scroll mode
				return 120;
			case event.DOM_DELTA_LINE:
				// one line at time scroll mode
				return 32;
		}

		if (!windowsChrome) {
			return 1;
		}

		// Chromium on Windows has a bug where the scroll speed isn't correctly
		// adjusted for high density displays. We need to correct for this so that
		// scroll speed is consistent between browsers.
		// https://bugs.chromium.org/p/chromium/issues/detail?id=1001735
		// https://bugs.chromium.org/p/chromium/issues/detail?id=1207308
		return (1 / window.devicePixelRatio);
	}

	private _onMousewheel(event: WheelEvent): void {
		if ((event.deltaX === 0 || !this._options.handleScroll.mouseWheel) &&
			(event.deltaY === 0 || !this._options.handleScale.mouseWheel)) {
			return;
		}

		const scrollSpeedAdjustment = this._determineWheelSpeedAdjustment(event);

		const deltaX = scrollSpeedAdjustment * event.deltaX / 100;
		const deltaY = -(scrollSpeedAdjustment * event.deltaY / 100);

		if (event.cancelable) {
			event.preventDefault();
		}

		if (deltaY !== 0 && this._options.handleScale.mouseWheel) {
			const zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
			const scrollPosition = event.clientX - this._element.getBoundingClientRect().left;
			this.model().zoomTime(scrollPosition as Coordinate, zoomScale);
		}

		if (deltaX !== 0 && this._options.handleScroll.mouseWheel) {
			this.model().scrollChart(deltaX * -80 as Coordinate); // 80 is a made up coefficient, and minus is for the "natural" scroll
		}
	}

	private _drawImpl(invalidateMask: InvalidateMask, time: number): void {
		const invalidationType = invalidateMask.fullInvalidation();

		// actions for full invalidation ONLY (not shared with light)
		if (invalidationType === InvalidationLevel.Full) {
			this._updateGui();
		}

		// light or full invalidate actions
		if (
			invalidationType === InvalidationLevel.Full ||
			invalidationType === InvalidationLevel.Light
		) {
			this._applyMomentaryAutoScale(invalidateMask);
			this._applyTimeScaleInvalidations(invalidateMask, time);

			this._timeAxisWidget.update();
			this._paneWidgets.forEach((pane: PaneWidget) => {
				pane.updatePriceAxisWidgets();
			});

			// In the case a full invalidation has been postponed during the draw, reapply
			// the timescale invalidations. A full invalidation would mean there is a change
			// in the timescale width (caused by price scale changes) that needs to be drawn
			// right away to avoid flickering.
			if (this._invalidateMask?.fullInvalidation() === InvalidationLevel.Full) {
				this._invalidateMask.merge(invalidateMask);

				this._updateGui();

				this._applyMomentaryAutoScale(this._invalidateMask);
				this._applyTimeScaleInvalidations(this._invalidateMask, time);

				invalidateMask = this._invalidateMask;
				this._invalidateMask = null;
			}
		}

		this.paint(invalidateMask);
	}

	private _applyTimeScaleInvalidations(invalidateMask: InvalidateMask, time: number): void {
		for (const tsInvalidation of invalidateMask.timeScaleInvalidations()) {
			this._applyTimeScaleInvalidation(tsInvalidation, time);
		}
	}

	private _applyMomentaryAutoScale(invalidateMask: InvalidateMask): void {
		const panes = this._model.panes();
		for (let i = 0; i < panes.length; i++) {
			if (invalidateMask.invalidateForPane(i).autoScale) {
				panes[i].momentaryAutoScale();
			}
		}
	}

	private _applyTimeScaleInvalidation(invalidation: TimeScaleInvalidation, time: number): void {
		const timeScale = this._model.timeScale();
		switch (invalidation.type) {
			case TimeScaleInvalidationType.FitContent:
				timeScale.fitContent();
				break;
			case TimeScaleInvalidationType.ApplyRange:
				timeScale.setLogicalRange(invalidation.value);
				break;
			case TimeScaleInvalidationType.ApplyBarSpacing:
				timeScale.setBarSpacing(invalidation.value);
				break;
			case TimeScaleInvalidationType.ApplyRightOffset:
				timeScale.setRightOffset(invalidation.value);
				break;
			case TimeScaleInvalidationType.Reset:
				timeScale.restoreDefault();
				break;
			case TimeScaleInvalidationType.Animation:
				if (!invalidation.value.finished(time)) {
					timeScale.setRightOffset(invalidation.value.getPosition(time));
				}
				break;
		}
	}

	private _invalidateHandler(invalidateMask: InvalidateMask): void {
		if (this._invalidateMask !== null) {
			this._invalidateMask.merge(invalidateMask);
		} else {
			this._invalidateMask = invalidateMask;
		}

		if (!this._drawPlanned) {
			this._drawPlanned = true;
			this._drawRafId = window.requestAnimationFrame((time: number) => {
				this._drawPlanned = false;
				this._drawRafId = 0;

				if (this._invalidateMask !== null) {
					const mask = this._invalidateMask;
					this._invalidateMask = null;
					this._drawImpl(mask, time);

					for (const tsInvalidation of mask.timeScaleInvalidations()) {
						if (tsInvalidation.type === TimeScaleInvalidationType.Animation && !tsInvalidation.value.finished(time)) {
							this.model().setTimeScaleAnimation(tsInvalidation.value);
							break;
						}
					}
				}
			});
		}
	}

	private _updateGui(): void {
		this._syncGuiWithModel();
	}

	// private _destroySeparator(separator: PaneSeparator): void {
	// 	this._tableElement.removeChild(separator.getElement());
	// 	separator.destroy();
	// }

	private _syncGuiWithModel(): void {
		const panes = this._model.panes();
		const targetPaneWidgetsCount = panes.length;
		const actualPaneWidgetsCount = this._paneWidgets.length;

		// Remove (if needed) pane widgets and separators
		for (let i = targetPaneWidgetsCount; i < actualPaneWidgetsCount; i++) {
			const paneWidget = ensureDefined(this._paneWidgets.pop());
			this._tableElement.removeChild(paneWidget.getElement());
			paneWidget.clicked().unsubscribeAll(this);
			paneWidget.destroy();

			// const paneSeparator = this._paneSeparators.pop();
			// if (paneSeparator !== undefined) {
			// 	this._destroySeparator(paneSeparator);
			// }
		}

		// Create (if needed) new pane widgets and separators
		for (let i = actualPaneWidgetsCount; i < targetPaneWidgetsCount; i++) {
			const paneWidget = new PaneWidget(this, panes[i]);
			paneWidget.clicked().subscribe(this._onPaneWidgetClicked.bind(this), this);

			this._paneWidgets.push(paneWidget);

			// create and insert separator
			// if (i > 1) {
			// 	const paneSeparator = new PaneSeparator(this, i - 1, i, true);
			// 	this._paneSeparators.push(paneSeparator);
			// 	this._tableElement.insertBefore(paneSeparator.getElement(), this._timeAxisWidget.getElement());
			// }

			// insert paneWidget
			this._tableElement.insertBefore(paneWidget.getElement(), this._timeAxisWidget.getElement());
		}

		for (let i = 0; i < targetPaneWidgetsCount; i++) {
			const state = panes[i];
			const paneWidget = this._paneWidgets[i];
			if (paneWidget.state() !== state) {
				paneWidget.setState(state);
			} else {
				paneWidget.updatePriceAxisWidgetsStates();
			}
		}

		this._updateTimeAxisVisibility();
		this._adjustSizeImpl();
	}

	private _getMouseEventParamsImpl(
		index: TimePointIndex | null,
		point: Point | null,
		event: TouchMouseEventData | null
	): MouseEventParamsImpl {
		const seriesData = new Map<Series, SeriesPlotRow>();
		if (index !== null) {
			const serieses = this._model.serieses();
			serieses.forEach((s: Series) => {
				// TODO: replace with search left
				const data = s.bars().search(index);
				if (data !== null) {
					seriesData.set(s, data);
				}
			});
		}
		let clientTime: OriginalTime | undefined;
		if (index !== null) {
			const timePoint = this._model.timeScale().indexToTimeScalePoint(index)?.originalTime;
			if (timePoint !== undefined) {
				clientTime = timePoint;
			}
		}

		const hoveredSource = this.model().hoveredSource();

		const hoveredSeries = hoveredSource !== null && hoveredSource.source instanceof Series
			? hoveredSource.source
			: undefined;

		const hoveredObject = hoveredSource !== null && hoveredSource.object !== undefined
			? hoveredSource.object.externalId
			: undefined;

		return {
			time: clientTime,
			index: index ?? undefined,
			point: point ?? undefined,
			hoveredSeries,
			seriesData,
			hoveredObject,
			touchMouseEventData: event ?? undefined,
		};
	}

	private _onPaneWidgetClicked(
		time: TimePointIndex | null,
		point: Point | null,
		event: TouchMouseEventData
	): void {
		this._clicked.fire(() => this._getMouseEventParamsImpl(time, point, event));
	}

	private _onPaneWidgetCrosshairMoved(
		time: TimePointIndex | null,
		point: Point | null,
		event: TouchMouseEventData | null
	): void {
		this._crosshairMoved.fire(() => this._getMouseEventParamsImpl(time, point, event));
	}

	private _updateTimeAxisVisibility(): void {
		const display = this._options.timeScale.visible ? '' : 'none';
		this._timeAxisWidget.getElement().style.display = display;
	}

	private _isLeftAxisVisible(): boolean {
		return this._paneWidgets[0].state().leftPriceScale().options().visible;
	}

	private _isRightAxisVisible(): boolean {
		return this._paneWidgets[0].state().rightPriceScale().options().visible;
	}
}

function disableSelection(element: HTMLElement): void {
	element.style.userSelect = 'none';
	// eslint-disable-next-line deprecation/deprecation
	element.style.webkitUserSelect = 'none';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
	(element.style as any).msUserSelect = 'none';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
	(element.style as any).MozUserSelect = 'none';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
	(element.style as any).webkitTapHighlightColor = 'transparent';
}

function shouldSubscribeMouseWheel(options: ChartOptionsInternal): boolean {
	return Boolean(options.handleScroll.mouseWheel || options.handleScale.mouseWheel);
}
