import { ensureNever } from '../helpers/assertions';

import { SeriesMarkerShape } from '../model/series-markers';

const enum Constants {
	MinShapeSize = 12,
	MaxShapeSize = 30,
	MinShapeMargin = 3,
}

export function size(barSpacing: number, coeff: number): number {
	const result = Math.min(Math.max(barSpacing, Constants.MinShapeSize), Constants.MaxShapeSize) * coeff;
	return ceilToOdd(result);
}

export function shapeSize(shape: SeriesMarkerShape, barSpacing: number): number {
	switch (shape) {
		case 'arrowDown':
		case 'arrowUp':
			return size(barSpacing, 1);
		case 'circle':
			return size(barSpacing, 0.8);
		case 'square':
			return size(barSpacing, 0.7);
	}

	ensureNever(shape);
}

export function ceilToEven(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}

export function ceilToOdd(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}

export function calculateShapeHeight(barSpacing: number): number {
	return ceilToEven(size(barSpacing, 1));
}

export function shapeMargin(barSpacing: number): number {
	return Math.max(size(barSpacing, 0.1), Constants.MinShapeMargin);
}
