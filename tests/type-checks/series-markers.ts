import { createChart, createChartEx, createSeriesMarkers, LineSeries } from '../../src';
import { Mutable } from '../../src/helpers/mutable';
import { ChartOptionsImpl } from '../../src/model/chart-model';
import { SeriesDataItemTypeMap } from '../../src/model/data-consumer';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { LocalizationOptions } from '../../src/model/localization-options';
import { SeriesType } from '../../src/model/series-options';
import { TickMark } from '../../src/model/tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../../src/model/time-data';
import { TimeMark } from '../../src/model/time-scale';

const chart = createChart('container');

const mainSeries = chart.addSeries(LineSeries);
mainSeries.setData([]);

const seriesMarkersPrimitive = createSeriesMarkers(mainSeries, [
	{
		color: 'green',
		position: 'inBar',
		shape: 'arrowDown',
		time: 1556880900 as Time,
	},
]);

seriesMarkersPrimitive.setMarkers([
	{
		color: 'red',
		position: 'aboveBar',
		shape: 'arrowDown',
		time: 1556880900 as Time,
	},
]);

type HorizontalScaleType = number;

class HorzScaleBehaviorPrice implements IHorzScaleBehavior<HorizontalScaleType> {
	private _options: ChartOptionsImpl<HorizontalScaleType>;

	public constructor() {
		this._options = {} as unknown as ChartOptionsImpl<HorizontalScaleType>;
	}

	public options(): ChartOptionsImpl<HorizontalScaleType> {
		return this._options;
	}

	public setOptions(options: ChartOptionsImpl<HorizontalScaleType>): void {
		this._options = options;
	}

	public preprocessData(data: DataItem<HorizontalScaleType> | DataItem<HorizontalScaleType>[]): void {}

	public updateFormatter(options: LocalizationOptions<HorizontalScaleType>): void {
		if (!this._options) {
			return;
		}
		this._options.localization = options;
	}

	public createConverterToInternalObj(data: SeriesDataItemTypeMap<HorizontalScaleType>[SeriesType][]): HorzScaleItemConverterToInternalObj<HorizontalScaleType> {
		return (price: number): InternalHorzScaleItem => price as unknown as InternalHorzScaleItem;
	}

	// @ts-expect-error Mock Method
	public key(internalItem: InternalHorzScaleItem | HorizontalScaleType): InternalHorzScaleItem {
		return internalItem as unknown as InternalHorzScaleItem;
	}

	public cacheKey(internalItem: InternalHorzScaleItem): number {
		return internalItem as unknown as number;
	}

	public convertHorzItemToInternal(item: HorizontalScaleType): InternalHorzScaleItem {
		return item as unknown as InternalHorzScaleItem;
	}

	public formatHorzItem(item: InternalHorzScaleItem): string {
		return (item as unknown as HorizontalScaleType).toFixed(this._precision());
	}

	public formatTickmark(item: TickMark, localizationOptions: LocalizationOptions<HorizontalScaleType>): string {
		return (item.time as unknown as HorizontalScaleType).toFixed(this._precision());
	}

	public maxTickMarkWeight(marks: TimeMark[]): TickMarkWeightValue {
		return marks[0].weight;
	}

	public fillWeightsForPoints(sortedTimePoints: readonly Mutable<TimeScalePoint>[], startIndex: number): void {
		return;
	}

	private _precision(): number {
		return 2;
	}
}
const horizontalScaleBehaviourMock = new HorzScaleBehaviorPrice();

// @ts-expect-error Mock Class
const nonDefaultChart = createChartEx<HorizontalScaleType, HorzScaleBehaviorPrice>('anything', horizontalScaleBehaviourMock);
const lineSeries = nonDefaultChart.addSeries(LineSeries);
lineSeries.setData([]);

const timeValue: HorizontalScaleType = 12345;
const markerApi = createSeriesMarkers(lineSeries, [
	{
		color: 'green',
		position: 'inBar',
		shape: 'arrowDown',
		time: timeValue,
	},
]);
markerApi.setMarkers([
	{
		color: 'red',
		position: 'aboveBar',
		shape: 'arrowDown',
		time: 1556880900,
	},
]);
