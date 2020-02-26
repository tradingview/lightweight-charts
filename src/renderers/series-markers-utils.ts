import { ensureNever } from '../helpers/assertions';
import { ceiledEven, ceiledOdd } from '../helpers/mathex';

import { SeriesMarkerShape, SeriesMarkerText } from '../model/series-markers';

const enum Constants {
	MinShapeSize = 12,
	MaxShapeSize = 30,
	MinShapeMargin = 3,
}

export function size(barSpacing: number, coeff: number): number {
	const result = Math.min(Math.max(barSpacing, Constants.MinShapeSize), Constants.MaxShapeSize) * coeff;
	return ceiledOdd(result);
}

export function shapeSize(shape: SeriesMarkerShape, originalSize: number): number {
	switch (shape) {
		case 'arrowDown':
		case 'arrowUp':
			return size(originalSize, 1);
		case 'circle':
			return size(originalSize, 0.8);
		case 'square':
			return size(originalSize, 0.7);
	}

	ensureNever(shape);
}

export function calculateShapeHeight(barSpacing: number): number {
	return ceiledEven(size(barSpacing, 1));
}

export function shapeMargin(barSpacing: number): number {
	return Math.max(size(barSpacing, 0.1), Constants.MinShapeMargin);
}

export function textPosition(x: number, y: number, text: SeriesMarkerText, shapeSize: number): [number, number] {
	return [x + text.offsetX, y + text.offsetY + shapeSize / 2 + (text.offsetY > 0 ? shapeSize : -shapeSize)];
}