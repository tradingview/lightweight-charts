/**
 * Binary function that accepts two arguments (the first of the type of array elements, and the second is always val), and returns a value convertible to bool.
 * The value returned indicates whether the first argument is considered to go before the second.
 * The function shall not modify any of its arguments.
 */

export type LowerBoundComparatorType<TArrayElementType, TValueType> = (a: TArrayElementType, b: TValueType) => boolean;

export function lowerbound<TArrayElementType, TValueType>(
	arr: readonly TArrayElementType[],
	value: TValueType,
	compare: LowerBoundComparatorType<TArrayElementType, TValueType>,
	start: number = 0,
	to: number = arr.length): number {
	let count: number = to - start;
	while (0 < count) {
		const count2: number = (count >> 1);
		const mid: number = start + count2;
		if (compare(arr[mid], value)) {
			start = mid + 1;
			count -= count2 + 1;
		} else {
			count = count2;
		}
	}

	return start;
}

/**
 * Binary function that accepts two arguments (the first is always val, and the second of the type of array elements), and returns a value convertible to bool.
 * The value returned indicates whether the first argument is considered to go before the second.
 * The function shall not modify any of its arguments.
 */

export type UpperBoundComparatorType<TValueType, TArrayElementType> = (a: TValueType, b: TArrayElementType) => boolean;

export function upperbound<TArrayElementType, TValueType>(
	arr: readonly TArrayElementType[],
	value: TValueType,
	compare: UpperBoundComparatorType<TValueType, TArrayElementType>,
	start: number = 0,
	to: number = arr.length): number {
	let count: number = to - start;
	while (0 < count) {
		const count2: number = (count >> 1);
		const mid: number = start + count2;
		if (!(compare(value, arr[mid]))) {
			start = mid + 1;
			count -= count2 + 1;
		} else {
			count = count2;
		}
	}

	return start;
}
