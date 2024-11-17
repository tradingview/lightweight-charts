import { IChartWidgetBase } from './chart-widget';
export declare class AttributionLogoWidget {
    private readonly _chart;
    private readonly _container;
    private _element;
    private _cssElement;
    private _theme;
    private _visible;
    constructor(container: HTMLElement, chart: IChartWidgetBase);
    update(): void;
    removeElement(): void;
    private _shouldUpdate;
    private _themeToUse;
    private _shouldBeVisible;
    private _getUTMSource;
    private _render;
}
