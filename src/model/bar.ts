import { Nominal } from '../helpers/nominal';

import { Coordinate } from './coordinate';

export type BarPrice = Nominal<number, 'BarPrice'>;

export interface BarPrices {
	open: BarPrice;
	high: BarPrice;
	low: BarPrice;
	close: BarPrice;
}

export interface BarCoordinates {
	openY: Coordinate;
	highY: Coordinate;
	lowY: Coordinate;
	closeY: Coordinate;
}

interface BarPriceInfo {
	value: BarPrice;
	change: number | undefined;
}

interface BarPricesInfo extends BarPrices {
	change: number | undefined;
}

export interface BarPriceInfoAtTypeMap {
	Bar: BarPricesInfo;
	Candlestick: BarPricesInfo;
	Area: BarPriceInfo;
	Line: BarPriceInfo;
	Histogram: BarPriceInfo;
}
