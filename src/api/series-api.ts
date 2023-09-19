import { IPriceFormatter } from '../formatters/iprice-formatter';

import { ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { clone, merge } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { DataUpdatesConsumer, SeriesDataItemTypeMap, WhitespaceData } from '../model/data-consumer';
import { checkItemsAreOrdered, checkPriceLineOptions, checkSeriesValuesType } from '../model/data-validators';
import { IHorzScaleBehavior, InternalHorzScaleItem } from '../model/ihorz-scale-behavior';
import { ISeriesPrimitiveBase } from '../model/iseries-primitive';
import { MismatchDirection } from '../model/plot-list';
import { CreatePriceLineOptions, PriceLineOptions } from '../model/price-line-options';
import { RangeImpl } from '../model/range-impl';
import { Series } from '../model/series';
import { SeriesPlotRow } from '../model/series-data';
import { convertSeriesMarker, SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Logical, Range, TimePointIndex } from '../model/time-data';
import { TimeScaleVisibleRange } from '../model/time-scale-visible-range';

import { IPriceScaleApiProvider } from './chart-api';
import { getSeriesDataCreator } from './get-series-data-creator';
import { type IChartApiBase } from './ichart-api';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';
import { BarsInfo, DataChangedHandler, DataChangedScope, ISeriesApi } from './iseries-api';
import { ISeriesPrimitive } from './iseries-primitive-api';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';

export class SeriesApi<
	TSeriesType extends SeriesType,
	HorzScaleItem,
	TData extends WhitespaceData<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType],
	TOptions extends SeriesOptionsMap[TSeriesType] = SeriesOptionsMap[TSeriesType],
	TPartialOptions extends SeriesPartialOptionsMap[TSeriesType] = SeriesPartialOptionsMap[TSeriesType]
