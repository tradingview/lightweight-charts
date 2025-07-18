import {
	AreaData,
	BarData,
	BaselineData,
	CandlestickData,
	HistogramData,
	LineData,
	SeriesDataItemTypeMap,
	SeriesType,
	SingleValueData,
} from "lightweight-charts";

// --------------------------------------------------
const mergeRecord = (
	original: Record<string, any>,
	...sources: Record<string, any>[]
): Record<string, any> => {
	for (const src of sources) {
		for (const i in src) {
			if (
				src[i] === undefined ||
				!Object.prototype.hasOwnProperty.call(src, i) ||
				["__proto__", "constructor", "prototype"].includes(i)
			) {
				continue;
			}

			if (
				"object" !== typeof src[i] ||
				original[i] === undefined ||
				Array.isArray(src[i])
			) {
				original[i] = src[i];
			} else {
				merge(original[i], src[i]);
			}
		}
	}

	return original;
};

// --------------------------------------------------
export const merge = <T>(original: T, ...sources: Partial<T>[]): T => {
	return mergeRecord(original as never, ...sources) as T;
};

// --------------------------------------------------
export const isValueData = <HorzScaleItem>(
	data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]
): data is
	| LineData<HorzScaleItem>
	| HistogramData<HorzScaleItem>
	| AreaData<HorzScaleItem>
	| BaselineData<HorzScaleItem> => {
	return (
		"value" in data &&
		typeof (data as unknown as SingleValueData).value === "number"
	);
};

// --------------------------------------------------
export const isOhlcData = <HorzScaleItem>(
	data: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]
): data is BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> => {
	return "open" in data && "high" in data && "low" in data && "close" in data;
};

/**
 * Default font family.
 * Must be used to generate font string when font is not specified.
 */
export const defaultFontFamily = `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`;

/**
 * Generates a font string, which can be used to set in canvas' font property.
 * If no family provided, {@link defaultFontFamily} will be used.
 *
 * @param size - Font size in pixels.
 * @param family - Optional font family.
 * @param style - Optional font style.
 * @returns The font string.
 */
export const makeFont = (opts: {
	fontSize: number;
	fontFamily?: string;
	fontStyle?: string;
}): string => {
	const { fontSize } = opts;
	let { fontStyle, fontFamily } = opts;

	if (fontStyle !== undefined) {
		fontStyle = `${fontStyle} `;
	} else {
		fontStyle = "";
	}

	if (!fontFamily) {
		fontFamily = defaultFontFamily;
	}

	return `${fontStyle}${fontSize}px ${fontFamily}`;
};
