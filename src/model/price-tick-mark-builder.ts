import { min } from '../helpers/mathex';

import { Coordinate } from './coordinate';
import { PriceMark, PriceScale } from './price-scale';
import { PriceTickSpanCalculator } from './price-tick-span-calculator';

export type CoordinateToLogicalConverter = (x: number, firstValue: number) => number;
export type LogicalToCoordinateConverter = (x: number, firstValue: number, keepItFloat: boolean) => number;

interface BoundariesMarksOptions {
	/**
	 * Padding for the boundaries tick marks on the price scale.
	 */
	getPadding: () => number;
}

const TICK_DENSITY = 2.5;

export class PriceTickMarkBuilder {
	private _marks: PriceMark[] = [];
	private _base: number;
	private readonly _priceScale: PriceScale;
	private readonly _coordinateToLogicalFunc: CoordinateToLogicalConverter;
	private readonly _logicalToCoordinateFunc: LogicalToCoordinateConverter;
	private readonly _boundariesMarks?: undefined | BoundariesMarksOptions;

	public constructor(
		priceScale: PriceScale,
		base: number,
		coordinateToLogicalFunc: CoordinateToLogicalConverter,
		logicalToCoordinateFunc: LogicalToCoordinateConverter,
		boundariesMarks?: BoundariesMarksOptions
	) {
		this._priceScale = priceScale;
		this._base = base;
		this._coordinateToLogicalFunc = coordinateToLogicalFunc;
		this._logicalToCoordinateFunc = logicalToCoordinateFunc;
		this._boundariesMarks = boundariesMarks;
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

		this._updateMarks(
			firstValue,
			high,
			low,
			minCoord,
			maxCoord
		);

		if (this._boundariesMarks) {
			const padding = this._boundariesMarks.getPadding();
			this._extendWithBoundariesMarks(
				firstValue,
				minCoord,
				maxCoord,
				padding,
				padding * 2
			);
		}
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

	private _updateMarks(firstValue: number, high: number, low: number, minCoord: number, maxCoord: number): void {
		const marks = this._marks;
		const priceScale = this._priceScale;

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

			if (targetIndex < marks.length) {
				marks[targetIndex].coord = coord as Coordinate;
				marks[targetIndex].label = priceScale.formatLogical(logical);
			} else {
				marks.push({
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

		marks.length = targetIndex;
	}

	private _extendWithBoundariesMarks(
		firstValue: number,
		minCoord: number,
		maxCoord: number,
		minPadding: number,
		maxPadding: number
	): void {
		const marks = this._marks;

		// top boundary

		const topMark = this._computeBoundaryPriceMark(
			firstValue,
			minCoord,
			minPadding,
			maxPadding
		);

		if (marks[0].coord - topMark.coord < maxPadding) {
			marks.shift();
		}
		marks.unshift(topMark);

		// bottom boundary
		const bottomMark = this._computeBoundaryPriceMark(
			firstValue,
			maxCoord,
			-maxPadding,
			-minPadding
		);
		if (bottomMark.coord - marks[marks.length - 1].coord < maxPadding) {
			marks.pop();
		}
		marks.push(bottomMark);
	}

	private _computeBoundaryPriceMark(
		firstValue: number,
		coord: number,
		minPadding: number,
		maxPadding: number
	): PriceMark {
		const avgPadding = (minPadding + maxPadding) / 2;
		const value1 = this._coordinateToLogicalFunc(coord + minPadding, firstValue);
		const value2 = this._coordinateToLogicalFunc(coord + maxPadding, firstValue);
		const minValue = Math.min(value1, value2);
		const maxValue = Math.max(value1, value2);
		const valueSpan = Math.max(0.1, this.tickSpan(maxValue, minValue));

		const value = this._coordinateToLogicalFunc(coord + avgPadding, firstValue);
		const roundedValue = value - (value % valueSpan);
		const roundedCoord = this._logicalToCoordinateFunc(roundedValue, firstValue, true);

		return { label: this._priceScale.formatLogical(roundedValue), coord: roundedCoord as Coordinate };
	}
}
