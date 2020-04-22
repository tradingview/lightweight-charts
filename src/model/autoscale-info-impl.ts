import { Coordinate } from './coordinate';
import { PriceRangeImpl } from './price-range-impl';

export interface AutoScaleMargins {
	below: Coordinate;
	above: Coordinate;
}

export interface AutoscaleInfoImpl {
	priceRange: PriceRangeImpl | null;
	margins: AutoScaleMargins | null;
}
