import { createChartEx, customSeriesDefaultOptions } from '../../src';
import { CandlestickData, WhitespaceData } from '../../src/model/data-consumer';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { CustomData, CustomSeriesPricePlotValues, ICustomSeriesPaneRenderer, ICustomSeriesPaneView, PaneRendererCustomData } from '../../src/model/icustom-series';
import { IHorzScaleBehavior } from '../../src/model/ihorz-scale-behavior';
import { CustomSeriesOptions } from '../../src/model/series-options';

type HorizontalScaleType = number;

interface NonTimeSeriesOptions extends CustomSeriesOptions {
	testOption: string;
}

const defaultOptions: NonTimeSeriesOptions = {
	...customSeriesDefaultOptions,
	testOption: 'hello',
} as const;

interface NonTimeData extends CustomData<HorizontalScaleType> {
	priceY: number;
}

class NonTimeSeries	implements ICustomSeriesPaneView<HorizontalScaleType, NonTimeData, NonTimeSeriesOptions> {
	public priceValueBuilder(plotRow: NonTimeData): CustomSeriesPricePlotValues {
		return [];
	}

	public isWhitespace(data: NonTimeData | WhitespaceData<HorizontalScaleType>): data is WhitespaceData<HorizontalScaleType> {
		return (data as Partial<NonTimeData>).priceY === undefined;
	}

	public renderer(): ICustomSeriesPaneRenderer {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		return {} as ICustomSeriesPaneRenderer;
	}

	public update(
		data: PaneRendererCustomData<HorizontalScaleType, NonTimeData>,
		options: NonTimeSeriesOptions
	): void {}

	public defaultOptions(): NonTimeSeriesOptions {
		return defaultOptions;
	}
}

// @ts-expect-error Mock Class
class MyHorizontalScaleBehaviour implements IHorzScaleBehavior<HorizontalScaleType> {
	public isMock(): boolean {
		return true;
	}
}
const horizontalScaleBehaviourMock = new MyHorizontalScaleBehaviour();

// @ts-expect-error Mock Class
const chart = createChartEx<HorizontalScaleType, MyHorizontalScaleBehaviour>('anything', horizontalScaleBehaviourMock);
const customSeriesView = (new NonTimeSeries()) as ICustomSeriesPaneView<HorizontalScaleType, NonTimeData, NonTimeSeriesOptions>;

// @ts-expect-error invalid property
const failSeries = chart.addCustomSeries(customSeriesView, { badOption: 123 });
// @ts-expect-error invalid value
const failSeries2 = chart.addCustomSeries(customSeriesView, { testOption: 123 });

const series = chart.addCustomSeries(customSeriesView, { testOption: 'string' });

const data: (NonTimeData | WhitespaceData<HorizontalScaleType>)[] = [
    { time: 12345 }, // whitespace
    // @ts-expect-error invalid data
    { time: 12345, value: 1234 },
    { time: 12345, priceY: 12345 },
];

series.setData(data);

series.update({ time: 12345 });
// @ts-expect-error invalid data
series.update({ time: 12345, value: 1234 });
series.update({ time: 12345, priceY: 12345 });

const notGreatData: CandlestickData[] = [{ time: 12345 as Time, open: 1234, high: 1234, low: 1234, close: 1234 }];
// @ts-expect-error time is not compatible anymore, type Time isn't always a number
series.setData(notGreatData);

const badData = [{ open: 1234, high: 1234, low: 1234, close: 1234 }] as const;
// @ts-expect-error data should have at least `time` property
series.setData(badData);

const options: Readonly<NonTimeSeriesOptions> = series.options();
// @ts-expect-error not a valid option
options.baseLineColor = 'orange';

// @ts-expect-error invalid property
series.applyOptions({ badOption: 123 });
// @ts-expect-error invalid value
series.applyOptions({ testOption: 123 });
series.applyOptions({ testOption: 'string' });

type ExpectedDataType = NonTimeData | WhitespaceData<HorizontalScaleType>;
export const dataPoint: ExpectedDataType | null = series.dataByIndex(1);

const dataSet: readonly ExpectedDataType[] = series.data();
if (dataSet) {
    // @ts-expect-error readonly array
	dataSet[0] = { time: 12 };
}
// @ts-expect-error readonly array
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
dataSet.push({ time: 12 });
