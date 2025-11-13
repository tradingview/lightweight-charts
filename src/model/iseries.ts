import { BarPrice, BarPrices } from './bar';
import { Coordinate } from './coordinate';
import { CustomConflationReducer } from './icustom-series';
import { IPriceDataSource } from './iprice-data-source';
import { PriceScale } from './price-scale';
import { ISeriesBarColorer } from './series-bar-colorer';
import { SeriesPlotList } from './series-data';
import { SeriesOptionsMap, SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

export interface LastValueDataInternalResultWithoutData {
	noData: true;
}
export interface LastValueDataInternalResultWithData {
	noData: false;

	price: number;
	text: string;
	formattedPriceAbsolute: string;
	formattedPricePercentage: string;
	color: string;
	coordinate: Coordinate;
	index: TimePointIndex;
}

export type LastValueDataInternalResult = LastValueDataInternalResultWithoutData | LastValueDataInternalResultWithData;

/** Represents last value data result of a series for plugins when there is no data */
export interface LastValueDataResultWithoutData {
	/**
	 * Indicates if the series has data.
	 */
	noData: true;
}

/** Represents last value data result of a series for plugins when there is data */
export interface LastValueDataResultWithData {
	/**
	 * Indicates if the series has data.
	 */
	noData: false;
	/**
	 * The last price of the series.
	 */
	price: number;
	/**
	 * The color of the last value.
	 */
	color: string;
}

/** Represents last value data result of a series for plugins */
export type LastValueDataResult = LastValueDataResultWithData | LastValueDataResultWithoutData;

export interface MarkerData {
	price: BarPrice;
	radius: number;
	borderColor: string | null;
	borderWidth: number;
	backgroundColor: string;
}

export interface SeriesDataAtTypeMap {
	Bar: BarPrices;
	Candlestick: BarPrices;
	Area: BarPrice;
	Baseline: BarPrice;
	Line: BarPrice;
	Histogram: BarPrice;
	Custom: BarPrice;
}

export interface ISeries<T extends SeriesType> extends IPriceDataSource {
	bars(): SeriesPlotList<T>;
	conflatedBars(): SeriesPlotList<T>;
	setCustomConflationReducer?(reducer: CustomConflationReducer<unknown>): void;
	visible(): boolean;
	options(): Readonly<SeriesOptionsMap[T]>;
	title(): string;
	priceScale(): PriceScale;
	lastValueData(globalLast: boolean): LastValueDataInternalResult;
	barColorer(): ISeriesBarColorer<T>;
	markerDataAtIndex(index: TimePointIndex): MarkerData | null;
	dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null;
	fulfilledIndices(): readonly TimePointIndex[];
}
