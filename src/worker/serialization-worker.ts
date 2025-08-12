// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deserializeSABToSeriesItems(buffer: ArrayBufferLike): any[] {
	const array = new Float64Array(buffer);
	const stride = 6; // TYPE,TIME,VALUE/OPEN,HIGH,LOW,CLOSE
	const TYPE_CANDLESTICK = 1;
	const TYPE_LINE = 2;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const out: any[] = [];
	for (let i = 0; i < array.length; i += stride) {
		const type = array[i + 0];
		const time = array[i + 1];
		if (type === TYPE_CANDLESTICK) {
			out.push({ time, open: array[i + 2], high: array[i + 3], low: array[i + 4], close: array[i + 5] });
		} else if (type === TYPE_LINE) {
			out.push({ time, value: array[i + 2] });
		} else {
			out.push({ time });
		}
	}
	return out;
}
