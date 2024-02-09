import { IDestroyable } from '../helpers/idestroyable';
import { IChartWidgetBase } from './chart-widget';
export declare const SEPARATOR_HEIGHT = 1;
export declare class PaneSeparator implements IDestroyable {
    private readonly _chartWidget;
    private readonly _rowElement;
    private readonly _cell;
    private readonly _handle;
    private readonly _mouseEventHandler;
    private readonly _paneA;
    private readonly _paneB;
    private _startY;
    private _deltaY;
    private _totalHeight;
    private _totalStretch;
    private _minPaneHeight;
    private _maxPaneHeight;
    private _pixelStretchFactor;
    constructor(chartWidget: IChartWidgetBase, topPaneIndex: number, bottomPaneIndex: number, disableResize: boolean);
    destroy(): void;
    getElement(): HTMLElement;
    update(): void;
    private _updateBorderColor;
    private _mouseDownEvent;
    private _pressedMouseMoveEvent;
    private _mouseUpEvent;
}
