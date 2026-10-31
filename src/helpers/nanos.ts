/**
 * Number of fractional second digits needed to represent a nanosecond value without loss.
 * `0` for a zero nanosecond part, otherwise 3, 6 or 9 digits.
 *
 * @param nanos - The fractional part of a timestamp, in nanoseconds.
 * @returns The number of digits the fraction needs.
 */
export function fractionalDigitsForNanos(nanos: number | undefined): number {
	if (nanos === undefined || nanos === 0) {
		return 0;
	}

	if (nanos % 1_000_000 === 0) {
		return 3;
	}

	if (nanos % 1_000 === 0) {
		return 6;
	}

	return 9;
}
