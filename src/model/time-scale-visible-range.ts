import { Range } from './range';
import { Logical, TimePointIndex } from './time-data';

export class TimeScaleVisibleRange {
	private readonly _logicalRange: Range<Logical> | null;

	public constructor(logicalRange: Range<Logical> | null) {
		this._logicalRange = logicalRange;
	}

	public strictRange(): Range<TimePointIndex> | null {
		if (this._logicalRange === null) {
			return null;
		}

		return new Range(
			Math.round(this._logicalRange.left()) as TimePointIndex,
			Math.round(this._logicalRange.right()) as TimePointIndex
		);
	}

	public logicalRange(): Range<Logical> | null {
		return this._logicalRange;
	}

	public isValid(): boolean {
		return this._logicalRange !== null;
	}

	public static invalid(): TimeScaleVisibleRange {
		return new TimeScaleVisibleRange(null);
	}
}
