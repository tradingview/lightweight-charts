import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { type IChartApi } from '../api/ichart-api';
import { type ISeriesApi } from '../api/iseries-api';

import { type SeriesType } from './series-options';

/**
 * This interface represents a label on the price or time axis
 */
export interface ISeriesPrimitiveAxisView {
	/**
	 * coordinate of the label. For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.
	 *
	 * @returns coordinate. distance from top for price axis, or distance from left for time axis.	 *
	 */
	coordinate(): number;
	/**
	 * @returns text of the label
	 */
	text(): string;

	/**
	 * @returns text color of the label
	 */
	textColor(): string;

	/**
	 * @returns background color of the label
	 */
	backColor(): string;
}

/**
 * This interface represents rendering some element on the canvas
 */
export interface ISeriesPrimitivePaneRenderer {
	/**
	 * Method to draw main content of the element
	 *
	 * @param target - canvas context to draw on, refer to FancyCanvas library for more details about this class
	 *
	 */
	draw(target: CanvasRenderingTarget2D): void;

	/**
	 * Optional method to draw the background.
	 * Some elements could implement this method to draw on the background of the chart.
	 * Usually this is some kind of watermarks or time areas highlighting.
	 *
	 * @param target - canvas context to draw on, refer FancyCanvas library for more details about this class
	 */
	drawBackground?(target: CanvasRenderingTarget2D): void;
}

/**
 * This interface represents the primitive in the main area of the chart
 */
export interface ISeriesPrimitivePaneView {
	/**
	 * This method returns a renderer - special object to draw data
	 *
	 * @returns an renderer object to be used for drawing, or `null` if we have nothing to draw.
	 */
	renderer(): ISeriesPrimitivePaneRenderer | null;
}

/**
 * Base interface for series primitives. It must be implemented to add some external graphics to series
 */
export interface ISeriesPrimitive {
	/**
	 * This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data
	 */
	updateAllViews(): void;

	/**
	 * Returns array of labels to be drawn on the price axis used by the series
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitiveAxisView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	priceAxisViews(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of labels to be drawn on the time axis
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitiveAxisView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	timeAxisViews(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of objects representing primitive in the main area of the chart
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitivePaneView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	paneViews(): readonly ISeriesPrimitivePaneView[];

	/**
	 * Attached Lifecycle hook.
	 *
	 * @param chart - Chart instance
	 * @param series - Series to which the Primitive is attached
	 * @param requestUpdate - Request an update (redraw the chart)
	 * @returns void
	 */
	attached?: (chart: IChartApi, series: ISeriesApi<SeriesType>, requestUpdate: () => void) => void;
	/**
	 * Detached Lifecycle hook.
	 *
	 * @returns void
	 */
	detached?: () => void;
}
