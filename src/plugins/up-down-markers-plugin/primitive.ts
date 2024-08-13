import { IChartApiBase } from '../../api/ichart-api';
import { ISeriesApi } from '../../api/iseries-api';
import { SeriesAttachedParameter } from '../../api/iseries-primitive-api';

import { ensureDefined } from '../../helpers/assertions';

import { isFulfilledData, isWhitespaceData, LineData, SeriesDataItemTypeMap } from '../../model/data-consumer';
import { IHorzScaleBehavior, InternalHorzScaleItemKey } from '../../model/ihorz-scale-behavior';
import { IPrimitivePaneView } from '../../model/ipane-primitive';

import { ExpiringMarkerManager } from './expiring-markers-manager';
import {
	upDownMarkersPluginOptionDefaults,
	UpDownMarkersPluginOptions,
} from './options';
import { SeriesUpDownMarker, UpDownMarkersSupportedSeriesTypes } from './types';
import { MarkersPrimitivePaneView } from './view';

function isLineData<T>(
	item: SeriesDataItemTypeMap<T>[UpDownMarkersSupportedSeriesTypes],
	type: UpDownMarkersSupportedSeriesTypes
): item is LineData<T> {
	return type === 'Line' || type === 'Area';
}

/**
 * UpDownMarkersPrimitive class for showing the direction of price changes on the chart.
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
export class UpDownMarkersPrimitive<
	HorzScaleItem,
	TData extends SeriesDataItemTypeMap<HorzScaleItem>[UpDownMarkersSupportedSeriesTypes] = SeriesDataItemTypeMap<HorzScaleItem>['Line']
> {
	private _chart: IChartApiBase<HorzScaleItem> | undefined = undefined;
	private _series: ISeriesApi<UpDownMarkersSupportedSeriesTypes, HorzScaleItem> | undefined =
		undefined;
	private _paneViews: MarkersPrimitivePaneView<
		HorzScaleItem,
		UpDownMarkersSupportedSeriesTypes
	>[] = [];
	private _markersManager: ExpiringMarkerManager<HorzScaleItem>;
	private _requestUpdate?: () => void;
	private _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem> | null = null;
	private _options: UpDownMarkersPluginOptions;
	private _managedDataPoints: Map<InternalHorzScaleItemKey, number> = new Map();

	public constructor(
		options: Partial<UpDownMarkersPluginOptions>
	) {
		this._markersManager = new ExpiringMarkerManager(() => this.requestUpdate());
		this._options = {
			...upDownMarkersPluginOptionDefaults,
			...options,
		};
	}

	/**
     * Applies new options to the plugin.
     * @param options - Partial options to apply.
     */
	public applyOptions(options: Partial<UpDownMarkersPluginOptions>): void {
		this._options = {
			...this._options,
			...options,
		};
		this.requestUpdate();
	}

	/**
     * Manually sets markers on the chart.
     * @param markers - Array of SeriesUpDownMarker to set.
     */
	public setMarkers(markers: SeriesUpDownMarker<HorzScaleItem>[]): void {
		this._markersManager.clearAllMarkers();
		const horzBehaviour = this._horzScaleBehavior;
		if (!horzBehaviour) {
			return;
		}
		markers.forEach((marker: SeriesUpDownMarker<HorzScaleItem>) => {
			this._markersManager.setMarker(marker, horzBehaviour.key(marker.time));
		});
	}

	/**
     * Retrieves the current markers on the chart.
     * @returns An array of SeriesUpDownMarker.
     */
	public markers(): readonly SeriesUpDownMarker<HorzScaleItem>[] {
		return this._markersManager.getMarkers();
	}

	/**
     * Requests an update of the chart.
     */
	public requestUpdate(): void {
		this._requestUpdate?.();
	}

	/**
     * Attaches the primitive to the chart and series.
     * @param params - Parameters for attaching the primitive.
     */
	public attached(params: SeriesAttachedParameter<HorzScaleItem>): void {
		const {
			chart,
			series,
			requestUpdate,
			horzScaleBehavior,
		} = params;
		this._chart = chart;
		this._series = series as ISeriesApi<UpDownMarkersSupportedSeriesTypes, HorzScaleItem>;
		this._horzScaleBehavior = horzScaleBehavior;
		const seriesType = this._series.seriesType();
		if (seriesType !== 'Area' && seriesType !== 'Line') {
			throw new Error(
				'UpDownMarkersPrimitive is only supported for Area and Line series types'
			);
		}
		this._paneViews = [
			new MarkersPrimitivePaneView(
				this._series,
				this._chart.timeScale(),
				this._options
			),
		];
		this._requestUpdate = requestUpdate;
		this.requestUpdate();
	}

	/**
     * Detaches the primitive from the chart and series.
     */
	public detached(): void {
		this._chart = undefined;
		this._series = undefined;
		this._requestUpdate = undefined;
	}

	public chart(): IChartApiBase<HorzScaleItem> {
		return ensureDefined(this._chart);
	}

	public series(): ISeriesApi<UpDownMarkersSupportedSeriesTypes, HorzScaleItem> {
		return ensureDefined(this._series);
	}

	public updateAllViews(): void {
		this._paneViews.forEach(
			(pw: MarkersPrimitivePaneView<HorzScaleItem, UpDownMarkersSupportedSeriesTypes>) =>
				pw.update(this.markers())
		);
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	/**
     * Sets the data for the series and manages data points for marker updates.
     * @param data - Array of data points to set.
     */
	public setData(data: TData[]): void {
		if (!this._series) {
			throw new Error('Primitive not attached to series');
		}
		const seriesType = this._series.seriesType();
		this._managedDataPoints.clear();
		const horzBehaviour = this._horzScaleBehavior;
		if (horzBehaviour) {
			data.forEach((d: TData) => {
				if (isFulfilledData(d) && isLineData(d, seriesType)) {
					this._managedDataPoints.set(horzBehaviour.key(d.time), d.value);
				}
			});
		}
		ensureDefined(this._series).setData(data);
	}

	/**
     * Updates a single data point and manages marker updates for existing data points.
     * @param data - The data point to update.
     * @param historicalUpdate - Optional flag for historical updates.
     */
	public update(data: TData, historicalUpdate?: boolean): void {
		if (!this._series || !this._horzScaleBehavior) {
			throw new Error('Primitive not attached to series');
		}
		const seriesType = this._series.seriesType();
		const horzKey = this._horzScaleBehavior.key(data.time);
		if (isWhitespaceData(data)) {
			this._managedDataPoints.delete(horzKey);
		}
		if (isFulfilledData(data) && isLineData(data, seriesType)) {
			const existingPrice = this._managedDataPoints.get(horzKey);
			if (existingPrice) {
				this._markersManager.setMarker(
					{
						time: data.time,
						value: data.value,
						sign: getSign(data.value, existingPrice),
					},
					horzKey,
					this._options.updateVisibilityDuration
				);
			}
		}
		ensureDefined(this._series).update(data, historicalUpdate);
	}

	/**
     * Clears all markers from the chart.
     */
	public clearMarkers(): void {
		this._markersManager.clearAllMarkers();
	}
}

function getSign(newValue: number, oldValue: number): 1 | 0 | -1 {
	if (newValue === oldValue) {
		return 0;
	}
	return newValue - oldValue > 0 ? 1 : -1;
}
