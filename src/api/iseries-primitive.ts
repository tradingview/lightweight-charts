import { CanvasRenderingTarget2D } from "fancy-canvas";

/**
 * This interface represents a label on the price or time axis
 */
export interface ISeriesPrimitiveAxisView {
	/**
	 * coordiate of the label, vertical for price axis and horizontal for time axis
	 *
	 * @returns coordinate. 0 means left and top
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
	 * @param target - cavnas context to draw on, refer FancyCanvas library for more details about this class
	 *
	 */
	draw(target: CanvasRenderingTarget2D): void;

	/**
	 * Optional method to draw the background.
	 * Some elements could implement this method to draw on the background of the chart
	 * Usually this is some kind of watermarks or time areas highlighting
	 *
	 * @param target - cavnas context to draw on, refer FancyCanvas library for more details about this class
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
	 * @returns an renderer object to be used for drawing or null if we have nothin to draw
	 */
	renderer(): ISeriesPrimitivePaneRenderer | null;
}

/**
 * Base interface for series primitives. It must be implemented to add some external graphics to series
 */
export interface ISeriesPrimitive {
	/**
	 * This method is called when viewport has been changed, so primitive have to reacalculate/invaildate its data
	 */
	updateAllViews(): void;

	/**
	 * Returns array of labels to be drawn on the price axis used by the series
	 *
	 * @returns array of objects; each of then must impement ISeriesPrimitiveAxisView interface
	 *
	 * Try to implement this method returning the same array if nothing changed, this would help the library to save memory and CPU
	 */
	priceAxisViews(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of labels to be drawn on the time axis
	 *
	 * @returns array of objects; each of then must impement ISeriesPrimitiveAxisView interface
	 *
	 * Try to implement this method returning the same array if nothing changed, this would help the library to save memory and CPU
	 */
	timeAxisViews(): readonly ISeriesPrimitiveAxisView[];

	/**
	 * Returns array of objects representing primitive in the main area of the chart
	 *
	 * @returns array of objects; each of then must impement ISeriesPrimitivePaneView interface
	 *
	 * Try to implement this method returning the same array if nothing changed, this would help the library to save memory and CPU
	 */
	paneViews(): readonly ISeriesPrimitivePaneView[];
}
