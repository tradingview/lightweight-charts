import { SeriesType } from '../model/series-options';

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
	series(): ISeriesApi<SeriesType, HorzScaleItem>[];
}
