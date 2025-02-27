import { IChartApiBase } from '../../api/ichart-api';
import { DataChangedHandler, DataChangedScope, ISeriesApi } from '../../api/iseries-api';
import { ISeriesPrimitive, SeriesAttachedParameter } from '../../api/iseries-primitive-api';

import { ensureNotNull } from '../../helpers/assertions';

import { AutoScaleMargins } from '../../model/autoscale-info-impl';
import { IPrimitivePaneView, PrimitiveHoveredItem } from '../../model/ipane-primitive';
import { MismatchDirection } from '../../model/plot-list';
import { AutoscaleInfo, SeriesType } from '../../model/series-options';
import { Logical, TimePointIndex } from '../../model/time-data';
import { UpdateType } from '../../views/pane/iupdatable-pane-view';

import { SeriesMarkersPaneView } from './pane-view';
import { InternalSeriesMarker, MarkerPositions, SeriesMarker } from './types';
import {
	calculateAdjustedMargin,
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from './utils';

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
	private _priceScaleUpdateHandler: (() => void) | null = null;
	private _lastPriceRange: string | null = null;

	public attached(param: SeriesAttachedParameter<HorzScaleItem>): void {
		this._recalculateMarkers();
		this._chart = param.chart;
		this._series = param.series;
		this._paneView = new SeriesMarkersPaneView(this._series, ensureNotNull(this._chart));
		this._requestUpdate = param.requestUpdate;

		// Listen for data changes
		this._dataChangedHandler = (scope: DataChangedScope) => this._onDataChanged(scope);
		this._series.subscribeDataChanged(this._dataChangedHandler);

		// Set up price scale monitoring
		this._setupPriceScaleMonitoring();
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
		
		// Clean up price scale monitoring
		if (this._priceScaleUpdateHandler) {
			window.removeEventListener('mousemove', this._priceScaleUpdateHandler);
			this._priceScaleUpdateHandler = null;
		}
		
		this._chart = null;
		this._series = null;
		this._paneView = null;
		this._dataChangedHandler = null;
	}

	public setMarkers(markers: SeriesMarker<HorzScaleItem>[]): void {
		this._markers = markers;
		this._recalculateMarkers();
		this._autoScaleMarginsInvalidated = true;
		this._markersPositions = null;
		this.requestUpdate();

		// Add a sequence of delayed updates to catch price scale adjustments
		// that might occur after initial marker placement
		if (this._markers.length > 0) {
			// First immediate update to position markers
			this._updateAllViews('data');

			// Schedule multiple updates to catch scale adjustments
			const updateTimes = [50, 150, 300, 500]; // milliseconds
			updateTimes.forEach((delay: number) => {
				setTimeout(
					() => {
						if (this._series) {
							// Force price scale update
							try {
								this._series.priceScale().applyOptions({});
							} catch (e) {
								// Ignore if price scale is not available
							}
							// Recalculate with latest coordinates
							this._updateAllViews('data');
							this.requestUpdate();
						}
					},
					delay
				);
			});
		}
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
		if (this._paneView) {
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
	
	private _setupPriceScaleMonitoring(): void {
		if (!this._series || !this._chart) {
			return;
		}

		// Clear any existing handler
		if (this._priceScaleUpdateHandler) {
			window.removeEventListener('mousemove', this._priceScaleUpdateHandler);
			this._priceScaleUpdateHandler = null;
		}

		// Create handler that detects price scale changes
		this._priceScaleUpdateHandler = () => {
			if (!this._series) {
				return;
			}
			
			// Get current price range as a string for comparison
			let currentPriceRange = 'unknown';
			try {
				const priceScale = this._series.priceScale();
				if (priceScale) {
					// Use visible price range as a proxy for scale changes
					const visibleBars = this._chart?.timeScale().getVisibleLogicalRange();
					if (visibleBars) {
						// Get coordinate for a reference price to detect scale changes
						const testPrice = 100;
						const coordinate = this._series.priceToCoordinate(testPrice);
						currentPriceRange = `${coordinate}`;
					}
				}
			} catch (e) {
				// Ignore errors getting price range
			}

			// If price range changed, update markers
			if (this._lastPriceRange !== null && this._lastPriceRange !== currentPriceRange) {
				this._updateAllViews('data');
				this.requestUpdate();
			}
			
			this._lastPriceRange = currentPriceRange;
		};

		// Monitor for price scale changes on key events that might trigger scale adjustments
		window.addEventListener('mousemove', this._priceScaleUpdateHandler);
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
			const initialPositions: MarkerPositions = {
				inBar: false,
				aboveBar: false,
				belowBar: false,
				atPriceTop: false,
				atPriceBottom: false,
				atPriceMiddle: false,
			};

			this._markersPositions = this._markers.reduce(
				(acc: MarkerPositions, marker: SeriesMarker<HorzScaleItem>) => {
					if (!acc[marker.position]) {
						acc[marker.position] = true;
					}
					return acc;
				},
				initialPositions
			);
		}
		return this._markersPositions;
	}

	private _recalculateMarkers(): void {
		if (!this._chart || !this._series) {
			return;
		}
		const timeScale = this._chart.timeScale();
		const seriesData = this._series?.data();
		if (seriesData.length === 0) {
			this._indexedMarkers = [];
			return;
		}

		const firstDataIndex = timeScale.timeToIndex(ensureNotNull(seriesData[0].time), true) as unknown as Logical;
		this._indexedMarkers = this._markers.map<InternalSeriesMarker<TimePointIndex>>((marker: SeriesMarker<HorzScaleItem>, index: number) => {
			const timePointIndex = timeScale.timeToIndex(marker.time, true) as unknown as Logical;
			const searchMode = timePointIndex < firstDataIndex ? MismatchDirection.NearestRight : MismatchDirection.NearestLeft;
			const seriesDataByIndex = ensureNotNull(this._series).dataByIndex(timePointIndex, searchMode);
			const finalIndex = timeScale.timeToIndex(ensureNotNull(seriesDataByIndex).time, false) as unknown as TimePointIndex;

			return {
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
		});
	}

	private _updateAllViews(updateType?: UpdateType): void {
		if (this._paneView) {
			this._recalculateMarkers();
			this._paneView.setMarkers(this._indexedMarkers);
			this._paneView.update(updateType);
		}
	}

	private _onDataChanged(scope: DataChangedScope): void {
		this.requestUpdate();
	}
}

