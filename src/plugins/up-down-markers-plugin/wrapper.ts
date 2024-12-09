import { ISeriesApi } from '../../api/iseries-api';

import {
	LineData,
	SeriesDataItemTypeMap,
	WhitespaceData,
} from '../../model/data-consumer';
import { SeriesType } from '../../model/series-options';

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from '../series-primitive-adapter';
import { UpDownMarkersPluginOptions } from './options';
import { UpDownMarkersPrimitive } from './primitive';
import { SeriesUpDownMarker, UpDownMarkersSupportedSeriesTypes } from './types';

/**
 * UpDownMarkersPrimitive Plugin for showing the direction of price changes on the chart.
 * This plugin can only be used with Line and Area series types.
 * 1. Manual control:
 *
 * - Use the `setMarkers` method to manually add markers to the chart.
 * This will replace any existing markers.
 * - Use `clearMarkers` to remove all markers.
 *
 * 2. Automatic updates:
 *
 * Use `setData` and `update` from this primitive instead of the those on the series to let the
 * primitive handle the creation of price change markers automatically.
 *
 * - Use `setData` to initialize or replace all data points.
 * - Use `update` to modify individual data points. This will automatically
 * create markers for price changes on existing data points.
 * - The `updateVisibilityDuration` option controls how long markers remain visible.
 */
export interface ISeriesUpDownMarkerPluginApi<
	HorzScaleItem,
	TData extends SeriesDataItemTypeMap<HorzScaleItem>[UpDownMarkersSupportedSeriesTypes] = SeriesDataItemTypeMap<HorzScaleItem>['Line']
> extends ISeriesPrimitiveWrapper<HorzScaleItem> {
	/**
	 * Applies new options to the plugin.
	 * @param options - Partial options to apply.
	 */
	applyOptions: (options: Partial<UpDownMarkersPluginOptions>) => void;
	/**
	 * Sets the data for the series and manages data points for marker updates.
	 * @param data - Array of data points to set.
	 */
	setData: (data: TData[]) => void;
	/**
	 * Updates a single data point and manages marker updates for existing data points.
	 * @param data - The data point to update.
	 * @param historicalUpdate - Optional flag for historical updates.
	 */
	update: (data: TData, historicalUpdate?: boolean) => void;
	/**
	 * Retrieves the current markers on the chart.
	 * @returns An array of SeriesUpDownMarker.
	 */
	markers: () => readonly SeriesUpDownMarker<HorzScaleItem>[];
	/**
	 * Manually sets markers on the chart.
	 * @param markers - Array of SeriesUpDownMarker to set.
	 */
	setMarkers: (markers: SeriesUpDownMarker<HorzScaleItem>[]) => void;
	/**
	 * Clears all markers from the chart.
	 */
	clearMarkers: () => void;
}

class SeriesUpDownMarkerPrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		unknown,
		UpDownMarkersPrimitive<HorzScaleItem>
	>
	implements ISeriesPrimitiveWrapper<HorzScaleItem>, ISeriesUpDownMarkerPluginApi<HorzScaleItem> {
	public setData(
		data: (LineData<HorzScaleItem> | WhitespaceData<HorzScaleItem>)[]
	): void {
		return this._primitive.setData(data);
	}

	public update(
		data: LineData<HorzScaleItem> | WhitespaceData<HorzScaleItem>,
		historicalUpdate?: boolean
	): void {
		return this._primitive.update(data, historicalUpdate);
	}

	public markers(): readonly SeriesUpDownMarker<HorzScaleItem>[] {
		return this._primitive.markers();
	}

	public setMarkers(markers: SeriesUpDownMarker<HorzScaleItem>[]): void {
		return this._primitive.setMarkers(markers);
	}

	public clearMarkers(): void {
		return this._primitive.clearMarkers();
	}
}

/**
 * Creates and attaches the Series Up Down Markers Plugin.
 *
 * @param series - Series to which attach the Up Down Markers Plugin
 * @param options - options for the Up Down Markers Plugin
 *
 * @returns Api for Series Up Down Marker Plugin. {@link ISeriesUpDownMarkerPluginApi}
 *
 * @example
 * ```js
 * import { createUpDownMarkers, createChart, LineSeries } from 'lightweight-charts';
 *
 * const chart = createChart('container');
 * const lineSeries = chart.addSeries(LineSeries);
 * const upDownMarkers = createUpDownMarkers(lineSeries, {
 *     positiveColor: '#22AB94',
 *     negativeColor: '#F7525F',
 *     updateVisibilityDuration: 5000,
 * });
 * // to add some data
 * upDownMarkers.setData(
 *     [
 *         { time: '2020-02-02', value: 12.34 },
 *         //... more line series data
 *     ]
 * );
 * // ... Update some values
 * upDownMarkers.update({ time: '2020-02-02', value: 13.54 }, true);
 * // to remove plugin from the series
 * upDownMarkers.detach();
 * ```
 */
export function createUpDownMarkers<T>(
	series: ISeriesApi<SeriesType, T>,
	options: Partial<UpDownMarkersPluginOptions> = {}
): ISeriesUpDownMarkerPluginApi<T> {
	const wrapper = new SeriesUpDownMarkerPrimitiveWrapper<T>(
		series,
		new UpDownMarkersPrimitive(options)
	);
	return wrapper;
}
