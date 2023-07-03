import { createChart, customSeriesDefaultOptions } from '../../src';
import { CandlestickData, WhitespaceData } from '../../src/model/data-consumer';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { CustomData, CustomSeriesPricePlotValues, ICustomSeriesPaneRenderer, ICustomSeriesPaneView, PaneRendererCustomData } from '../../src/model/icustom-series';
import { CustomSeriesOptions } from '../../src/model/series-options';

interface WhiskerBoxSeriesOptions extends CustomSeriesOptions {
	whiskerColor: string;
	lowerQuartileFill: string;
	upperQuartileFill: string;
	outlierColor: string;
}

const defaultOptions: WhiskerBoxSeriesOptions = {
	...customSeriesDefaultOptions,
	whiskerColor: '',
	lowerQuartileFill: '',
	upperQuartileFill: '',
	outlierColor: '',
} as const;

interface WhiskerData extends CustomData {
	quartiles: [
		number,
		number,
		number,
		number,
		number
	];
	outliers?: number[];
}

class WhiskerBoxSeries<TData extends WhiskerData>
	implements ICustomSeriesPaneView<Time, TData, WhiskerBoxSeriesOptions> {
	public priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
		return [];
	}

	public isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<TData>).quartiles === undefined;
	}

	public renderer(): ICustomSeriesPaneRenderer {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		return {} as ICustomSeriesPaneRenderer;
	}

	public update(
		data: PaneRendererCustomData<Time, TData>,
		options: WhiskerBoxSeriesOptions
	): void {}

	public defaultOptions(): WhiskerBoxSeriesOptions {
		return defaultOptions;
	}
}

const chart = createChart('anything');
const customSeriesView = new WhiskerBoxSeries();

// @ts-expect-error invalid property
const failSeries = chart.addCustomSeries(customSeriesView, { badOption: 123 });
// @ts-expect-error invalid value
const failSeries2 = chart.addCustomSeries(customSeriesView, { whiskerColor: 123 });

const series = chart.addCustomSeries(customSeriesView, { whiskerColor: 'string' });

const data: (WhiskerData | WhitespaceData)[] = [
    { time: 12345 as Time }, // whitespace
    // @ts-expect-error invalid data
    { time: 12345 as Time, value: 1234 },
    { time: 12345 as Time, quartiles: [1, 2, 3, 4, 5] },
];

series.setData(data);

series.update({ time: 12345 as Time });
// @ts-expect-error invalid data
series.update({ time: 12345 as Time, value: 1234 });
series.update({ time: 12345 as Time, quartiles: [1, 2, 3, 4, 5] });

const notGreatData: CandlestickData[] = [{ time: 12345 as Time, open: 1234, high: 1234, low: 1234, close: 1234 }];
series.setData(notGreatData); // this can still pass because it has time and thus could be whitespace

const badData = [{ open: 1234, high: 1234, low: 1234, close: 1234 }] as const;
// @ts-expect-error data should have at least `time` property
series.setData(badData);

const options: Readonly<WhiskerBoxSeriesOptions> = series.options();
// @ts-expect-error should be readonly
options.baseLineColor = 'orange';

// @ts-expect-error invalid property
series.applyOptions({ badOption: 123 });
// @ts-expect-error invalid value
series.applyOptions({ whiskerColor: 123 });
series.applyOptions({ whiskerColor: 'string' });

type ExpectedDataType = WhiskerData | WhitespaceData;
export const dataPoint: ExpectedDataType | null = series.dataByIndex(1);

const dataSet: readonly ExpectedDataType[] = series.data();
if (dataSet) {
    // @ts-expect-error readonly array
	dataSet[0] = { time: 12 as Time };
}
// @ts-expect-error readonly array
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
dataSet.push({ time: 12 as Time });
