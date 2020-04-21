import { Coordinate } from './coordinate';
import { PriceRangeImpl } from './price-range-impl';

export interface AutoScaleMargins {
	below: Coordinate;
	above: Coordinate;
}

export interface AutoscaleInfo {
	priceRange: PriceRangeImpl | null;
	margins: AutoScaleMargins | null;
}
