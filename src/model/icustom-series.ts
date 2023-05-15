import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { CustomData, WhitespaceData } from '../api/data-consumer';

import { Coordinate } from './coordinate';
import { CustomSeriesOptions } from './series-options';
import { Range } from './time-data';

/**
 * Renderer data for an item within the custom series.
 */
export interface CustomBarItemData<
	TData extends CustomData | WhitespaceData = CustomData | WhitespaceData
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
 * Data provide to the custom series pane view which can be used within the renderer
 * for drawing the series data.
 */
export interface PaneRendererCustomData<
	TData extends CustomData | WhitespaceData
> {
	/**
	 * List of all the series' items and their x coordinates.
	 */
	bars: readonly CustomBarItemData<TData>[];
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
 * Renderer for the custom series. This paints on the main chart pane.
 */
export interface ICustomSeriesPaneRenderer {
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
export type CustomSeriesPricePlotValues = [number, number, number, number];

/**
 * This interface represents the view for the custom series
 */
export interface ICustomSeriesPaneView<
	TData extends CustomData | WhitespaceData = CustomData | WhitespaceData,
	TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions
> {
	/**
	 * This method returns a renderer - special object to draw data for the series
	 * on the main chart pane.
	 *
	 * @returns an renderer object to be used for drawing.
	 */
	renderer(): ICustomSeriesPaneRenderer;

	/**
	 * This method will be called with the latest data for the renderer to use
	 * during the next paint.
	 */
	update(
		data: PaneRendererCustomData<TData>,
		seriesOptions: TSeriesOptions
	): void;

	/**
	 * A function for interpreting the custom series data and returning an array of numbers
	 * representing the open, high, low, close values for the item. These OHLC values are used
	 * by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair
	 * and price line positions. Use the high and low values to specify the visible range of the painted item,
	 * and the close value for the crosshair and price line position.
	 */
	priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues;

	/**
	 * Default options
	 */
	defaultOptions(): TSeriesOptions;

	/**
	 * This method will be evoked when the series has been removed from the chart. This method should be used to
	 * clean up any objects, references, and other items that could potentially cause memory leaks.
	 *
	 * This method should contain all the necessary code to clean up the object before it is removed from memory.
	 * This includes removing any event listeners or timers that are attached to the object, removing any references
	 * to other objects, and resetting any values or properties that were modified during the lifetime of the object.
	 */
	destroy?(): void;
}
