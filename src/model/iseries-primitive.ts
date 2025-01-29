import { IPrimitivePaneView, PrimitiveHoveredItem } from './ipane-primitive';
import { AutoscaleInfo } from './series-options';
import { Logical } from './time-data';

/**
 * This interface represents a label on the price or time axis
 */
export interface ISeriesPrimitiveAxisView {
	/**
	 * The desired coordinate for the label. Note that the label will be automatically moved to prevent overlapping with other labels. If you would like the label to be drawn at the
	 * exact coordinate under all circumstances then rather use `fixedCoordinate`.
	 * For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.
	 *
	 * @returns coordinate. distance from top for price axis, or distance from left for time axis.
	 */
	coordinate(): number;

	/**
	 * fixed coordinate of the label. A label with a fixed coordinate value will always be drawn at the specified coordinate and will appear above any 'unfixed' labels. If you supply
	 * a fixed coordinate then you should return a large negative number for `coordinate` so that the automatic placement of unfixed labels doesn't leave a blank space for this label.
	 * For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.
	 *
	 * @returns coordinate. distance from top for price axis, or distance from left for time axis.
	 */
	fixedCoordinate?(): number | undefined;

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

	/**
	 * @returns whether the label should be visible (default: `true`)
	 */
	visible?(): boolean;

	/**
	 * @returns whether the tick mark line should be visible (default: `true`)
	 */
	tickVisible?(): boolean;
}

/**
 * Base interface for series primitives. It must be implemented to add some external graphics to series
 */
export interface ISeriesPrimitiveBase<TSeriesAttachedParameters = unknown> {
	/**
	 * This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data
	 */
	updateAllViews?(): void;

	/**
	 * Returns array of labels to be drawn on the price axis used by the series
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitiveAxisView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	priceAxisViews?(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of labels to be drawn on the time axis
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitiveAxisView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	timeAxisViews?(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of objects representing primitive in the main area of the chart
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitivePaneView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	paneViews?(): readonly IPrimitivePaneView[];

	/**
	 * Returns array of objects representing primitive in the price axis area of the chart
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitivePaneView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	priceAxisPaneViews?(): readonly IPrimitivePaneView[];

	/**
	 * Returns array of objects representing primitive in the time axis area of the chart
	 *
	 * @returns array of objects; each of then must implement ISeriesPrimitivePaneView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	timeAxisPaneViews?(): readonly IPrimitivePaneView[];

	/**
	 * Return autoscaleInfo which will be merged with the series base autoscaleInfo. You can use this to expand the autoscale range
	 * to include visual elements drawn outside of the series' current visible price range.
	 *
	 * **Important**: Please note that this method will be evoked very often during scrolling and zooming of the chart, thus it
	 * is recommended that this method is either simple to execute, or makes use of optimisations such as caching to ensure that
	 * the chart remains responsive.
	 *
	 * @param startTimePoint - start time point for the current visible range
	 * @param endTimePoint - end time point for the current visible range
	 * @returns AutoscaleInfo
	 */
	autoscaleInfo?(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null;

	/**
	 * Attached Lifecycle hook.
	 *
	 * @param param - An object containing useful references for the attached primitive to use.
	 * @returns void
	 */
	attached?(param: TSeriesAttachedParameters): void;
	/**
	 * Detached Lifecycle hook.
	 *
	 * @returns void
	 */
	detached?(): void;

	/**
	 * Hit test method which will be called by the library when the cursor is moved.
	 * Use this to register object ids being hovered for use within the crosshairMoved
	 * and click events emitted by the chart. Additionally, the hit test result can
	 * specify a preferred cursor type to display for the main chart pane. This method
	 * should return the top most hit for this primitive if more than one object is
	 * being intersected.
	 *
	 * @param x - x Coordinate of mouse event
	 * @param y - y Coordinate of mouse event
	 */
	hitTest?(x: number, y: number): PrimitiveHoveredItem | null;
}
