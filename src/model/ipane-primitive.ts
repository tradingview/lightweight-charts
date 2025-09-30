import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { LineStyle } from '../renderers/draw-line';

/**
 * This interface represents rendering some element on the canvas
 */
export interface IPrimitivePaneRenderer {
	/**
	 * Method to draw main content of the element
	 *
	 * @param target - canvas context to draw on, refer to FancyCanvas library for more details about this class
	 * @param utils - exposes drawing utilities (such as setLineStyle) from the library to plugins
	 *
	 */
	draw(target: CanvasRenderingTarget2D, utils?: DrawingUtils): void;

	/**
	 * Optional method to draw the background.
	 * Some elements could implement this method to draw on the background of the chart.
	 * Usually this is some kind of watermarks or time areas highlighting.
	 *
	 * @param target - canvas context to draw on, refer FancyCanvas library for more details about this class
	 * @param utils - exposes drawing utilities (such as setLineStyle) from the library to plugins
	 */
	drawBackground?(target: CanvasRenderingTarget2D, utils?: DrawingUtils): void;
}

/**
 * Defines where in the visual layer stack the renderer should be executed.
 *
 * - `bottom`: Draw below everything except the background.
 * - `normal`: Draw at the same level as the series.
 * - `top`: Draw above everything (including the crosshair).
 */
export type PrimitivePaneViewZOrder = 'bottom' | 'normal' | 'top';

/**
 * This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).
 */
export interface IPrimitivePaneView {
	/**
	 * Defines where in the visual layer stack the renderer should be executed. Default is `'normal'`.
	 *
	 * @returns the desired position in the visual layer stack. @see {@link PrimitivePaneViewZOrder}
	 */
	zOrder?(): PrimitivePaneViewZOrder;
	/**
	 * This method returns a renderer - special object to draw data
	 *
	 * @returns an renderer object to be used for drawing, or `null` if we have nothing to draw.
	 */
	renderer(): IPrimitivePaneRenderer | null;
}

/**
 * This interface represents rendering some element on the canvas
 */
export interface IPanePrimitivePaneRenderer extends IPrimitivePaneRenderer {}

/**
 * This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).
 */
export interface IPanePrimitivePaneView {
	/**
	 * Defines where in the visual layer stack the renderer should be executed. Default is `'normal'`.
	 *
	 * @returns the desired position in the visual layer stack. @see {@link PrimitivePaneViewZOrder}
	 */
	zOrder?(): PrimitivePaneViewZOrder;
	/**
	 * This method returns a renderer - special object to draw data
	 *
	 * @returns an renderer object to be used for drawing, or `null` if we have nothing to draw.
	 */
	renderer(): IPrimitivePaneRenderer | null;
}

/**
 * Data representing the currently hovered object from the Hit test.
 */
export interface PrimitiveHoveredItem {
	/**
	 * CSS cursor style as defined here: [MDN: CSS Cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) or `undefined`
	 * if you want the library to use the default cursor style instead.
	 */
	cursorStyle?: string;
	/**
	 * Hovered objects external ID. Can be used to identify the source item within a mouse subscriber event.
	 */
	externalId: string;
	/**
	 * The zOrder of the hovered item.
	 */
	zOrder: PrimitivePaneViewZOrder;
	/**
	 * Set to true if the object is rendered using `drawBackground` instead of `draw`.
	 */
	isBackground?: boolean;
}

/**
 * Base interface for series primitives. It must be implemented to add some external graphics to series
 */
export interface IPanePrimitiveBase<TPaneAttachedParameters = unknown> {
	/**
	 * This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data
	 */
	updateAllViews?(): void;

	/**
	 * Returns array of objects representing primitive in the main area of the chart
	 *
	 * @returns array of objects; each of then must implement IPrimitivePaneView interface
	 *
	 * For performance reasons, the lightweight library uses internal caches based on references to arrays
	 * So, this method must return new array if set of views has changed and should try to return the same array if nothing changed
	 */
	paneViews?(): readonly IPanePrimitivePaneView[];

	/**
	 * Attached Lifecycle hook.
	 *
	 * @param param - An object containing useful references for the attached primitive to use.
	 * @returns void
	 */
	attached?(param: TPaneAttachedParameters): void;
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

/**
 * Helper drawing utilities exposed by the library to a Primitive (a.k.a plugin).
 */
export interface DrawingUtils {
	/**
	 * Drawing utility to change the line style on the canvas context to one of the
	 * built-in line styles.
	 * @param ctx - 2D rendering context for the target canvas.
	 * @param lineStyle - Built-in {@link LineStyle} to set on the canvas context.
	 */
	readonly setLineStyle: (ctx: CanvasRenderingContext2D, lineStyle: LineStyle) => void;
}
