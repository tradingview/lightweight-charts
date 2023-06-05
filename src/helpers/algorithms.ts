export type BoundComparatorType<TArrayElementType, TValueType> = (a: TArrayElementType, b: TValueType) => boolean;

/**
 * Binary function that accepts two arguments (the first of the type of array elements, and the second is always val), and returns a value convertible to bool.
 * The value returned indicates whether the first argument is considered to go before the second.
 * The function shall not modify any of its arguments.
 */

function boundCompare<TArrayElementType, TValueType>(
	lower: boolean,
	arr: readonly TArrayElementType[],
	value: TValueType,
	compare: BoundComparatorType<TArrayElementType, TValueType>,
	start: number = 0,
	to: number = arr.length): number {
	let count: number = to - start;
	while (0 < count) {
		const count2: number = (count >> 1);
		const mid: number = start + count2;
		if (compare(arr[mid], value) === lower) {
			start = mid + 1;
			count -= count2 + 1;
		} else {
			count = count2;
		}
	}

	return start;
}

type BoundCompareFunctionDefinition = <TArrayElementType, TValueType>(
	arr: readonly TArrayElementType[],
	value: TValueType,
	compare: BoundComparatorType<TArrayElementType, TValueType>,
	start?: number,
	to?: number
) => number;

export const lowerBound = boundCompare.bind(null, true) as BoundCompareFunctionDefinition;
export const upperBound = boundCompare.bind(null, false) as BoundCompareFunctionDefinition;
