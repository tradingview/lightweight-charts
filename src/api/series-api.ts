import { ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, merge } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { PlotRowSearchMode } from '../model/plot-list';
import { PriceLineOptions } from '../model/price-line-options';
import { RangeImpl } from '../model/range-impl';
import { Series, SeriesPartialOptionsInternal } from '../model/series';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Logical, Range, TimePoint, TimePointIndex } from '../model/time-data';
import { TimeScaleVisibleRange } from '../model/time-scale-visible-range';

import { IPriceScaleApiProvider } from './chart-api';
import { DataUpdatesConsumer, SeriesDataItemTypeMap, Time } from './data-consumer';
import { convertTime } from './data-layer';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';
import { BarsInfo, IPriceFormatter, ISeriesApi } from './iseries-api';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';

function migrateOptions<TSeriesType extends SeriesType>(options: SeriesPartialOptionsMap[TSeriesType]): SeriesPartialOptionsInternal<TSeriesType> {
	// tslint:disable-next-line:deprecation
	const { overlay, ...res } = options;
	if (overlay) {
		res.priceScaleId = '';
	}
	return res;
}

export class SeriesApi<TSeriesType extends SeriesType> implements ISeriesApi<TSeriesType>, IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>;

	private readonly _priceScaleApiProvider: IPriceScaleApiProvider;

	public constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>, priceScaleApiProvider: IPriceScaleApiProvider) {
		this._series = series;
		this._dataUpdatesConsumer = dataUpdatesConsumer;
		this._priceScaleApiProvider = priceScaleApiProvider;
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

	public priceToCoordinate(price: number): Coordinate | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}

		return this._series.priceScale().priceToCoordinate(price, firstValue.value);
	}

	public coordinateToPrice(coordinate: number): BarPrice | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}
		return this._series.priceScale().coordinateToPrice(coordinate as Coordinate, firstValue.value);
	}

	// tslint:disable-next-line:cyclomatic-complexity
	public barsInLogicalRange(range: Range<number> | null): BarsInfo | null {
		if (range === null) {
			return null;
		}

		// we use TimeScaleVisibleRange here to convert LogicalRange to strict range properly
		const correctedRange = new TimeScaleVisibleRange(
			new RangeImpl(range.from as Logical, range.to as Logical)
		).strictRange() as RangeImpl<TimePointIndex>;

		const bars = this._series.data().bars();
		if (bars.isEmpty()) {
			return null;
		}

		const dataFirstBarInRange = bars.search(correctedRange.left(), PlotRowSearchMode.NearestRight);
		const dataLastBarInRange = bars.search(correctedRange.right(), PlotRowSearchMode.NearestLeft);

		const dataFirstIndex = ensureNotNull(bars.firstIndex());
		const dataLastIndex = ensureNotNull(bars.lastIndex());

		// this means that we request data in the data gap
		// e.g. let's say we have series with data [0..10, 30..60]
		// and we request bars info in range [15, 25]
		// thus, dataFirstBarInRange will be with index 30 and dataLastBarInRange with 10
		if (dataFirstBarInRange !== null && dataLastBarInRange !== null && dataFirstBarInRange.index > dataLastBarInRange.index) {
			return {
				barsBefore: range.from - dataFirstIndex,
				barsAfter: dataLastIndex - range.to,
			};
		}

		const barsBefore = (dataFirstBarInRange === null || dataFirstBarInRange.index === dataFirstIndex)
			? range.from - dataFirstIndex
			: dataFirstBarInRange.index - dataFirstIndex;

		const barsAfter = (dataLastBarInRange === null || dataLastBarInRange.index === dataLastIndex)
			? dataLastIndex - range.to
			: dataLastIndex - dataLastBarInRange.index;

		const result: BarsInfo = { barsBefore, barsAfter };

		// actually they can't exist separately
		if (dataFirstBarInRange !== null && dataLastBarInRange !== null) {
			result.from = dataFirstBarInRange.time.businessDay || dataFirstBarInRange.time.timestamp;
			result.to = dataLastBarInRange.time.businessDay || dataLastBarInRange.time.timestamp;
		}

		return result;
	}

	public setData(data: SeriesDataItemTypeMap[TSeriesType][]): void {
		this._dataUpdatesConsumer.applyNewData(this._series, data);
	}

	public update(bar: SeriesDataItemTypeMap[TSeriesType]): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}

	public setMarkers(data: SeriesMarker<Time>[]): void {
		const convertedMarkers = data.map<SeriesMarker<TimePoint>>((marker: SeriesMarker<Time>) => ({
			...marker,
			time: convertTime(marker.time),
		}));
		this._series.setMarkers(convertedMarkers);
	}

	public applyOptions(options: SeriesPartialOptionsMap[TSeriesType]): void {
		const migratedOptions = migrateOptions(options);
		this._series.applyOptions(migratedOptions);
	}

	public options(): Readonly<SeriesOptionsMap[TSeriesType]> {
		return clone(this._series.options());
	}

	public priceScale(): IPriceScaleApi {
		return this._priceScaleApiProvider.priceScale(this._series.priceScale().id());
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
