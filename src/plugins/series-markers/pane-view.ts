import { IChartApiBase } from '../../api/ichart-api';
import { ISeriesApi } from '../../api/iseries-api';

import { ensureNever, ensureNotNull } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';

import { Coordinate } from '../../model/coordinate';
import { AreaData, BarData, BaselineData, CandlestickData, HistogramData, LineData, SeriesDataItemTypeMap, SingleValueData } from '../../model/data-consumer';
import { IPrimitivePaneView } from '../../model/ipane-primitive';
import { RangeImpl } from '../../model/range-impl';
import { SeriesType } from '../../model/series-options';
import { Logical, TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { UpdateType } from '../../views/pane/iupdatable-pane-view';

import {
	SeriesMarkerRendererData,
	SeriesMarkerRendererDataItem,
	SeriesMarkersRenderer,
} from './renderer';
import { InternalSeriesMarker } from './types';
import {
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from './utils';

const enum Constants {
	TextMargin = 0.1,
}

interface Offsets {
	aboveBar: number;
	belowBar: number;
}

// Helper function to calculate marker size more precisely
function calculateMarkerSize(barSpacing: number, sizeMultiplier: number): number {
	// Base size from the standard calculation
	const baseSize = calculateShapeHeight(barSpacing);
	
	// If size multiplier is 1, return the standard size
	if (sizeMultiplier === 1) {
		return baseSize;
	}
	
	// For other size multipliers, scale more aggressively
	// This allows for more noticeable size differences
	if (sizeMultiplier < 1) {
		// For smaller sizes, scale down more aggressively
		return Math.max(baseSize * (0.5 + 0.5 * sizeMultiplier), 6);
	} else {
		// For larger sizes, scale up more aggressively
		return baseSize * sizeMultiplier;
	}
}

// Helper function to handle price-based positioning
/* eslint-disable */
function positionMarkerAtPrice<HorzScaleItem>(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: InternalSeriesMarker<TimePointIndex>,
	y: number | null,
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	textHeight: number,
	shapeMargin: number,
	chart?: IChartApiBase<HorzScaleItem>
): boolean {
	// If we don't have a price, we can't position properly
	if (marker.price === undefined) {
		return false;
	}
	
	// ALWAYS get fresh coordinate for the marker price
	// This ensures we use the latest price scale, matching how price lines work
	const latestYCoordinate = series.priceToCoordinate(marker.price);	
	if (latestYCoordinate === null) {
		return false;
	}
	
	// Use the latest coordinate instead of the cached value
	y = latestYCoordinate;
	
	// Get the timeScale from chart to ensure we use the exact same barSpacing
	const timeScale = chart?.timeScale();
	if (!timeScale) {
		return false;
	}
	
	// Use EXACTLY the same size calculation as in fillSizeAndY
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const barSpacing = timeScale.options().barSpacing;
	// Use our new more precise size calculation
	const shapeSize = calculateMarkerSize(barSpacing, sizeMultiplier);
	
	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;

	// Position the marker based on its position property and price
	switch (marker.position) {
		case 'atPriceTop':
			// Position marker so its bottom edge is exactly at the price level
			rendererItem.y = (y - halfSize) as Coordinate;
			if (rendererItem.text !== undefined) {
				// Position text above marker using original logic
				rendererItem.text.y = (rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
			}
			break;
		case 'atPriceBottom':
			// Position marker so its top edge is exactly at the price level
			rendererItem.y = (y + halfSize) as Coordinate;
			if (rendererItem.text !== undefined) {
				// Position text below marker using original logic
				rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
			}
			break;
		case 'atPriceMiddle':
			// Position marker centered at the price level
			rendererItem.y = y as Coordinate;
			if (rendererItem.text !== undefined) {
				// Position text above marker using original logic
				rendererItem.text.y = (rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
			}
			break;
		default:
			// For other positions, we'll handle them in the original way
			return false;
	}
	
	return true;
}
/* eslint-enable */



// Helper function to position marker above bar
function positionAboveBar<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	highPrice: number,
	halfSize: number,
	offsets: Offsets,
	shapeSize: number,
	shapeMargin: number
): Coordinate | null {
	const topCoordinate = series.priceToCoordinate(highPrice);
	if (topCoordinate === null) {
		return null;
	}
	const y = topCoordinate - halfSize - offsets.aboveBar as Coordinate;
	offsets.aboveBar += shapeSize + shapeMargin;
	return y;
}

// Helper function to position marker below bar
function positionBelowBar<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	lowPrice: number,
	halfSize: number,
	offsets: Offsets,
	shapeSize: number,
	shapeMargin: number
): Coordinate | null {
	const bottomCoordinate = series.priceToCoordinate(lowPrice);
	if (bottomCoordinate === null) {
		return null;
	}
	const y = bottomCoordinate + halfSize + offsets.belowBar as Coordinate;
	offsets.belowBar += shapeSize + shapeMargin;
	return y;
}

// eslint-disable-next-line max-params
/* eslint-disable */
function fillSizeAndY<HorzScaleItem>(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: InternalSeriesMarker<TimePointIndex>,
	seriesData: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType],
	offsets: Offsets,
	textHeight: number,
	shapeMargin: number,
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	chart: IChartApiBase<HorzScaleItem>
): void {
	// If marker has a price property AND is using one of the atPrice* positions,
	// prioritize exact price positioning
	if (marker.price !== undefined && 
	    (marker.position === 'atPriceTop' || 
	     marker.position === 'atPriceBottom' || 
	     marker.position === 'atPriceMiddle')) {
		// We don't need to pass the y coordinate - positionMarkerAtPrice will get it fresh
		if (positionMarkerAtPrice(rendererItem, marker, null, series, textHeight, shapeMargin, chart)) {
			// Successfully positioned using price, we're done
			return;
		}
		// Only if price-to-coordinate conversion fails, fall back to bar positioning
	}

	// Original positioning logic
	const timeScale = chart.timeScale();
	let inBarPrice: number;
	let highPrice: number;
	let lowPrice: number;

	if (isValueData(seriesData)) {
		inBarPrice = seriesData.value;
		highPrice = seriesData.value;
		lowPrice = seriesData.value;
	} else if (isOhlcData(seriesData)) {
		inBarPrice = seriesData.close;
		highPrice = seriesData.high;
		lowPrice = seriesData.low;
	} else {
		return;
	}

	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const barSpacing = timeScale.options().barSpacing;
	
	
	// Use our new more precise size calculation
	const shapeSize = calculateMarkerSize(barSpacing, sizeMultiplier);
	
	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;
	
	let y: Coordinate | null = null;
	
	switch (marker.position) {
		case 'inBar': {
			rendererItem.y = ensureNotNull(series.priceToCoordinate(inBarPrice));
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
			}
			return;
		}
		case 'aboveBar': {
			y = positionAboveBar(series, highPrice, halfSize, offsets, shapeSize, shapeMargin);
			if (y === null) return;
			rendererItem.y = y;
			
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
				offsets.aboveBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			return;
		}
		case 'belowBar': {
			y = positionBelowBar(series, lowPrice, halfSize, offsets, shapeSize, shapeMargin);
			if (y === null) return;
			rendererItem.y = y;
			
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
				offsets.belowBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			return;
		}
		// Handle the price-based positions as a fallback if they didn't have a price attribute
		case 'atPriceTop': {
			if (marker.price !== undefined) {
				// This should have been handled by positionMarkerAtPrice
				// If we're here, it means the price coordinate conversion failed
				return;
			}
			// Fallback to aboveBar behavior
			y = positionAboveBar(series, highPrice, halfSize, offsets, shapeSize, shapeMargin);
			if (y === null) return;
			rendererItem.y = y;
			
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
				offsets.aboveBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			return;
		}
		case 'atPriceBottom': {
			if (marker.price !== undefined) {
				// This should have been handled by positionMarkerAtPrice
				// If we're here, it means the price coordinate conversion failed
				return;
			}
			// Fallback to belowBar behavior
			y = positionBelowBar(series, lowPrice, halfSize, offsets, shapeSize, shapeMargin);
			if (y === null) return;
			rendererItem.y = y;
			
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
				offsets.belowBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			return;
		}
		case 'atPriceMiddle': {
			if (marker.price !== undefined) {
				// This should have been handled by positionMarkerAtPrice
				// If we're here, it means the price coordinate conversion failed
				return;
			}
			// Fallback to inBar behavior
			rendererItem.y = ensureNotNull(series.priceToCoordinate(inBarPrice));
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
			}
			return;
		}
	}

	ensureNever(marker.position);
}
/* eslint-enable */

