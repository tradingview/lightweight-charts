import { min } from '../helpers/mathex';

import { Coordinate } from './coordinate';
import { PriceMark, PriceScale } from './price-scale';
import { PriceTickSpanCalculator } from './price-tick-span-calculator';

export type CoordinateToLogicalConverter = (x: number, firstValue: number) => number;
export type LogicalToCoordinateConverter = (x: number, firstValue: number, keepItFloat: boolean) => number;

const TICK_DENSITY = 2.5;

export interface CurrentAndFullMarks {
	withoutFractionalZerosIfPossible: PriceMark[];
	full: PriceMark[];
}

export class PriceTickMarkBuilder {
	private _marks: CurrentAndFullMarks | null = null;
	private _base: number;
	private readonly _priceScale: PriceScale;
	private readonly _coordinateToLogicalFunc: CoordinateToLogicalConverter;
	private readonly _logicalToCoordinateFunc: LogicalToCoordinateConverter;

	public constructor(
		priceScale: PriceScale,
		base: number,
		coordinateToLogicalFunc: CoordinateToLogicalConverter,
		logicalToCoordinateFunc: LogicalToCoordinateConverter
	) {
		this._priceScale = priceScale;
		this._base = base;
		this._coordinateToLogicalFunc = coordinateToLogicalFunc;
		this._logicalToCoordinateFunc = logicalToCoordinateFunc;
	}

	public tickSpan(high: number, low: number): number {
		if (high < low) {
			throw new Error('high < low');
		}

		const scaleHeight = this._priceScale.height();
		const markHeight = this._tickMarkHeight();

		const maxTickSpan = (high - low) * markHeight / scaleHeight;

		const spanCalculator1 = new PriceTickSpanCalculator(this._base, [2, 2.5, 2]);
		const spanCalculator2 = new PriceTickSpanCalculator(this._base, [2, 2, 2.5]);
		const spanCalculator3 = new PriceTickSpanCalculator(this._base, [2.5, 2, 2]);

		const spans: number[] = [];

		spans.push(
			spanCalculator1.tickSpan(high, low, maxTickSpan),
			spanCalculator2.tickSpan(high, low, maxTickSpan),
			spanCalculator3.tickSpan(high, low, maxTickSpan)
		);

		return min(spans);
	}

	public rebuildTickMarks(): void {
		this._marks = null;
	}

	public marks(): CurrentAndFullMarks {
		if (this._marks === null) {
			this._marks = this._rebuildTickMarksImpl();
		}

		return this._marks;
	}

	private _fontHeight(): number {
		return this._priceScale.fontSize();
	}

	private _tickMarkHeight(): number {
		return Math.ceil(this._fontHeight() * TICK_DENSITY);
	}

	// eslint-disable-next-line complexity
	private _rebuildTickMarksImpl(): CurrentAndFullMarks {
		const priceScale = this._priceScale;
		const marks: PriceMark[] = [];

		const firstValue = priceScale.firstValue();

		if (firstValue === null) {
			return {
				withoutFractionalZerosIfPossible: [],
				full: [],
			};
		}

		const scaleHeight = priceScale.height();

		const bottom = this._coordinateToLogicalFunc(scaleHeight - 1, firstValue);
		const top = this._coordinateToLogicalFunc(0, firstValue);

		const extraTopBottomMargin = this._priceScale.options().entireTextOnly ? this._fontHeight() / 2 : 0;
		const minCoord = extraTopBottomMargin;
		const maxCoord = scaleHeight - 1 - extraTopBottomMargin;

		const high = Math.max(bottom, top);
		const low = Math.min(bottom, top);
		if (high === low) {
			return {
				withoutFractionalZerosIfPossible: [],
				full: [],
			};
		}

		let span = this.tickSpan(high, low);
		let mod = high % span;
		mod += mod < 0 ? span : 0;

		const sign = (high >= low) ? 1 : -1;
		let prevCoord: number | null = null;

		const formatter = priceScale.formatter();

		const marksWithoutTrailingZeros: PriceMark[] = [];
		let allMarksWithoutTrailingZerosValid = priceScale.tryCutFractionalZeros();

		for (let logical = high - mod; logical > low; logical -= span) {
			const coord = this._logicalToCoordinateFunc(logical, firstValue, true) as Coordinate;

			// check if there is place for it
			// this is required for log scale
			if (prevCoord !== null && Math.abs(coord - prevCoord) < this._tickMarkHeight()) {
				continue;
			}

			// check if a tick mark is partially visible and skip it if entireTextOnly is true
			if (coord < minCoord || coord > maxCoord) {
				continue;
			}

			const label = formatter.format(logical);
			marks.push({ coord, label });

			if (allMarksWithoutTrailingZerosValid) {
				const labelWithoutFractionalZeros = formatter.tryCutFractionalZeros?.(label) ?? label;

				if (labelWithoutFractionalZeros !== label) {
					marksWithoutTrailingZeros.push({
						coord,
						label: labelWithoutFractionalZeros,
					});
				} else {
					allMarksWithoutTrailingZerosValid = false;
				}
			}

			prevCoord = coord;
			if (priceScale.isLog()) {
				// recalc span
				span = this.tickSpan(logical * sign, low);
			}
		}

		return {
			withoutFractionalZerosIfPossible: allMarksWithoutTrailingZerosValid ? marksWithoutTrailingZeros : marks,
			full: marks,
		};
	}
}
