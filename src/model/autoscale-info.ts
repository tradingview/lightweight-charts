import { Coordinate } from './coordinate';
import { PriceRange } from './price-range';

export class AutoscaleInfo {
	public readonly priceRange: PriceRange | null;
	public readonly marginBelow: Coordinate;
	public readonly marginAbove: Coordinate;

	public constructor(priceRange: PriceRange | null, marginBelow: Coordinate = 0 as Coordinate, marginAbove: Coordinate = 0 as Coordinate) {
		this.priceRange = priceRange;
		this.marginBelow = marginBelow;
		this.marginAbove = marginAbove;
	}

	public merge(info: AutoscaleInfo): AutoscaleInfo {
		const newRange = (this.priceRange === null) ? info.priceRange : this.priceRange.merge(info.priceRange);
		return new AutoscaleInfo(
			newRange,
			(this.marginBelow + info.marginBelow) as Coordinate,
			(this.marginAbove + info.marginAbove) as Coordinate
		);
	}
}