function isValueData<HorzScaleItem>(
	data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]
): data is LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | AreaData<HorzScaleItem> | BaselineData<HorzScaleItem> {
	// eslint-disable-next-line no-restricted-syntax
	return 'value' in data && typeof (data as unknown as SingleValueData).value === 'number';
}

function isOhlcData<HorzScaleItem>(
	data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]
): data is BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> {
	// eslint-disable-next-line no-restricted-syntax
	return 'open' in data && 'high' in data && 'low' in data && 'close' in data;
}

export class SeriesMarkersPaneView<HorzScaleItem> implements IPrimitivePaneView {
	private readonly _series: ISeriesApi<SeriesType, HorzScaleItem>;
	private readonly _chart: IChartApiBase<HorzScaleItem>;
	private _data: SeriesMarkerRendererData;
	private _markers: InternalSeriesMarker<TimePointIndex>[] = [];

	private _invalidated: boolean = true;
	private _dataInvalidated: boolean = true;

	private _renderer: SeriesMarkersRenderer = new SeriesMarkersRenderer();

	public constructor(series: ISeriesApi<SeriesType, HorzScaleItem>, chart: IChartApiBase<HorzScaleItem>) {
		this._series = series;
		this._chart = chart;
		this._data = {
			items: [],
			visibleRange: null,
		};
	}

