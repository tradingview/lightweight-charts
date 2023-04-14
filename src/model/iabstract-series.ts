import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { AbstractData, WhitespaceData } from '../api/data-consumer';

import { Coordinate } from './coordinate';
import { AbstractSeriesOptions } from './series-options';
import { Range } from './time-data';

/**
 * Renderer data for an item within the abstract series.
 */
export interface AbstractBarItemData<
	TData extends AbstractData | WhitespaceData = AbstractData | WhitespaceData
> {
	/**
	 * Horizontal coordinate for the item. Measured from the left edge of the pane in pixels.
	 */
	x: number;
	/**
	 * Time scale index for the item. This isn't the timestamp but rather the logical index.
	 */
	time: number;
	/**
	 * Original data for the item.
	 */
	originalData: TData;
	/**
	 * Color assigned for the item, typically used for price line and price scale label.
	 */
	barColor: string;
}

/**
 * Data provide to the abstract series pane view which can be used within the renderer
 * for drawing the series data.
 */
export interface PaneRendererAbstractData<
	TData extends AbstractData | WhitespaceData
> {
	/**
	 * List of all the series' items and their x coordinates.
	 */
	bars: readonly AbstractBarItemData<TData>[];
	/**
	 * Spacing between consecutive bars.
	 */
	barSpacing: number;
	/**
	 * The current visible range of items on the chart.
	 */
	visibleRange: Range<number> | null;
}

/**
 * Converter function for changing prices into vertical coordinate values.
 *
 * This is provided as a convenience function since the series original data will most likely be defined
 * in price values, and the renderer needs to draw with coordinates. This returns the same values as
 * directly using the series' priceToCoordinate method.
 */
export type PriceToCoordinateConverter = (price: number) => Coordinate | null;

/**
 * Renderer for the abstract series. This paints on the main chart pane.
 */
export interface IAbstractSeriesPaneRenderer {
	/**
	 * Draw function for the renderer.
	 *
	 * @param target - canvas context to draw on, refer to FancyCanvas library for more details about this class.
	 * @param priceConverter - converter function for changing prices into vertical coordinate values.
	 * @param isHovered - Whether the series is hovered.
	 * @param hitTestData - Optional hit test data for the series.
	 */
	draw(
		target: CanvasRenderingTarget2D,
		priceConverter: PriceToCoordinateConverter,
		isHovered: boolean,
		hitTestData?: unknown
	): void;
	// hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null;
}

/**
 * OHLC equivalent values for the custom series.
 *
 * The order of items is defined as follows:
 *
 * - open
 * - high
 * - low
 * - close
 */
export type AbstractSeriesPricePlotValues = [number, number, number, number];

/**
 * This interface represents the view for the custom series
 */
export interface IAbstractSeriesPaneView<
	TData extends AbstractData | WhitespaceData = AbstractData | WhitespaceData,
	TSeriesOptions extends AbstractSeriesOptions = AbstractSeriesOptions
> {
	/**
	 * This method returns a renderer - special object to draw data for the series
	 * on the main chart pane.
	 *
	 * @returns an renderer object to be used for drawing.
	 */
	renderer(): IAbstractSeriesPaneRenderer;

	/**
	 * This method will be called with the latest data for the renderer to use
	 * during the next paint.
	 */
	update(
		data: PaneRendererAbstractData<TData>,
		seriesOptions: TSeriesOptions
	): void;

	/**
	 * A function for interpreting the custom series data and returning an array of numbers
	 * representing the open, high, low, close values for the item. These OHLC values are used
	 * by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair
	 * and price line positions. Use the high and low values to specify the visible range of the painted item,
	 * and the close value for the crosshair and price line position.
	 */
	priceValueBuilder(plotRow: TData): AbstractSeriesPricePlotValues;

	/**
	 * Default options
	 */
	defaultOptions(): TSeriesOptions;
}
