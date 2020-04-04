import { IDestroyable } from '../helpers/idestroyable';
import { clone, merge } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { PriceLineOptions } from '../model/price-line-options';
import { Series } from '../model/series';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { TimePointIndex, TimePointIndexRange } from '../model/time-data';

import { DataUpdatesConsumer, SeriesDataItemTypeMap, Time } from './data-consumer';
import { convertTime } from './data-layer';
import { IPriceLine } from './iprice-line';
import { BarsInfo, IPriceFormatter, ISeriesApi } from './iseries-api';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';

export class SeriesApi<TSeriesType extends SeriesType> implements ISeriesApi<TSeriesType>, IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>;

	public constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>) {
		this._series = series;
		this._dataUpdatesConsumer = dataUpdatesConsumer;
	}

	public destroy(): void {
		delete this._series;
		delete this._dataUpdatesConsumer;
	}

	public priceFormatter(): IPriceFormatter {
		return this._series.formatter();
	}

	public series(): Series<TSeriesType> {
		return this._series;
	}

	public priceToCoordinate(price: BarPrice): Coordinate | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}

		return this._series.priceScale().priceToCoordinate(price, firstValue.value);
	}

	public coordinateToPrice(coordinate: Coordinate): BarPrice | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}
		return this._series.priceScale().coordinateToPrice(coordinate, firstValue.value);
	}

	public barsInIndexRange(range: TimePointIndexRange): BarsInfo | null {
		const visibleRange = this._series.model().timeScale().timeRangeForIndexRange(range);

		const rangeStart = Math.round(range.from) as TimePointIndex;
		const rangeEnd = Math.round(range.to) as TimePointIndex;

		const bars = this._series.data().bars();

		const firstBar = bars.search(rangeStart);
		const lastBar = bars.search(rangeEnd);
		const firstIndex = bars.firstIndex() || 0;
		const lastIndex = bars.lastIndex() || 0;

		const barsBefore = (null !== firstBar)
			? firstBar.index - firstIndex
			: Math.min(lastIndex - firstIndex + 1, rangeStart - firstIndex)
		;

		const barsAfter = (null !== lastBar)
			? Math.min(lastIndex - firstIndex + 1, lastIndex - lastBar.index)
			: ((rangeEnd > lastIndex) ? (lastIndex - rangeEnd) : lastIndex - firstIndex + 1)
		;

		return {
			...visibleRange,
			barsBefore: barsBefore as TimePointIndex,
			barsAfter: barsAfter as TimePointIndex,
		};
	}

	public setData(data: SeriesDataItemTypeMap[TSeriesType][]): void {
		this._dataUpdatesConsumer.applyNewData(this._series, data);
	}

	public update(bar: SeriesDataItemTypeMap[TSeriesType]): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}

	public setMarkers(data: SeriesMarker<Time>[]): void {
		const convertedMarkers = data.map((marker: SeriesMarker<Time>) => ({
			...marker,
			time: convertTime(marker.time),
		}));
		this._series.setMarkers(convertedMarkers);
	}

	public applyOptions(options: SeriesPartialOptionsMap[TSeriesType]): void {
		this._series.applyOptions(options);
	}

	public options(): Readonly<SeriesOptionsMap[TSeriesType]> {
		return clone(this._series.options());
	}

	public createPriceLine(options: PriceLineOptions): IPriceLine {
		const strictOptions = merge(clone(priceLineOptionsDefaults), options) as PriceLineOptions;
		const priceLine = this._series.createPriceLine(strictOptions);
		return new PriceLine(priceLine);
	}

	public removePriceLine(line: IPriceLine): void {
		this._series.removePriceLine((line as PriceLine).priceLine());
	}
}
