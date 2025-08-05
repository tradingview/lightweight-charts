import { IChartApiBase } from '../../api/ichart-api';
import { DataChangedHandler, DataChangedScope, ISeriesApi } from '../../api/iseries-api';
import { ISeriesPrimitive, SeriesAttachedParameter } from '../../api/iseries-primitive-api';

import { ensureNotNull } from '../../helpers/assertions';
import { DeepPartial } from '../../helpers/strict-type-checks';

import { AutoScaleMargins } from '../../model/autoscale-info-impl';
import { IPrimitivePaneView, PrimitiveHoveredItem } from '../../model/ipane-primitive';
import { MismatchDirection } from '../../model/plot-list';
import { AutoscaleInfo, SeriesType } from '../../model/series-options';
import { Logical, TimePointIndex } from '../../model/time-data';
import { UpdateType } from '../../views/pane/iupdatable-pane-view';

import { seriesMarkerOptionsDefaults, SeriesMarkersOptions } from './options';
import { SeriesMarkersPaneView } from './pane-view';
import { InternalSeriesMarker, MarkerPositions, SeriesMarker } from './types';
import {
	calculateAdjustedMargin,
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from './utils';

function mergeOptionsWithDefaults(
	options: DeepPartial<SeriesMarkersOptions>
): SeriesMarkersOptions {
	return {
		...seriesMarkerOptionsDefaults,
		...options,
	};
}

export class SeriesMarkersPrimitive<HorzScaleItem> implements ISeriesPrimitive<HorzScaleItem> {
	private _paneView: SeriesMarkersPaneView<HorzScaleItem> | null = null;
	private _markers: SeriesMarker<HorzScaleItem>[] = [];
	private _indexedMarkers: InternalSeriesMarker<TimePointIndex>[] = [];
	private _dataChangedHandler: DataChangedHandler | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;
	private _autoScaleMarginsInvalidated: boolean = true;
	private _autoScaleMargins: AutoScaleMargins | null = null;
	private _markersPositions: MarkerPositions | null = null;
	private _cachedBarSpacing: number | null = null;
	private _recalculationRequired: boolean = true;
	private _options: SeriesMarkersOptions;

	public constructor(options: DeepPartial<SeriesMarkersOptions>) {
		this._options = mergeOptionsWithDefaults(options);
	}

	public attached(param: SeriesAttachedParameter<HorzScaleItem>): void {
		this._recalculateMarkers();
		this._chart = param.chart;
		this._series = param.series;
		this._paneView = new SeriesMarkersPaneView(this._series, ensureNotNull(this._chart), this._options);
		this._requestUpdate = param.requestUpdate;
		this._series.subscribeDataChanged((scope: DataChangedScope) => this._onDataChanged(scope));
		this._recalculationRequired = true;
		this.requestUpdate();
	}

	public requestUpdate(): void {
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}

	public detached(): void {
		if (this._series && this._dataChangedHandler) {
			this._series.unsubscribeDataChanged(this._dataChangedHandler);
		}

		this._chart = null;
		this._series = null;
		this._paneView = null;
		this._dataChangedHandler = null;
	}

	public setMarkers(markers: SeriesMarker<HorzScaleItem>[]): void {
		this._recalculationRequired = true;
		this._markers = markers;
		this._recalculateMarkers();
		this._autoScaleMarginsInvalidated = true;
		this._markersPositions = null;
		this.requestUpdate();
	}

	public markers(): readonly SeriesMarker<HorzScaleItem>[] {
		return this._markers;
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneView ? [this._paneView] : [];
	}

	public updateAllViews(): void {
		this._updateAllViews();
	}

	public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		if (this._paneView) {
			return this._paneView.renderer()?.hitTest(x, y) ?? null;
		}
		return null;
	}

	public autoscaleInfo(startTimePoint: Logical, endTimePoint: Logical): AutoscaleInfo | null {
		if (this._options.autoScale && this._paneView) {
			const margins = this._getAutoScaleMargins();
			if (margins) {
				return {
					priceRange: null,
					margins: margins,
				};
			}
		}
		return null;
	}

	public applyOptions(options: DeepPartial<SeriesMarkersOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	private _getAutoScaleMargins(): AutoScaleMargins | null {
		const chart = ensureNotNull(this._chart);
		const barSpacing = chart.timeScale().options().barSpacing;
		if (this._autoScaleMarginsInvalidated || barSpacing !== this._cachedBarSpacing) {
			this._cachedBarSpacing = barSpacing;
			if (this._markers.length > 0) {
				const shapeMargin = calculateShapeMargin(barSpacing);
				const marginValue = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin * 2;
				const positions = this._getMarkerPositions();

				this._autoScaleMargins = {
					above: calculateAdjustedMargin(marginValue, positions.aboveBar, positions.inBar),
					below: calculateAdjustedMargin(marginValue, positions.belowBar, positions.inBar),
				};
			} else {
				this._autoScaleMargins = null;
			}

			this._autoScaleMarginsInvalidated = false;
		}

		return this._autoScaleMargins;
	}

	private _getMarkerPositions(): MarkerPositions {
		if (this._markersPositions === null) {
			this._markersPositions = this._markers.reduce(
				(acc: MarkerPositions, marker: SeriesMarker<HorzScaleItem>) => {
					if (!acc[marker.position]) {
						acc[marker.position] = true;
					}
					return acc;
				},
				{
					inBar: false,
					aboveBar: false,
					belowBar: false,
					atPriceTop: false,
					atPriceBottom: false,
					atPriceMiddle: false,
				}
			);
		}
		return this._markersPositions;
	}

	private _recalculateMarkers(): void {
		if (!this._recalculationRequired || !this._chart || !this._series) {
			return;
		}
		const timeScale = this._chart.timeScale();
		const seriesData = this._series?.data();
		if (timeScale.getVisibleLogicalRange() == null || !this._series || seriesData.length === 0) {
			this._indexedMarkers = [];
			return;
		}

		const firstDataIndex = timeScale.timeToIndex(ensureNotNull(seriesData[0].time), true) as unknown as Logical;
		this._indexedMarkers = this._markers.map<InternalSeriesMarker<TimePointIndex>>((marker: SeriesMarker<HorzScaleItem>, index: number) => {
			const timePointIndex = timeScale.timeToIndex(marker.time, true) as unknown as Logical;
			const searchMode = timePointIndex < firstDataIndex ? MismatchDirection.NearestRight : MismatchDirection.NearestLeft;
			const seriesDataByIndex = ensureNotNull(this._series).dataByIndex(timePointIndex, searchMode);
			const finalIndex = timeScale.timeToIndex(ensureNotNull(seriesDataByIndex).time, false) as unknown as TimePointIndex;

			// You must explicitly define the types so that the minification build processes the field names correctly
			const baseMarker: InternalSeriesMarker<TimePointIndex> = {
				time: finalIndex,
				position: marker.position,
				shape: marker.shape,
				color: marker.color,
				id: marker.id,
				internalId: index,
				text: marker.text,
				size: marker.size,
				price: marker.price,
				originalTime: marker.time,
			};

			if (
				marker.position === 'atPriceTop' ||
				marker.position === 'atPriceBottom' ||
				marker.position === 'atPriceMiddle'
			) {
				if (marker.price === undefined) {
					throw new Error(`Price is required for position ${marker.position}`);
				}
				return {
					...baseMarker,
					position: marker.position, // TypeScript knows this is SeriesMarkerPricePosition
					price: marker.price,
				} satisfies InternalSeriesMarker<TimePointIndex>;
			} else {
				return {
					...baseMarker,
					position: marker.position, // TypeScript knows this is SeriesMarkerBarPosition
					price: marker.price, // Optional for bar positions
				} satisfies InternalSeriesMarker<TimePointIndex>;
			}
		});
		this._recalculationRequired = false;
	}

	private _updateAllViews(updateType?: UpdateType): void {
		if (this._paneView) {
			this._recalculateMarkers();
			this._paneView.setMarkers(this._indexedMarkers);
			this._paneView.updateOptions(this._options);
			this._paneView.update(updateType);
		}
	}

	private _onDataChanged(scope: DataChangedScope): void {
		this._recalculationRequired = true;
		this.requestUpdate();
	}
}

