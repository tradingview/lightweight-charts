import { SeriesType } from '../model/series-options';

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
	 * @returns The HTML element of the pane.
	 */
	getHTMLElement(): HTMLElement;

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
}
