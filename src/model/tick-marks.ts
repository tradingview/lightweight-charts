import { lowerbound } from '../helpers/algorithms';
import { ensureDefined } from '../helpers/assertions';

import { InternalHorzScaleItem } from './ihorz-scale-behavior';
import { TickMarkWeightValue, TimePointIndex, TimeScalePoint } from './time-data';

/**
 * Tick mark for the horizontal scale.
 */
export interface TickMark {
	/** Index */
	index: TimePointIndex;
	/** Time / Coordinate */
	time: InternalHorzScaleItem;
	/** Weight of the tick mark */
	weight: TickMarkWeightValue;
	/** Original value for the `time` property */
	originalTime: unknown;
	/** Formatted tick mark time label */
	label: string;
}

interface MarksCache {
	maxIndexesPerMark: number;
	marks: readonly TickMark[];
	defaultMaxIndexesPerMark: number;
}

export interface TickMarkBuildResult {
	marks: readonly TickMark[];
	maxLabelWidth: number;
}

function roundToOneDecimalPlace(n: number): number {
	return Math.round((n + Number.EPSILON) * 10) / 10;
}

export class TickMarks<HorzScaleItem> {
	private readonly _formatLabel: (mark: TickMark) => string;
	private _marksByWeight: Map<TickMarkWeightValue, TickMark[]> = new Map();
	private _cache: MarksCache | null = null;
	private _uniformDistribution: boolean = false;

	public constructor(formatLabel: (mark: TickMark) => string) {
		this._formatLabel = formatLabel;
	}

	public setUniformDistribution(val: boolean): void {
		this._uniformDistribution = val;
		this._cache = null;
	}

	public setTimeScalePoints(newPoints: readonly TimeScalePoint[], firstChangedPointIndex: number): void {
		this._removeMarksSinceIndex(firstChangedPointIndex);

		this._cache = null;

		for (let index = firstChangedPointIndex; index < newPoints.length; ++index) {
			const point = newPoints[index];
			let marksForWeight = this._marksByWeight.get(point.timeWeight);
			if (marksForWeight === undefined) {
				marksForWeight = [];
				this._marksByWeight.set(point.timeWeight, marksForWeight);
			}

			marksForWeight.push({
				index: index as TimePointIndex,
				time: point.time,
				weight: point.timeWeight,
				originalTime: point.originalTime,
				label: '',
			});
		}
	}

	public build(spacing: number, fontSize: number): TickMarkBuildResult {
		const maxLabelWidth = (fontSize + 4) * 5;
		const widthPerCharacterEstimate = maxLabelWidth / 8;
		// "default" because we will adjust the value based on actual label widths
		const defaultMaxIndexesPerMark = roundToOneDecimalPlace(maxLabelWidth / spacing);

		if (this._cache === null || this._cache.defaultMaxIndexesPerMark !== defaultMaxIndexesPerMark) {
			const result = this._buildMarksImpl(defaultMaxIndexesPerMark, widthPerCharacterEstimate, spacing);
			this._cache = result;
		}

		return { marks: this._cache.marks, maxLabelWidth };
	}

	private _removeMarksSinceIndex(sinceIndex: number): void {
		if (sinceIndex === 0) {
			this._marksByWeight.clear();
			return;
		}

		const weightsToClear: TickMarkWeightValue[] = [];

		this._marksByWeight.forEach((marks: TickMark[], timeWeight: TickMarkWeightValue) => {
			if (sinceIndex <= marks[0].index) {
				weightsToClear.push(timeWeight);
			} else {
				marks.splice(
					lowerbound(marks, sinceIndex, (tm: TickMark) => tm.index < sinceIndex),
					Infinity
				);
			}
		});

		for (const weight of weightsToClear) {
			this._marksByWeight.delete(weight);
		}
	}

	private _buildMarksImpl(defaultMaxIndexesPerMark: number, widthPerCharacterEstimate: number, spacing: number): MarksCache {
		let marks: TickMark[] = [];
		let maxIndexesPerMark = defaultMaxIndexesPerMark;

		for (const weight of Array.from(this._marksByWeight.keys()).sort((a: number, b: number) => b - a)) {
			if (!this._marksByWeight.get(weight)) {
				continue;
			}

			// Built tickMarks are now prevMarks, and marks it as new array
			const prevMarks = marks;
			marks = [];

			const prevMarksLength = prevMarks.length;
			let prevMarksPointer = 0;
			const currentWeight = ensureDefined(this._marksByWeight.get(weight));
			const currentWeightLength = currentWeight.length;

			let rightIndex = Infinity;
			let leftIndex = -Infinity;
			for (let i = 0; i < currentWeightLength; i++) {
				const mark = currentWeight[i];
				const currentIndex = mark.index;

				// Determine indexes with which current index will be compared
				// All marks to the right is moved to new array
				while (prevMarksPointer < prevMarksLength) {
					const lastMark = prevMarks[prevMarksPointer];
					const lastIndex = lastMark.index;
					if (lastIndex < currentIndex) {
						prevMarksPointer++;
						marks.push(lastMark);
						leftIndex = lastIndex;
						rightIndex = Infinity;
					} else {
						rightIndex = lastIndex;
						break;
					}
				}

				if (rightIndex - currentIndex >= maxIndexesPerMark && currentIndex - leftIndex >= maxIndexesPerMark) {
					// TickMark fits. Place it into new array
					const currentLabel = this._formatLabel(mark);
					mark.label = currentLabel;
					marks.push(mark);
					leftIndex = currentIndex;

					const indexesPerMarkEstimate = roundToOneDecimalPlace((currentLabel.length * widthPerCharacterEstimate) / spacing);
					if (indexesPerMarkEstimate > maxIndexesPerMark) {
						maxIndexesPerMark = indexesPerMarkEstimate;
					}
				} else {
					if (this._uniformDistribution) {
						return { marks: prevMarks, defaultMaxIndexesPerMark, maxIndexesPerMark };
					}
				}
			}

			// Place all unused tickMarks into new array;
			for (; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
				marks.push(prevMarks[prevMarksPointer]);
			}
		}

		return { marks, defaultMaxIndexesPerMark, maxIndexesPerMark };
	}
}
