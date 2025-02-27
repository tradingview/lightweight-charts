import { IChartApiBase } from '../../api/ichart-api';
import { ISeriesApi } from '../../api/iseries-api';

import { ensureNotNull } from '../../helpers/assertions';
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
import { InternalSeriesMarker, SeriesMarkerPosition } from './types';
import {
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from './utils';

interface Offsets {
	aboveBar: number;
	belowBar: number;
}

// Helper function to handle price-based positioning
/* eslint-disable */
function positionMarkerAtPrice<HorzScaleItem>(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: InternalSeriesMarker<TimePointIndex>,
	y: number | null,
	series: ISeriesApi<SeriesType, HorzScaleItem>
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
	
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const shapeSize = calculateShapeHeight(sizeMultiplier);
	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;

	// Position the marker based on its position property and price
	switch (marker.position) {
		case 'atPriceTop':
			// Bottom of marker at price level
			rendererItem.y = (y - halfSize) as Coordinate;
			break;
		case 'atPriceBottom':
			// Top of marker at price level
			rendererItem.y = (y + halfSize) as Coordinate;
			break;
		case 'atPriceMiddle':
			// Center of marker at price level
			rendererItem.y = y as Coordinate;
			break;
		default:
			// For other positions, just use the price coordinate
			rendererItem.y = y as Coordinate;
	}
	
	if (rendererItem.text !== undefined) {
		rendererItem.text.y = rendererItem.y;
	}
	return true;
}
/* eslint-enable */

// Helper function to get prices from series data
function getPricesFromData<HorzScaleItem>(
	seriesData: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]
): { inBarPrice: number; highPrice: number; lowPrice: number } | null {
	if (isOhlcData(seriesData)) {
		return {
			inBarPrice: seriesData.close,
			highPrice: seriesData.high,
			lowPrice: seriesData.low,
		};
	} else if (isValueData(seriesData)) {
		return {
			inBarPrice: seriesData.value,
			highPrice: seriesData.value,
			lowPrice: seriesData.value,
		};
	}
	return null;
}

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

// Helper function to position marker at price level
function positionAtPrice<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	price: number,
	position: SeriesMarkerPosition,
	halfSize: number
): Coordinate | null {
	const coordinate = series.priceToCoordinate(price);
	// eslint-disable-next-line no-console
	console.log('positionAtPrice', position, coordinate);
	if (coordinate === null) {
		return null;
	}
	switch (position) {
		case 'atPriceTop':
			return coordinate - halfSize as Coordinate;
		case 'atPriceBottom':
			return coordinate + halfSize as Coordinate;
		case 'atPriceMiddle':
		case 'inBar':
		default:
			return coordinate;
	}
}

// Helper function to position marker on bar
function positionMarkerOnBar<HorzScaleItem>(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: InternalSeriesMarker<TimePointIndex>,
	seriesData: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType],
	offsets: Offsets,
	shapeMargin: number,
	series: ISeriesApi<SeriesType, HorzScaleItem>
): void {
	// Get prices from series data
	const prices = getPricesFromData(seriesData);
	if (prices === null) {
		return;
	}
	// Only destructure the properties we need
	const { highPrice, lowPrice } = prices;
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const shapeSize = calculateShapeHeight(sizeMultiplier);
	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;

	// Position the marker based on its position property
	let y: Coordinate | null = null;

	switch (marker.position) {
		case 'aboveBar':
			y = positionAboveBar(series, highPrice, halfSize, offsets, shapeSize, shapeMargin);
			break;
		case 'belowBar':
			y = positionBelowBar(series, lowPrice, halfSize, offsets, shapeSize, shapeMargin);
			break;
		case 'atPriceTop':
		case 'atPriceBottom':
		case 'atPriceMiddle':
			// Only call positionAtPrice if marker.price is defined
			if (marker.price !== undefined) {
				y = positionAtPrice(series, marker.price, marker.position, halfSize);
			}
			break;
		// case 'inBar':
		// 	y = positionInBar(series, inBarPrice, halfSize, offsets, shapeSize, shapeMargin);
		// 	break;
	}

	if (y !== null) {
		rendererItem.y = y;
		if (rendererItem.text !== undefined) {
			rendererItem.text.y = y;
		}
	}
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
	// If marker has a price property, prioritize exact price positioning
	if (marker.price !== undefined) {
		// We don't need to pass the y coordinate - positionMarkerAtPrice will get it fresh
		if (positionMarkerAtPrice(rendererItem, marker, null, series)) {
			// Successfully positioned using price, we're done
			return;
		}
		// Only if price-to-coordinate conversion fails, fall back to bar positioning
	}

	// Position based on bar data
	positionMarkerOnBar(rendererItem, marker, seriesData, offsets, shapeMargin, series);
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
		/* eslint-disable no-trailing-spaces */
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

		// Force a price scale update before positioning markers
		// This ensures the price scale is fully up to date
		this._series.priceScale().applyOptions({});
		
		let prevTimeIndex = NaN;
		const shapeMargin = calculateShapeMargin(timeScale.options().barSpacing);
		const offsets: Offsets = {
			aboveBar: shapeMargin,
			belowBar: shapeMargin,
		};

		this._data.visibleRange = visibleTimedValues(this._data.items, visibleBarsRange, true);
		
		// Process items in two passes:
		// First pass: calculate x positions and prepare text
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
		}
		
		// Second pass: calculate y positions (now that all elements are known to the chart)
		for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
			const marker = seriesMarkers[index];
			const rendererItem = this._data.items[index];
			
			const dataAt = ensureNotNull(this._series.dataByIndex(marker.time, -1));
			if (dataAt === null) {
				continue;
			}
			
			// Calculate Y positions with the latest price scale
			fillSizeAndY<HorzScaleItem>(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, this._series, this._chart);
		}

		this._invalidated = false;
	}
}
