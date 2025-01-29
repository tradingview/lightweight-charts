import { BarPrice, BarPrices } from './bar';
import { Coordinate } from './coordinate';
import { IPriceDataSource } from './iprice-data-source';
import { PriceScale } from './price-scale';
import { ISeriesBarColorer } from './series-bar-colorer';
import { SeriesPlotList } from './series-data';
import { SeriesOptionsMap, SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

export interface LastValueDataResultWithoutData {
	noData: true;
}
export interface LastValueDataResultWithData {
	noData: false;

	price: number;
	text: string;
	formattedPriceAbsolute: string;
	formattedPricePercentage: string;
	color: string;
	coordinate: Coordinate;
	index: TimePointIndex;
}

export type LastValueDataResult = LastValueDataResultWithoutData | LastValueDataResultWithData;

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
	visible(): boolean;
	options(): Readonly<SeriesOptionsMap[T]>;
	title(): string;
	priceScale(): PriceScale;
	lastValueData(globalLast: boolean): LastValueDataResult;
	barColorer(): ISeriesBarColorer<T>;
	markerDataAtIndex(index: TimePointIndex): MarkerData | null;
	dataAt(time: TimePointIndex): SeriesDataAtTypeMap[SeriesType] | null;
	fulfilledIndices(): readonly TimePointIndex[];
}
