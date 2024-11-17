import { HorzAlign, VertAlign } from '../renderers/watermark-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { IChartModelBase } from './chart-model';
import { DataSource } from './data-source';
/** Watermark options. */
export interface WatermarkOptions {
    /**
     * Watermark color.
     *
     * @defaultValue `'rgba(0, 0, 0, 0)'`
     */
    color: string;
    /**
     * Display the watermark.
     *
     * @defaultValue `false`
     */
    visible: boolean;
    /**
     * Text of the watermark. Word wrapping is not supported.
     *
     * @defaultValue `''`
     */
    text: string;
    /**
     * Font size in pixels.
     *
     * @defaultValue `48`
     */
    fontSize: number;
    /**
     * Font family.
     *
     * @defaultValue `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`
     */
    fontFamily: string;
    /**
     * Font style.
     *
     * @defaultValue `''`
     */
    fontStyle: string;
    /**
     * Horizontal alignment inside the chart area.
     *
     * @defaultValue `'center'`
     */
    horzAlign: HorzAlign;
    /**
     * Vertical alignment inside the chart area.
     *
     * @defaultValue `'center'`
     */
    vertAlign: VertAlign;
}
export declare class Watermark extends DataSource {
    private readonly _paneView;
    private readonly _options;
    constructor(model: IChartModelBase, options: WatermarkOptions);
    priceAxisViews(): readonly IPriceAxisView[];
    paneViews(): readonly IPaneView[];
    options(): Readonly<WatermarkOptions>;
    updateAllViews(): void;
}