> implements
		ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>,
		IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType, HorzScaleItem>;
	protected readonly _chartApi: IChartApiBase<HorzScaleItem>;

	private readonly _priceScaleApiProvider: IPriceScaleApiProvider<HorzScaleItem>;
	private readonly _horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>;
	private readonly _dataChangedDelegate: Delegate<DataChangedScope> = new Delegate();

	public constructor(
		series: Series<TSeriesType>,
		dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType, HorzScaleItem>,
		priceScaleApiProvider: IPriceScaleApiProvider<HorzScaleItem>,
		chartApi: IChartApiBase<HorzScaleItem>,
		horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>
	) {
		this._series = series;
		this._dataUpdatesConsumer = dataUpdatesConsumer;
		this._priceScaleApiProvider = priceScaleApiProvider;
		this._horzScaleBehavior = horzScaleBehavior;
		this._chartApi = chartApi;
	}

	public destroy(): void {
		this._dataChangedDelegate.destroy();
	}

	public priceFormatter(): IPriceFormatter {
		return this._series.formatter();
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

	public barsInLogicalRange(range: Range<number> | null): BarsInfo<HorzScaleItem> | null {
		if (range === null) {
			return null;
		}

		// we use TimeScaleVisibleRange here to convert LogicalRange to strict range properly
		const correctedRange = new TimeScaleVisibleRange(
			new RangeImpl(range.from as Logical, range.to as Logical)
		).strictRange() as RangeImpl<TimePointIndex>;

		const bars = this._series.bars();
		if (bars.isEmpty()) {
			return null;
		}

		const dataFirstBarInRange = bars.search(correctedRange.left(), MismatchDirection.NearestRight);
		const dataLastBarInRange = bars.search(correctedRange.right(), MismatchDirection.NearestLeft);

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

		const result: BarsInfo<HorzScaleItem> = { barsBefore, barsAfter };

		// actually they can't exist separately
		if (dataFirstBarInRange !== null && dataLastBarInRange !== null) {
			result.from = dataFirstBarInRange.originalTime as HorzScaleItem;
			result.to = dataLastBarInRange.originalTime as HorzScaleItem;
		}

		return result;
	}

	public setData(data: TData[]): void {
		checkItemsAreOrdered(data, this._horzScaleBehavior);
		checkSeriesValuesType(this._series.seriesType(), data);

		this._dataUpdatesConsumer.applyNewData(this._series, data);
		this._onDataChanged('full');
	}

	public update(bar: TData): void {
		checkSeriesValuesType(this._series.seriesType(), [bar]);

		this._dataUpdatesConsumer.updateData(this._series, bar);
		this._onDataChanged('update');
	}

	public dataByIndex(logicalIndex: number, mismatchDirection?: MismatchDirection): TData | null {
		const data = this._series.bars().search(logicalIndex as unknown as TimePointIndex, mismatchDirection);
		if (data === null) {
			// actually it can be a whitespace
			return null;
		}

		const creator = getSeriesDataCreator<TSeriesType, HorzScaleItem>(this.seriesType());
		return creator(data) as TData | null;
	}

	public data(): readonly TData[] {
		const seriesCreator = getSeriesDataCreator(this.seriesType());
		const rows = this._series.bars().rows();
		return rows.map((row: SeriesPlotRow<TSeriesType>) => seriesCreator(row) as TData);
	}

	public subscribeDataChanged(handler: DataChangedHandler): void {
		this._dataChangedDelegate.subscribe(handler);
	}

	public unsubscribeDataChanged(handler: DataChangedHandler): void {
		this._dataChangedDelegate.unsubscribe(handler);
	}

	public setMarkers(data: SeriesMarker<HorzScaleItem>[]): void {
		checkItemsAreOrdered(data, this._horzScaleBehavior, true);

		const convertedMarkers = data.map((marker: SeriesMarker<HorzScaleItem>) =>
			convertSeriesMarker<HorzScaleItem, InternalHorzScaleItem>(marker, this._horzScaleBehavior.convertHorzItemToInternal(marker.time), marker.time)
		);
		this._series.setMarkers(convertedMarkers);
	}

	public markers(): SeriesMarker<HorzScaleItem>[] {
		return this._series.markers().map<SeriesMarker<HorzScaleItem>>((internalItem: SeriesMarker<InternalHorzScaleItem>) => {
			return convertSeriesMarker<InternalHorzScaleItem, HorzScaleItem>(internalItem, internalItem.originalTime as HorzScaleItem, undefined);
		});
	}

	public applyOptions(options: TPartialOptions): void {
		this._series.applyOptions(options);
	}

	public options(): Readonly<TOptions> {
		return clone(this._series.options() as TOptions);
	}

	public priceScale(): IPriceScaleApi {
		return this._priceScaleApiProvider.priceScale(this._series.priceScale().id());
	}

	public createPriceLine(options: CreatePriceLineOptions): IPriceLine {
		checkPriceLineOptions(options);

		const strictOptions = merge(clone(priceLineOptionsDefaults), options) as PriceLineOptions;
		const priceLine = this._series.createPriceLine(strictOptions);
		return new PriceLine(priceLine);
	}

	public removePriceLine(line: IPriceLine): void {
		this._series.removePriceLine((line as PriceLine).priceLine());
	}

	public seriesType(): TSeriesType {
		return this._series.seriesType();
	}

	public attachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void {
		// at this point we cast the generic to unknown because we
		// don't want the model to know the types of the API (◑_◑)
		this._series.attachPrimitive(primitive as ISeriesPrimitiveBase<unknown>);
		if (primitive.attached) {
			primitive.attached({
				chart: this._chartApi,
				series: this,
				requestUpdate: () => this._series.model().fullUpdate(),
			});
		}
	}

	public detachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void {
		this._series.detachPrimitive(primitive as ISeriesPrimitiveBase<unknown>);
		if (primitive.detached) {
			primitive.detached();
		}
	}

	private _onDataChanged(scope: DataChangedScope): void {
		if (this._dataChangedDelegate.hasListeners()) {
			this._dataChangedDelegate.fire(scope);
		}
	}
}
