"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickMarks = void 0;
const algorithms_1 = require("../helpers/algorithms");
const assertions_1 = require("../helpers/assertions");
class TickMarks {
    constructor() {
        this._marksByWeight = new Map();
        this._cache = null;
        this._uniformDistribution = false;
    }
    setUniformDistribution(val) {
        this._uniformDistribution = val;
        this._cache = null;
    }
    setTimeScalePoints(newPoints, firstChangedPointIndex) {
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
                index: index,
                time: point.time,
                weight: point.timeWeight,
                originalTime: point.originalTime,
            });
        }
    }
    build(spacing, maxWidth) {
        const maxIndexesPerMark = Math.ceil(maxWidth / spacing);
        if (this._cache === null || this._cache.maxIndexesPerMark !== maxIndexesPerMark) {
            this._cache = {
                marks: this._buildMarksImpl(maxIndexesPerMark),
                maxIndexesPerMark,
            };
        }
        return this._cache.marks;
    }
    _removeMarksSinceIndex(sinceIndex) {
        if (sinceIndex === 0) {
            this._marksByWeight.clear();
            return;
        }
        const weightsToClear = [];
        this._marksByWeight.forEach((marks, timeWeight) => {
            if (sinceIndex <= marks[0].index) {
                weightsToClear.push(timeWeight);
            }
            else {
                marks.splice((0, algorithms_1.lowerBound)(marks, sinceIndex, (tm) => tm.index < sinceIndex), Infinity);
            }
        });
        for (const weight of weightsToClear) {
            this._marksByWeight.delete(weight);
        }
    }
    _buildMarksImpl(maxIndexesPerMark) {
        let marks = [];
        for (const weight of Array.from(this._marksByWeight.keys()).sort((a, b) => b - a)) {
            if (!this._marksByWeight.get(weight)) {
                continue;
            }
            // Built tickMarks are now prevMarks, and marks it as new array
            const prevMarks = marks;
            marks = [];
            const prevMarksLength = prevMarks.length;
            let prevMarksPointer = 0;
            const currentWeight = (0, assertions_1.ensureDefined)(this._marksByWeight.get(weight));
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
                    }
                    else {
                        rightIndex = lastIndex;
                        break;
                    }
                }
                if (rightIndex - currentIndex >= maxIndexesPerMark && currentIndex - leftIndex >= maxIndexesPerMark) {
                    // TickMark fits. Place it into new array
                    marks.push(mark);
                    leftIndex = currentIndex;
                }
                else {
                    if (this._uniformDistribution) {
                        return prevMarks;
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
exports.TickMarks = TickMarks;
