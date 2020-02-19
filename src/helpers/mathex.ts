export function clamp(value: number, minVal: number, maxVal: number): number {
	return Math.min(Math.max(value, minVal), maxVal);
}

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

export function greaterOrEqual(x1: number, x2: number, epsilon: number): boolean {
	return (x2 - x1) <= epsilon;
}

export function equal(x1: number, x2: number, epsilon: number): boolean {
	return Math.abs(x1 - x2) < epsilon;
}

export function log10(x: number): number {
	if (x <= 0) {
		return NaN;
	}

	return Math.log(x) / Math.log(10);
}

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

export function ceiledEven(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}

export function ceiledOdd(x: number): number {
	const ceiled = Math.ceil(x);
	return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}
