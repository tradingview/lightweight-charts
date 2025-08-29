import { IWebGLPaneContext } from './types';

export interface CustomWebGLSeriesOptions {
	zOrder?: 'belowOverlays' | 'aboveOverlays';
	antialias?: boolean;
	premultipliedAlpha?: boolean;
	/** Optional intra-GL-layer draw order. Higher draws later. Default 0 */
	order?: number;
	/** Optional CPU hit-test threshold in CSS pixels (default 6) */
	hitTestThresholdPx?: number;
	/** Optional z-order priority for hit-test picking */
	hitTestZOrder?: 'top' | 'normal' | 'bottom';
	/** Optional cursor style to use when hovered */
	hitTestCursorStyle?: string;
}

export interface ICustomWebGLSeriesPaneView<TOptions extends CustomWebGLSeriesOptions = CustomWebGLSeriesOptions> {
	onInit(context: IWebGLPaneContext, options: Readonly<TOptions>): void;
	onRender(context: IWebGLPaneContext): void;
	onUpdate?(context: IWebGLPaneContext, options: Readonly<Partial<TOptions>>): void;
	onDestroy?(): void;
}

export interface IGLSeriesApi<TOptions extends CustomWebGLSeriesOptions = CustomWebGLSeriesOptions> {
  /** Remove the GL series from the chart and free resources */
	remove(): void;
  /** Apply partial options to the series */
	applyOptions(options: Partial<TOptions>): void;
}

