import { BoxOptions } from '../model/box-options';

/**
 * Represents the interface for interacting with boxes.
 */
export interface IBox {
	/**
	 * Apply options to the box.
	 *
	 * @param options - Any subset of options.
	 * @example
	 * ```js
	 * box.applyOptions({
	 *     corners: [
	 *         { time: 1641240000, price: 80 },
	 *         { time: 1641040000, price: 70 },
	 *     ],
	 *     lowPrice: 80.0,
	 *     highPrice: 90.0,
	 *     earlyTime: 1641240000, // 2022-01-03 20:00:00
	 *     lateTime: 1641250000, // 2022-01-03 22:46:40
	 *     borderColor: '#0ff',
	 *     borderWidth: 1,
	 *     borderStyle: LightweightCharts.LineStyle.Solid,
	 *     fillColor: '#0ff',
	 *     fillOpacity: 0.5,
	 *     borderVisible: true,
	 *     axisLabelVisible: false,
	 *     title: 'My box',
	 * });
	 * ```
	 */
	applyOptions(options: Partial<BoxOptions>): void;
	/**
	 * Get the currently applied options.
	 */
	options(): Readonly<BoxOptions>;
}