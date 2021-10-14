/**
 * @private
 */
export function clamp(value: number, minVal: number, maxVal: number): number {
	return Math.min(Math.max(value, minVal), maxVal);
}

/**
 * @private
 */
export function isBaseDecimal(value: number): boolean {
	if (value < 0) {
		return false;
	}

	for (let current = value; current > 1; current /= 10) {
		if ((current % 10) !== 0) {
			return false;
		}
	}

	return true;
}

/**
 * @private
 */
export function greaterOrEqual(x1: number, x2: number, epsilon: number): boolean {
	return (x2 - x1) <= epsilon;
}

/**
 * @private
 */
export function equal(x1: number, x2: number, epsilon: number): boolean {
	return Math.abs(x1 - x2) < epsilon;
}

/**
 * @private
 */
export function log10(x: number): number {
	if (x <= 0) {
		return NaN;
	}

	return Math.log(x) / Math.log(10);
}

/**
 * @private
 */
export function min(arr: number[]): number {
	if (arr.length < 1) {
		throw Error('array is empty');
	}

	let minVal = arr[0];
	for (let i = 1; i < arr.length; ++i) {
		if (arr[i] < minVal) {
			minVal = arr[i];
		}
	}

	return minVal;
}

/**
 * @private
 */
export function ceiledEven(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}

/**
 * @private
 */
export function ceiledOdd(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}
