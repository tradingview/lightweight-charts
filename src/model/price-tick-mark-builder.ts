import { min } from '../helpers/mathex';

import { Coordinate } from './coordinate';
import { PriceMark, PriceScale } from './price-scale';
import { PriceTickSpanCalculator } from './price-tick-span-calculator';

export type CoordinateToLogicalConverter = (x: number, firstValue: number) => number;
export type LogicalToCoordinateConverter = (x: number, firstValue: number, keepItFloat: boolean) => number;

const TICK_DENSITY = 2.5;

export class PriceTickMarkBuilder {
	private _marks: PriceMark[] = [];
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

	public setBase(base: number): void {
		if (base < 0) {
			throw new Error('base < 0');
		}
		this._base = base;
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

		spans.push(spanCalculator1.tickSpan(high, low, maxTickSpan));
		spans.push(spanCalculator2.tickSpan(high, low, maxTickSpan));
		spans.push(spanCalculator3.tickSpan(high, low, maxTickSpan));

		return min(spans);
	}

	// tslint:disable-next-line:cyclomatic-complexity
	public rebuildTickMarks(): void {
		const priceScale = this._priceScale;

		const firstValue = priceScale.firstValue();

		if (firstValue === null) {
			this._marks = [];
			return;
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
			this._marks = [];
			return;
		}

		let span = this.tickSpan(high, low);
		let mod = high % span;
		mod += mod < 0 ? span : 0;

		const sign = (high >= low) ? 1 : -1;
		let prevCoord: number | null = null;

		let targetIndex = 0;

		for (let logical = high - mod; logical > low; logical -= span) {
			const coord = this._logicalToCoordinateFunc(logical, firstValue, true);

			// check if there is place for it
			// this is required for log scale
			if (prevCoord !== null && Math.abs(coord - prevCoord) < this._tickMarkHeight()) {
				continue;
			}

			// check if a tick mark is partially visible and skip it if entireTextOnly is true
			if (coord < minCoord || coord > maxCoord) {
				continue;
			}

			if (targetIndex < this._marks.length) {
				this._marks[targetIndex].coord = coord as Coordinate;
				this._marks[targetIndex].label = priceScale.formatLogical(logical);
			} else {
				this._marks.push({
					coord: coord as Coordinate,
					label: priceScale.formatLogical(logical),
				});
			}

			targetIndex++;

			prevCoord = coord;
			if (priceScale.isLog()) {
				// recalc span
				span = this.tickSpan(logical * sign, low);
			}
		}
		this._marks.length = targetIndex;
	}

	public marks(): PriceMark[] {
		return this._marks;
	}

	private _fontHeight(): number {
		return this._priceScale.fontSize();
	}

	private _tickMarkHeight(): number {
		return Math.ceil(this._fontHeight() * TICK_DENSITY);
	}
}
