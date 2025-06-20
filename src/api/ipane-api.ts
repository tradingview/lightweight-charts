import { WhitespaceData } from '../model/data-consumer';
import { CustomData, ICustomSeriesPaneView } from '../model/icustom-series';
import { CustomSeriesOptions, SeriesPartialOptions, SeriesPartialOptionsMap, SeriesType } from '../model/series-options';
import { SeriesDefinition } from '../model/series/series-def';

import { IPanePrimitive } from './ipane-primitive-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';

/**
 * Represents the interface for interacting with a pane in a lightweight chart.
 */
export interface IPaneApi<HorzScaleItem> {
	/**
	 * Retrieves the height of the pane in pixels.
	 *
	 * @returns The height of the pane in pixels.
	 */
	getHeight(): number;

	/**
	 * Sets the height of the pane.
	 *
	 * @param height - The number of pixels to set as the height of the pane.
	 */
	setHeight(height: number): void;

	/**
	 * Moves the pane to a new position.
	 *
	 * @param paneIndex - The target index of the pane. Should be a number between 0 and the total number of panes - 1.
	 */
	moveTo(paneIndex: number): void;

	/**
	 * Retrieves the index of the pane.
	 *
	 * @returns The index of the pane. It is a number between 0 and the total number of panes - 1.
	 */
	paneIndex(): number;

	/**
	 * Retrieves the array of series for the current pane.
	 *
	 * @returns An array of series.
	 */
	getSeries(): ISeriesApi<SeriesType, HorzScaleItem>[];

	/**
	 * Retrieves the HTML element of the pane.
	 *
	 * @returns The HTML element of the pane or null if pane wasn't created yet.
	 */
	getHTMLElement(): HTMLElement | null;

	/**
	 * Attaches additional drawing primitive to the pane
	 *
	 * @param primitive - any implementation of IPanePrimitive interface
	 */
	attachPrimitive(primitive: IPanePrimitive<HorzScaleItem>): void;

	/**
	 * Detaches additional drawing primitive from the pane
	 *
	 * @param primitive - implementation of IPanePrimitive interface attached before
	 * Does nothing if specified primitive was not attached
	 */
	detachPrimitive(primitive: IPanePrimitive<HorzScaleItem>): void;

	/**
	 * Returns the price scale with the given id.
	 *
	 * @param priceScaleId - ID of the price scale to find
	 * @throws If the price scale with the given id is not found in this pane
	 */
	priceScale(priceScaleId: string): IPriceScaleApi;

	/**
	 * Sets whether to preserve the empty pane
	 *
	 * @param preserve - Whether to preserve the empty pane
	 */
	setPreserveEmptyPane(preserve: boolean): void;

	/**
	 * Returns whether to preserve the empty pane
	 *
	 * @returns Whether to preserve the empty pane
	 */
	preserveEmptyPane(): boolean;

	/**
	 * Returns the stretch factor of the pane.
	 * Stretch factor determines the relative size of the pane compared to other panes.
	 *
	 * @returns The stretch factor of the pane. Default is 1
	 */
	getStretchFactor(): number;

	/**
	 * Sets the stretch factor of the pane.
	 * When you creating a pane, the stretch factor is 1 by default.
	 * So if you have three panes, and you want to make the first pane twice as big as the second and third panes, you can set the stretch factor of the first pane to 2000.
	 * Example:
	 * ```js
	 * const pane1 = chart.addPane();
	 * const pane2 = chart.addPane();
	 * const pane3 = chart.addPane();
	 * pane1.setStretchFactor(0.2);
	 * pane2.setStretchFactor(0.3);
	 * pane3.setStretchFactor(0.5);
	 * // Now the first pane will be 20% of the total height, the second pane will be 30% of the total height, and the third pane will be 50% of the total height.
	 * // Note: if you have one pane with default stretch factor of 1 and set other pane's stretch factor to 50,
	 * // library will try to make second pane 50 times smaller than the first pane
	 * ```
	 * @param stretchFactor - The stretch factor of the pane.
	 */
	setStretchFactor(stretchFactor: number): void;

	/**
	 * Creates a custom series with specified parameters.
	 *
	 * A custom series is a generic series which can be extended with a custom renderer to
	 * implement chart types which the library doesn't support by default.
	 *
	 * @param customPaneView - A custom series pane view which implements the custom renderer.
	 * @param customOptions - Customization parameters of the series being created.
	 * ```js
	 * const series = pane.addCustomSeries(myCustomPaneView);
	 * ```
	 */
	addCustomSeries<TData extends CustomData<HorzScaleItem>,
		TOptions extends CustomSeriesOptions,
		TPartialOptions extends SeriesPartialOptions<TOptions> = SeriesPartialOptions<TOptions>
	>(
		customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>,
		customOptions?: SeriesPartialOptions<TOptions>
	): ISeriesApi<'Custom', HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>;
	/**
	 * Creates a series with specified parameters.
	 *
	 * @param definition - A series definition.
	 * @param options - Customization parameters of the series being created.
	 * ```js
	 * const series = pane.addSeries(LineSeries, { lineWidth: 2 });
	 * ```
	 */
	addSeries<T extends SeriesType>(
		definition: SeriesDefinition<T>,
		options?: SeriesPartialOptionsMap[T],
	): ISeriesApi<T, HorzScaleItem>;
}
