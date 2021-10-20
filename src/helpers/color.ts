import { Nominal } from './nominal';

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

type Rgba = [RedComponent, GreenComponent, BlueComponent, AlphaComponent];

/**
 * Note this object should be explicitly marked as public so that dts-bundle-generator does not mangle the property names.
 *
 * @public
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
 */
const namedColorRgbHexStrings: Record<string, string> = {
	// The order of properties in this Record is not important for the internal logic.
	// It's just GZIPped better when props follows this order.
	// Please add new colors to the end of the record.

	khaki: '#f0e68c',
	azure: '#f0ffff',
	aliceblue: '#f0f8ff',
	ghostwhite: '#f8f8ff',
	gold: '#ffd700',
	goldenrod: '#daa520',
	gainsboro: '#dcdcdc',
	gray: '#808080',
	green: '#008000',
	honeydew: '#f0fff0',
	floralwhite: '#fffaf0',
	lightblue: '#add8e6',
	lightcoral: '#f08080',
	lemonchiffon: '#fffacd',
	hotpink: '#ff69b4',
	lightyellow: '#ffffe0',
	greenyellow: '#adff2f',
	lightgoldenrodyellow: '#fafad2',
	limegreen: '#32cd32',
	linen: '#faf0e6',
	lightcyan: '#e0ffff',
	magenta: '#f0f',
	maroon: '#800000',
	olive: '#808000',
	orange: '#ffa500',
	oldlace: '#fdf5e6',
	mediumblue: '#0000cd',
	transparent: '#0000',
	lime: '#0f0',
	lightpink: '#ffb6c1',
	mistyrose: '#ffe4e1',
	moccasin: '#ffe4b5',
	midnightblue: '#191970',
	orchid: '#da70d6',
	mediumorchid: '#ba55d3',
	mediumturquoise: '#48d1cc',
	orangered: '#ff4500',
	royalblue: '#4169e1',
	powderblue: '#b0e0e6',
	red: '#f00',
	coral: '#ff7f50',
	turquoise: '#40e0d0',
	white: '#fff',
	whitesmoke: '#f5f5f5',
	wheat: '#f5deb3',
	teal: '#008080',
	steelblue: '#4682b4',
	bisque: '#ffe4c4',
	aquamarine: '#7fffd4',
	aqua: '#0ff',
	sienna: '#a0522d',
	silver: '#c0c0c0',
	springgreen: '#00ff7f',
	antiquewhite: '#faebd7',
	burlywood: '#deb887',
	brown: '#a52a2a',
	beige: '#f5f5dc',
	chocolate: '#d2691e',
	chartreuse: '#7fff00',
	cornflowerblue: '#6495ed',
	cornsilk: '#fff8dc',
	crimson: '#dc143c',
	cadetblue: '#5f9ea0',
	tomato: '#ff6347',
	fuchsia: '#f0f',
	blue: '#00f',
	salmon: '#fa8072',
	blanchedalmond: '#ffebcd',
	slateblue: '#6a5acd',
	slategray: '#708090',
	thistle: '#d8bfd8',
	tan: '#d2b48c',
	cyan: '#0ff',
	darkblue: '#00008b',
	darkcyan: '#008b8b',
	darkgoldenrod: '#b8860b',
	darkgray: '#a9a9a9',
	blueviolet: '#8a2be2',
	black: '#000',
	darkmagenta: '#8b008b',
	darkslateblue: '#483d8b',
	darkkhaki: '#bdb76b',
	darkorchid: '#9932cc',
	darkorange: '#ff8c00',
	darkgreen: '#006400',
	darkred: '#8b0000',
	dodgerblue: '#1e90ff',
	darkslategray: '#2f4f4f',
	dimgray: '#696969',
	deepskyblue: '#00bfff',
	firebrick: '#b22222',
	forestgreen: '#228b22',
	indigo: '#4b0082',
	ivory: '#fffff0',
	lavenderblush: '#fff0f5',
	feldspar: '#d19275',
	indianred: '#cd5c5c',
	lightgreen: '#90ee90',
	lightgrey: '#d3d3d3',
	lightskyblue: '#87cefa',
	lightslategray: '#789',
	lightslateblue: '#8470ff',
	snow: '#fffafa',
	lightseagreen: '#20b2aa',
	lightsalmon: '#ffa07a',
	darksalmon: '#e9967a',
	darkviolet: '#9400d3',
	mediumpurple: '#9370d8',
	mediumaquamarine: '#66cdaa',
	skyblue: '#87ceeb',
	lavender: '#e6e6fa',
	lightsteelblue: '#b0c4de',
	mediumvioletred: '#c71585',
	mintcream: '#f5fffa',
	navajowhite: '#ffdead',
	navy: '#000080',
	olivedrab: '#6b8e23',
	palevioletred: '#d87093',
	violetred: '#d02090',
	yellow: '#ff0',
	yellowgreen: '#9acd32',
	lawngreen: '#7cfc00',
	pink: '#ffc0cb',
	paleturquoise: '#afeeee',
	palegoldenrod: '#eee8aa',
	darkolivegreen: '#556b2f',
	darkseagreen: '#8fbc8f',
	darkturquoise: '#00ced1',
	peachpuff: '#ffdab9',
	deeppink: '#ff1493',
	violet: '#ee82ee',
	palegreen: '#98fb98',
	mediumseagreen: '#3cb371',
	peru: '#cd853f',
	saddlebrown: '#8b4513',
	sandybrown: '#f4a460',
	rosybrown: '#bc8f8f',
	purple: '#800080',
	seagreen: '#2e8b57',
	seashell: '#fff5ee',
	papayawhip: '#ffefd5',
	mediumslateblue: '#7b68ee',
	plum: '#dda0dd',
	mediumspringgreen: '#00fa9a',
};

