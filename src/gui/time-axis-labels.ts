export interface TimeAxisLabel {
	coordinate: number;
	width: number;
	weight: number;
}

export function filterOverlappingLabels<T extends TimeAxisLabel>(labels: readonly T[]): T[] {
	const result: T[] = [];
	for (const label of labels) {
		const left = label.coordinate - label.width / 2;
		let length = result.length;
		while (length > 0) {
			const previous = result[length - 1];
			if (previous.coordinate + previous.width / 2 <= left) {
				break;
			}
			if (previous.weight >= label.weight) {
				length = -1;
				break;
			}
			length--;
		}
		if (length >= 0) {
			result.length = length;
			result.push(label);
		}
	}
	return result;
}