	public renderer(): SeriesMarkersRenderer | null {
		if (!this._series.options().visible) {
			return null;
		}

		if (this._invalidated) {
			this._makeValid();
		}

		const layout = this._chart.options()['layout'];
		this._renderer.setParams(layout.fontSize, layout.fontFamily);
		this._renderer.setData(this._data);

		return this._renderer;
	}

	public setMarkers(markers: InternalSeriesMarker<TimePointIndex>[]): void {
		this._markers = markers;
		this.update('data');
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		if (updateType === 'data') {
			this._dataInvalidated = true;
		}
	}

	protected _makeValid(): void {
		const timeScale = this._chart.timeScale();
		const seriesMarkers = this._markers;
		if (this._dataInvalidated) {
			this._data.items = seriesMarkers.map<SeriesMarkerRendererDataItem>((marker: InternalSeriesMarker<TimePointIndex>) => ({
				time: marker.time,
				x: 0 as Coordinate,
				y: 0 as Coordinate,
				size: 0,
				shape: marker.shape,
				color: marker.color,
				externalId: marker.id,
				internalId: marker.internalId,
				text: undefined,
			}));
			this._dataInvalidated = false;
		}

		const layoutOptions = this._chart.options()['layout'];

		this._data.visibleRange = null;
		const visibleBars = timeScale.getVisibleLogicalRange();

		if (visibleBars === null) {
			return;
		}
		const visibleBarsRange = new RangeImpl(Math.floor(visibleBars.from) as TimePointIndex, Math.ceil(visibleBars.to) as TimePointIndex);
		const firstValue = this._series.data()[0];
		if (firstValue === null) {
			return;
		}
		if (this._data.items.length === 0) {
			return;
		}
		let prevTimeIndex = NaN;
		const shapeMargin = calculateShapeMargin(timeScale.options().barSpacing);
		const offsets: Offsets = {
			aboveBar: shapeMargin,
			belowBar: shapeMargin,
		};

		this._data.visibleRange = visibleTimedValues(this._data.items, visibleBarsRange, true);
		for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
			const marker = seriesMarkers[index];
			if (marker.time !== prevTimeIndex) {
				// new bar, reset stack counter
				offsets.aboveBar = shapeMargin;
				offsets.belowBar = shapeMargin;
				prevTimeIndex = marker.time;
			}

			const rendererItem = this._data.items[index];
			rendererItem.x = ensureNotNull(timeScale.logicalToCoordinate(marker.time as unknown as Logical));
			if (marker.text !== undefined && marker.text.length > 0) {
				rendererItem.text = {
					content: marker.text,
					x: 0 as Coordinate,
					y: 0 as Coordinate,
					width: 0,
					height: 0,
				};
			}

			const dataAt = ensureNotNull(this._series.dataByIndex(marker.time, -1));
			if (dataAt === null) {
				continue;
			}
			fillSizeAndY<HorzScaleItem>(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, this._series, this._chart);
		}

		this._invalidated = false;
	}
}
