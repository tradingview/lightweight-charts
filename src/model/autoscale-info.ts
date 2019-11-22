import { Coordinate } from './coordinate';
import { PriceRange } from './price-range';

export interface AutoScaleMargins {
	below: Coordinate;
	above: Coordinate;
}

export interface AutoscaleInfo {
	priceRange: PriceRange | null;
	margins: AutoScaleMargins | null;
}
