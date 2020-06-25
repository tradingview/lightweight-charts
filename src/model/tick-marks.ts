import { ensureDefined } from '../helpers/assertions';

import { TimePoint, TimePointIndex, TimeScalePoint } from './time-data';

export interface TickMark {
	index: TimePointIndex;
	time: TimePoint;
	weight: number;
}

interface MarksCache {
	maxIndexesPerMark: number;
	marks: readonly TickMark[];
}

export class TickMarks {
	private _marksByWeight: Map<number, TickMark[]> = new Map();
	private _cache: MarksCache | null = null;

	public setTimeScalePoints(newPoints: readonly TimeScalePoint[]): void {
		this._cache = null;
		this._marksByWeight.clear();

		// TODO: it looks like this is quite fast even with thousands of points
		// but there might be point of improvements by providing the only changed points
		newPoints.forEach((point: TimeScalePoint, index: number) => {
			let marksForWeight = this._marksByWeight.get(point.timeWeight);
			if (marksForWeight === undefined) {
				marksForWeight = [];
				this._marksByWeight.set(point.timeWeight, marksForWeight);
			}

			marksForWeight.push({
				index: index as TimePointIndex,
				time: point.time,
				weight: point.timeWeight,
			});
		});
	}

	public build(spacing: number, maxWidth: number): readonly TickMark[] {
		const maxIndexesPerMark = Math.ceil(maxWidth / spacing);
		if (this._cache === null || this._cache.maxIndexesPerMark !== maxIndexesPerMark) {
			this._cache = {
				marks: this._buildMarksImpl(maxIndexesPerMark),
				maxIndexesPerMark,
			};
		}

		return this._cache.marks;
	}

	private _buildMarksImpl(maxIndexesPerMark: number): readonly TickMark[] {
		let marks: TickMark[] = [];

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
					marks.push(mark);
					leftIndex = currentIndex;
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
