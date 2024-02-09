import { Size } from 'fancy-canvas';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial } from '../helpers/strict-type-checks';
import { ChartModel, ChartOptionsInternal, ChartOptionsInternalBase, IChartModelBase } from '../model/chart-model';
import { DefaultPriceScaleId } from '../model/default-price-scale';
import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';
import { InvalidateMask } from '../model/invalidate-mask';
import { Point } from '../model/point';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import { SeriesType } from '../model/series-options';
import { TimePointIndex } from '../model/time-data';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';
import { PaneWidget } from './pane-widget';
import { TimeAxisWidget } from './time-axis-widget';
export interface MouseEventParamsImpl {
    originalTime?: unknown;
    index?: TimePointIndex;
    point?: Point;
    seriesData: Map<Series<SeriesType>, SeriesPlotRow<SeriesType>>;
    hoveredSeries?: Series<SeriesType>;
    hoveredObject?: string;
    touchMouseEventData?: TouchMouseEventData;
}
export type MouseEventParamsImplSupplier = () => MouseEventParamsImpl;
export interface IChartWidgetBase {
    getPriceAxisWidth(position: DefaultPriceScaleId): number;
    model(): IChartModelBase;
    paneWidgets(): PaneWidget[];
    options(): ChartOptionsInternalBase;
    setCursorStyle(style: string | null): void;
}
export declare class ChartWidget<HorzScaleItem> implements IDestroyable, IChartWidgetBase {
    private readonly _options;
    private _paneWidgets;
    private readonly _model;
    private _drawRafId;
    private _height;
    private _width;
    private _leftPriceAxisWidth;
    private _rightPriceAxisWidth;
    private _element;
    private readonly _tableElement;
    private _timeAxisWidget;
    private _invalidateMask;
    private _drawPlanned;
    private _clicked;
    private _dblClicked;
    private _crosshairMoved;
    private _onWheelBound;
    private _observer;
    private _container;
    private _cursorStyleOverride;
    private readonly _horzScaleBehavior;
    constructor(container: HTMLElement, options: ChartOptionsInternal<HorzScaleItem>, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>);
    model(): ChartModel<HorzScaleItem>;
    options(): Readonly<ChartOptionsInternal<HorzScaleItem>>;
    paneWidgets(): PaneWidget[];
    timeAxisWidget(): TimeAxisWidget<HorzScaleItem>;
    destroy(): void;
    resize(width: number, height: number, forceRepaint?: boolean): void;
    paint(invalidateMask?: InvalidateMask): void;
    applyOptions(options: DeepPartial<ChartOptionsInternal<HorzScaleItem>>): void;
    clicked(): ISubscription<MouseEventParamsImplSupplier>;
    dblClicked(): ISubscription<MouseEventParamsImplSupplier>;
    crosshairMoved(): ISubscription<MouseEventParamsImplSupplier>;
    takeScreenshot(): HTMLCanvasElement;
    getPriceAxisWidth(position: DefaultPriceScaleId): number;
    autoSizeActive(): boolean;
    element(): HTMLDivElement;
    setCursorStyle(style: string | null): void;
    getCursorOverrideStyle(): string | null;
    paneSize(): Size;
    private _applyAutoSizeOptions;
    /**
     * Traverses the widget's layout (pane and axis child widgets),
     * draws the screenshot (if rendering context is passed) and returns the screenshot bitmap size
     *
     * @param ctx - if passed, used to draw the screenshot of widget
     * @returns screenshot bitmap size
     */
    private _traverseLayout;
    private _adjustSizeImpl;
    private _setMouseWheelEventListener;
    private _determineWheelSpeedAdjustment;
    private _onMousewheel;
    private _drawImpl;
    private _applyTimeScaleInvalidations;
    private _applyMomentaryAutoScale;
    private _applyTimeScaleInvalidation;
    private _invalidateHandler;
    private _updateGui;
    private _syncGuiWithModel;
    private _getMouseEventParamsImpl;
    private _onPaneWidgetClicked;
    private _onPaneWidgetDblClicked;
    private _onPaneWidgetCrosshairMoved;
    private _updateTimeAxisVisibility;
    private _isLeftAxisVisible;
    private _isRightAxisVisible;
    private _installObserver;
    private _uninstallObserver;
}
