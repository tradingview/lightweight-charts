import { IChartApiBase } from '../../api/ichart-api';
import { ISeriesApi } from '../../api/iseries-api';

import { ensureNever, ensureNotNull } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';

import { Coordinate } from '../../model/coordinate';
import { AreaData, BarData, BaselineData, CandlestickData, HistogramData, LineData, SeriesDataItemTypeMap, SingleValueData } from '../../model/data-consumer';
import { IPrimitivePaneView, PrimitivePaneViewZOrder } from '../../model/ipane-primitive';
import { MismatchDirection } from '../../model/plot-list';
import { RangeImpl } from '../../model/range-impl';
import { SeriesType } from '../../model/series-options';
import { Logical, TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { UpdateType } from '../../views/pane/iupdatable-pane-view';

import { SeriesMarkersOptions } from './options';
import {
	SeriesMarkerRendererData,
	SeriesMarkerRendererDataItem,
	SeriesMarkersRenderer,
} from './renderer';
import { InternalSeriesMarker, SeriesMarkerPosition, SeriesMarkerPricePosition } from './types';
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

function isPriceMarker(position: SeriesMarkerPosition): position is SeriesMarkerPricePosition {
	return position === 'atPriceTop' || position === 'atPriceBottom' || position === 'atPriceMiddle';
}

function getPrice(seriesData: SeriesDataItemTypeMap<unknown>[SeriesType], marker: InternalSeriesMarker<TimePointIndex>, isInverted: boolean): number | undefined {
	if (isPriceMarker(marker.position) && marker.price !== undefined) {
		return marker.price;
	}
	if (isValueData(seriesData)) {
		return seriesData.value;
	}
	if (isOhlcData(seriesData)) {
		if (marker.position === 'inBar') {
			return seriesData.close;
		}
		if (marker.position === 'aboveBar') {
			if (!isInverted) {
				return seriesData.high;
			}
			return seriesData.low;
		}
		if (marker.position === 'belowBar') {
			if (!isInverted) {
				return seriesData.low;
			}
			return seriesData.high;
		}
	}
	return;
}

// eslint-disable-next-line max-params, complexity
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
	const price = getPrice(seriesData, marker, series.priceScale().options().invertScale);
	if (price === undefined) {
		return;
	}
	const ignoreOffset = isPriceMarker(marker.position);
	const timeScale = chart.timeScale();
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const shapeSize = calculateShapeHeight(timeScale.options().barSpacing) * sizeMultiplier;

	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;

	const position = marker.position;
	switch (position) {
		case 'inBar':
		case 'atPriceMiddle': {
			rendererItem.y = ensureNotNull(series.priceToCoordinate(price));
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
			}
			return;
		}
		case 'aboveBar':
		case 'atPriceTop': {
			const offset = ignoreOffset ? 0 : offsets.aboveBar;
			rendererItem.y = (ensureNotNull(series.priceToCoordinate(price)) - halfSize - offset) as Coordinate;
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				offsets.aboveBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			if (!ignoreOffset) {
				offsets.aboveBar += shapeSize + shapeMargin;
			}
			return;
		}
		case 'belowBar':
		case 'atPriceBottom': {
			const offset = ignoreOffset ? 0 : offsets.belowBar;
			rendererItem.y = (ensureNotNull(series.priceToCoordinate(price)) + halfSize + offset) as Coordinate;
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin)) as Coordinate;
				offsets.belowBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			if (!ignoreOffset) {
				offsets.belowBar += shapeSize + shapeMargin;
			}
			return;
		}
	}

	ensureNever(position);
}

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
	private _options: SeriesMarkersOptions;

	private _invalidated: boolean = true;
	private _dataInvalidated: boolean = true;

	private _renderer: SeriesMarkersRenderer = new SeriesMarkersRenderer();

	public constructor(series: ISeriesApi<SeriesType, HorzScaleItem>, chart: IChartApiBase<HorzScaleItem>, options: SeriesMarkersOptions) {
		this._series = series;
		this._chart = chart;
		this._data = {
			items: [],
			visibleRange: null,
		};
		this._options = options;
	}

	public renderer(): SeriesMarkersRenderer | null {
		if (!this._series.options().visible) {
			return null;
		}

		if (this._invalidated) {
			this._makeValid();
		}

		const layout = this._chart.options()['layout'];
		this._renderer.setParams(layout.fontSize, layout.fontFamily, this._options.zOrder);
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

	public updateOptions(options: SeriesMarkersOptions): void {
		this._invalidated = true;
		this._options = options;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._options.zOrder === 'aboveSeries' ? 'top' : this._options.zOrder;
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

			const dataAt = this._series.dataByIndex(marker.time, MismatchDirection.None);
			if (dataAt === null) {
				continue;
			}
			fillSizeAndY<HorzScaleItem>(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, this._series, this._chart);
		}

		this._invalidated = false;
	}
}
