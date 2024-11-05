import {
	AreaSeries,
	BarSeries,
	BaselineSeries,
	CandlestickSeries,
	createChart,
	createChartEx,
	HistogramSeries,
	LineSeries,
} from '../../src';
import { Mutable } from '../../src/helpers/mutable';
import { ChartOptionsImpl } from '../../src/model/chart-model';
import { BarData, LineData, SeriesDataItemTypeMap, WhitespaceData } from '../../src/model/data-consumer';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { DataItem, HorzScaleItemConverterToInternalObj, IHorzScaleBehavior, InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { LocalizationOptions } from '../../src/model/localization-options';
import { BarSeriesOptions, LineSeriesOptions, SeriesType } from '../../src/model/series-options';
import { TickMark } from '../../src/model/tick-marks';
import { TickMarkWeightValue, TimeScalePoint } from '../../src/model/time-data';
import { TimeMark } from '../../src/model/time-scale';

const chart = createChart('container');

const lineSeries = chart.addSeries(LineSeries, { lineWidth: 2 });
lineSeries.setData([
	{
		time: '2018-12-03',
		value: 27.02,
	},
	{ time: '2018-12-04' },
	{
		time: '2018-12-08',
		value: 23.92,
	},
]);
lineSeries.applyOptions({ lineStyle: 0 });
// @ts-expect-error invalid value
lineSeries.applyOptions({ lineStyle: '1' });
// @ts-expect-error invalid property
lineSeries.applyOptions({ upColor: 'red' });
const areaSeries = chart.addSeries(AreaSeries);
areaSeries.setData([
	{ time: '2018-12-03', value: 27.02 },
	{ time: '2018-12-04' },
	{ time: '2018-12-08', value: 23.92 },
]);
areaSeries.setData([
	// @ts-expect-error wrong data type
	{ time: '2018-12-03', open: 27.02, high: 27.02, low: 27.02, close: 27.02 },
]);
const barSeries = chart.addSeries(BarSeries, { upColor: 'red' }, 1);
barSeries.setData([
	{ time: '2018-12-03', open: 27.02, high: 27.02, low: 27.02, close: 27.02 },
	{ time: '2018-12-04' },
	{ time: '2018-12-08', open: 23.92, high: 23.92, low: 23.92, close: 23.92 },
]);
barSeries.setData([
	// @ts-expect-error wrong data type
	{ time: '2018-12-03', value: 27.02 },
]);
barSeries.data() satisfies readonly (WhitespaceData<Time> | BarData<Time>)[];
barSeries.data() satisfies readonly (WhitespaceData<Time>)[];
// @ts-expect-error wrong data type
barSeries.data() satisfies readonly (LineData<Time>)[];
barSeries.options() satisfies Readonly<BarSeriesOptions>;
// @ts-expect-error wrong options type
barSeries.options() satisfies Readonly<LineSeriesOptions>;
const baselineSeries = chart.addSeries(BaselineSeries);
baselineSeries.setData([]);
const candlestickSeries = chart.addSeries(CandlestickSeries);
candlestickSeries.setData([]);

const histogramSeries = chart.addSeries(HistogramSeries);
histogramSeries.setData([]);

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
const lineSeries2 = nonDefaultChart.addSeries(LineSeries);
lineSeries2.setData([]);
