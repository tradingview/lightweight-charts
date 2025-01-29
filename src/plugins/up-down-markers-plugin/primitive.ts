import { IChartApiBase } from '../../api/ichart-api';
import { ISeriesApi } from '../../api/iseries-api';
import { ISeriesPrimitive, SeriesAttachedParameter } from '../../api/iseries-primitive-api';

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

export class UpDownMarkersPrimitive<
	HorzScaleItem,
	TData extends SeriesDataItemTypeMap<HorzScaleItem>[UpDownMarkersSupportedSeriesTypes] = SeriesDataItemTypeMap<HorzScaleItem>['Line']
> implements ISeriesPrimitive<HorzScaleItem> {
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

	public applyOptions(options: Partial<UpDownMarkersPluginOptions>): void {
		this._options = {
			...this._options,
			...options,
		};
		this.requestUpdate();
	}

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

	public markers(): readonly SeriesUpDownMarker<HorzScaleItem>[] {
		return this._markersManager.getMarkers();
	}

	public requestUpdate(): void {
		this._requestUpdate?.();
	}

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
