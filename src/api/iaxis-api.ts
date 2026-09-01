import { AxisMouseEventHandler } from '../model/axis-model';

export interface IAxisApi {
	/**
	 * Subscribe to the axis click event.
	 *
	 * @param handler - Handler to be called on mouse click.
	 * @example
	 * ```js
	 * function myClickHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Click at ${param.point.x}, ${param.point.y}.`);
	 * }
	 *
	 * chart.timeScale().subscribeClick(myClickHandler);
	 * ```
	 */
	subscribeClick(handler: AxisMouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeClick}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.timeScale().unsubscribeClick(myClickHandler);
	 * ```
	 */
	unsubscribeClick(handler: AxisMouseEventHandler): void;

	/**
	 * Subscribe to the axis mouse move event.
	 *
	 * @param handler - Handler to be called on mouse move.
	 * @example
	 * ```js
	 * function myMoveHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Mouse at ${param.point.x}, ${param.point.y}.`);
	 * }
	 *
	 * chart.timeScale().subscribeMouseMove(myMoveHandler);
	 * ```
	 */
	subscribeMouseMove(handler: AxisMouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeMouseMove}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.timeScale().unsubscribeMouseMove(myMoveHandler);
	 * ```
	 */
	unsubscribeMouseMove(handler: AxisMouseEventHandler): void;

	/**
	 * CSS cursor style as defined here: [MDN: CSS Cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) or `undefined`
	 * if you want the library to use the default cursor style instead.
	 */
	overrideCursorStyle(cursor: string | undefined): void;
}
