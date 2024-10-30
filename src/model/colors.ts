import { Nominal } from '../helpers/nominal';

/**
 * Red component of the RGB color value
 * The valid values are integers in range [0, 255]
 */
type RedComponent = Nominal<number, 'RedComponent'>;

/**
 * Green component of the RGB color value
 * The valid values are integers in range [0, 255]
 */
type GreenComponent = Nominal<number, 'GreenComponent'>;

/**
 * Blue component of the RGB color value
 * The valid values are integers in range [0, 255]
 */
type BlueComponent = Nominal<number, 'BlueComponent'>;

/**
 * Alpha component of the RGBA color value
 * The valid values are integers in range [0, 1]
 */
type AlphaComponent = Nominal<number, 'AlphaComponent'>;

export type Rgba = [RedComponent, GreenComponent, BlueComponent, AlphaComponent];

function normalizeRgbComponent<
	T extends RedComponent | GreenComponent | BlueComponent
>(component: number): T {
	if (component < 0) {
		return 0 as T;
	}
	if (component > 255) {
		return 255 as T;
	}
	// NaN values are treated as 0
	return (Math.round(component) || 0) as T;
}

function normalizeAlphaComponent(component: AlphaComponent): AlphaComponent {
	if (component <= 0 || component > 1) {
		return Math.min(Math.max(component, 0), 1) as AlphaComponent;
	}
	// limit the precision of all numbers to at most 4 digits in fractional part
	return (Math.round(component * 10000) / 10000) as AlphaComponent;
}

function rgbaToGrayscale(rgbValue: Rgba): number {
	// Originally, the NTSC RGB to YUV formula
	// perfected by @eugene-korobko's black magic
	const redComponentGrayscaleWeight = 0.199;
	const greenComponentGrayscaleWeight = 0.687;
	const blueComponentGrayscaleWeight = 0.114;

	return (
		redComponentGrayscaleWeight * rgbValue[0] +
		greenComponentGrayscaleWeight * rgbValue[1] +
		blueComponentGrayscaleWeight * rgbValue[2]
	);
}

/**
 * For colors which fall within the sRGB space, the browser can
 * be used to convert the color string into a rgb /rgba string.
 *
 * For other colors, it will be returned as specified (i.e. for
 * newer formats like display-p3)
 *
 * See: https://www.w3.org/TR/css-color-4/#serializing-sRGB-values
 */
function getRgbStringViaBrowser(color: string): string {
	const element = document.createElement('div');
	element.style.display = 'none';
	// We append to the body as it is the most reliable way to get a color reading
	// appending to the chart container or similar element can result in the following
	// getComputedStyle returning empty strings on each check.
	document.body.appendChild(element);
	element.style.color = color;
	const computed = window.getComputedStyle(element).color;
	document.body.removeChild(element);
	return computed;
}

export interface ContrastColors {
	foreground: string;
	background: string;
}

export type CustomColorParser = (color: string) => Rgba | null;

export class ColorParser {
	private _rgbaCache: Map<string, Rgba> = new Map();
	private _customParsers: CustomColorParser[];

	public constructor(customParsers: CustomColorParser[], initialCache?: Map<string, Rgba>) {
		this._customParsers = customParsers;
		if (initialCache) {
			this._rgbaCache = initialCache;
		}
	}

	/**
	 * We fallback to RGBA here since supporting alpha transformations
	 * on wider color gamuts would currently be a lot of extra code
	 * for very little benefit due to actual usage.
	 */
	public applyAlpha(color: string, alpha: number): string {
		// special case optimization
		if (color === 'transparent') {
			return color;
		}

		const originRgba = this._parseColor(color);
		const originAlpha = originRgba[3];
		return `rgba(${originRgba[0]}, ${originRgba[1]}, ${originRgba[2]}, ${
			alpha * originAlpha
		})`;
	}

	public generateContrastColors(background: string): ContrastColors {
		const rgba = this._parseColor(background);
		return {
			background: `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`, // no alpha
			foreground: rgbaToGrayscale(rgba) > 160 ? 'black' : 'white',
		};
	}

	public colorStringToGrayscale(background: string): number {
		return rgbaToGrayscale(this._parseColor(background));
	}

	public gradientColorAtPercent(
		topColor: string,
		bottomColor: string,
		percent: number
	): string {
		const [topR, topG, topB, topA] = this._parseColor(topColor);
		const [bottomR, bottomG, bottomB, bottomA] = this._parseColor(bottomColor);
		const resultRgba: Rgba = [
			normalizeRgbComponent(
				(topR + percent * (bottomR - topR)) as RedComponent
			),
			normalizeRgbComponent(
				(topG + percent * (bottomG - topG)) as GreenComponent
			),
			normalizeRgbComponent(
				(topB + percent * (bottomB - topB)) as BlueComponent
			),
			normalizeAlphaComponent(
				(topA + percent * (bottomA - topA)) as AlphaComponent
			),
		];
		return `rgba(${resultRgba[0]}, ${resultRgba[1]}, ${resultRgba[2]}, ${resultRgba[3]})`;
	}

	private _parseColor(color: string): Rgba {
		const cached = this._rgbaCache.get(color);
		if (cached) {
			return cached;
		}

		const computed = getRgbStringViaBrowser(color);

		const match = computed.match(
			/^rgba?\s*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/
		);

		if (!match) {
			if (this._customParsers.length) {
				for (const parser of this._customParsers) {
					const result = parser(color);
					if (result) {
						this._rgbaCache.set(color, result);
						return result;
					}
				}
			}
			throw new Error(`Failed to parse color: ${color}`);
		}

		const rgba: Rgba = [
			parseInt(match[1], 10) as RedComponent,
			parseInt(match[2], 10) as GreenComponent,
			parseInt(match[3], 10) as BlueComponent,
			(match[4] ? parseFloat(match[4]) : 1) as AlphaComponent,
		];

		this._rgbaCache.set(color, rgba);

		return rgba;
	}
}
