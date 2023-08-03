import { lowerbound } from '../helpers/algorithms';
import { ensureDefined } from '../helpers/assertions';

import { OriginalTime, TickMarkWeight, TimePoint, TimePointIndex, TimeScalePoint } from './time-data';

export interface TickMark {
	index: TimePointIndex;
	time: TimePoint;
	weight: TickMarkWeight;
	originalTime: OriginalTime;
}

interface MarksCache {
	maxIndexesPerMark: number;
	maxCharactersPerIndex: number;
	marks: readonly TickMark[];
}

export class TickMarks {
	private _marksByWeight: Map<TickMarkWeight, TickMark[]> = new Map();
	private _cache: MarksCache | null = null;
	private _formatLabel: (mark: TickMark) => string;

	public constructor(formatLabel: (mark: TickMark) => string) {
		this._formatLabel = formatLabel;
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
			});
		}
	}

	public build(spacing: number, maxWidth: number, fontSize: number): readonly TickMark[] {
		const maxIndexesPerMark = Math.ceil(maxWidth / spacing);
		const maxCharactersPerIndex = Math.max(1, Math.ceil(spacing / fontSize) - 1);
		if (this._cache === null || this._cache.maxIndexesPerMark !== maxIndexesPerMark || this._cache.maxCharactersPerIndex !== maxCharactersPerIndex) {
			this._cache = {
				marks: this._buildMarksImpl(maxIndexesPerMark, maxCharactersPerIndex),
				maxIndexesPerMark,
				maxCharactersPerIndex,
			};
		}

		return this._cache.marks;
	}

	private _removeMarksSinceIndex(sinceIndex: number): void {
		if (sinceIndex === 0) {
			this._marksByWeight.clear();
			return;
		}

		const weightsToClear: TickMarkWeight[] = [];

		this._marksByWeight.forEach((marks: TickMark[], timeWeight: number) => {
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

	private _buildMarksImpl(maxIndexesPerMark: number, maxCharactersPerIndex: number): readonly TickMark[] {
		let marks: TickMark[] = [];

		const indexesToSkip = new Set<number>();

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

				if (indexesToSkip.has(currentIndex)) {
					continue;
				}

				const label = this._formatLabel(mark);

				/* eslint-disable jsdoc/check-indentation */
				/**
				 * 0   1   2   3   4   5   6   7   8   9   10
				 * |   |   |   |   |   |   |   |   |   |   |
				 *                     ^
				 *            "a really long label"
				 *
				 * In the picture above the maximum characters per index is 3.
				 * The label length is 19.
				 * 19 / 3 = 6.333333333333333 is the number of marks covered by that label.
				 * floor(6.333333333333333 / 2) is is the number of marks either side of index 5 that will be covered.
				 */
				/* eslint-enable jsdoc/check-indentation */
				const labelIndexOverflow = Math.floor(label.length / maxCharactersPerIndex / 2);

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
					marks.push(mark);
					leftIndex = currentIndex;
					indexesToSkip.add(currentIndex);

					if (labelIndexOverflow > 0) {
						for (let j = 1; j <= labelIndexOverflow; j++) {
							indexesToSkip.add(currentIndex + j);
							indexesToSkip.add(currentIndex - j);
						}
					}
				}
			}

			// Place all unused tickMarks into new array;
			for (; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
				marks.push(prevMarks[prevMarksPointer]);
			}
		}

		return marks;
	}
}