function normalizeRgbComponent<T extends RedComponent | GreenComponent | BlueComponent>(component: number): T {
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
	return (!(component <= 0) && !(component > 0) ? 0 as AlphaComponent :
		component < 0 ? 0 as AlphaComponent :
			component > 1 ? 1 as AlphaComponent :
				// limit the precision of all numbers to at most 4 digits in fractional part
				Math.round(component * 10000) / 10000) as AlphaComponent;
}

/**
 * @example
 * #fb0
 * @example
 * #f0f
 * @example
 * #f0fa
 */
const shortHexRe = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i;

/**
 * @example
 * #00ff00
 * @example
 * #336699
 * @example
 * #336699FA
 */
const hexRe = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;

/**
 * @example
 * rgb(123, 234, 45)
 * @example
 * rgb(255,234,245)
 */
const rgbRe = /^rgb\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*\)$/;

/**
 * @example
 * rgba(123, 234, 45, 1)
 * @example
 * rgba(255,234,245,0.1)
 */
const rgbaRe = /^rgba\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?[\d]{0,10}(?:\.\d+)?)\s*\)$/;

function colorStringToRgba(colorString: string): Rgba {
	colorString = colorString.toLowerCase();

	// eslint-disable-next-line no-restricted-syntax
	if (colorString in namedColorRgbHexStrings) {
		colorString = namedColorRgbHexStrings[colorString];
	}

	{
		const matches = rgbaRe.exec(colorString) || rgbRe.exec(colorString);
		if (matches) {
			return [
				normalizeRgbComponent<RedComponent>(parseInt(matches[1], 10)),
				normalizeRgbComponent<GreenComponent>(parseInt(matches[2], 10)),
				normalizeRgbComponent<BlueComponent>(parseInt(matches[3], 10)),
				normalizeAlphaComponent((matches.length < 5 ? 1 : parseFloat(matches[4])) as AlphaComponent),
			];
		}
	}

	{
		const matches = hexRe.exec(colorString);
		if (matches) {
			return [
				normalizeRgbComponent<RedComponent>(parseInt(matches[1], 16)),
				normalizeRgbComponent<GreenComponent>(parseInt(matches[2], 16)),
				normalizeRgbComponent<BlueComponent>(parseInt(matches[3], 16)),
				1 as AlphaComponent,
			];
		}
	}

	{
		const matches = shortHexRe.exec(colorString);
		if (matches) {
			return [
				normalizeRgbComponent<RedComponent>(parseInt(matches[1], 16) * 0x11),
				normalizeRgbComponent<GreenComponent>(parseInt(matches[2], 16) * 0x11),
				normalizeRgbComponent<BlueComponent>(parseInt(matches[3], 16) * 0x11),
				1 as AlphaComponent,
			];
		}
	}

	throw new Error(`Cannot parse color: ${colorString}`);
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

export function applyAlpha(color: string, alpha: number): string {
	// special case optimization
	if (color === 'transparent') {
		return color;
	}

	const originRgba = colorStringToRgba(color);
	const originAlpha = originRgba[3];
	return `rgba(${originRgba[0]}, ${originRgba[1]}, ${originRgba[2]}, ${alpha * originAlpha})`;
}

export interface ContrastColors {
	foreground: string;
	background: string;
}

export function generateContrastColors(backgroundColor: string): ContrastColors {
	const rgb = colorStringToRgba(backgroundColor);

	return {
		background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
		foreground: rgbaToGrayscale(rgb) > 160 ? 'black' : 'white',
	};
}

export function gradientColorAtPercent(topColor: string, bottomColor: string, percent: number): string {
	const [topR, topG, topB, topA] = colorStringToRgba(topColor);
	const [bottomR, bottomG, bottomB, bottomA] = colorStringToRgba(bottomColor);

	const resultRgba: Rgba = [
		normalizeRgbComponent(topR + percent * (bottomR - topR) as RedComponent),
		normalizeRgbComponent(topG + percent * (bottomG - topG) as GreenComponent),
		normalizeRgbComponent(topB + percent * (bottomB - topB) as BlueComponent),
		normalizeAlphaComponent(topA + percent * (bottomA - topA) as AlphaComponent),
	];

	return `rgba(${resultRgba[0]}, ${resultRgba[1]}, ${resultRgba[2]}, ${resultRgba[3]})`;
}
