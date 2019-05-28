import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';

export interface IPriceFormatter {
	format(price: BarPrice): string;
}

export interface ISeriesApi {
	priceFormatter(): IPriceFormatter;
	priceToCoordinate(price: BarPrice): Coordinate | null;
}
