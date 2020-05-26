import { RangeImpl } from './range-impl';
import { Logical, TimePointIndex } from './time-data';

export class TimeScaleVisibleRange {
	private readonly _logicalRange: RangeImpl<Logical> | null;

	public constructor(logicalRange: RangeImpl<Logical> | null) {
		this._logicalRange = logicalRange;
	}

	public strictRange(): RangeImpl<TimePointIndex> | null {
		if (this._logicalRange === null) {
			return null;
		}

		return new RangeImpl(
			Math.floor(this._logicalRange.left()) as TimePointIndex,
			Math.ceil(this._logicalRange.right()) as TimePointIndex
		);
	}

	public logicalRange(): RangeImpl<Logical> | null {
		return this._logicalRange;
	}

	public isValid(): boolean {
		return this._logicalRange !== null;
	}

	public static invalid(): TimeScaleVisibleRange {
		return new TimeScaleVisibleRange(null);
	}
}
