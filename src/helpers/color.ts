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

const cssColorResults: Record<string, Rgba> = {};

function getColorRgbFromBrowser(name: string): Rgba | undefined {
	if (name === 'black') {
		return [0 as RedComponent, 0 as GreenComponent, 0 as BlueComponent, 1 as AlphaComponent];
	}
	const div = document.createElement('div');
	try {
		div.style.color = name;
		// use absolute to ensure that it doesn't reflow the rest of the page layout
		div.style.position = 'absolute';
		div.style.left = '-9999px';
		document.body.appendChild(div);
		const rgbString = window.getComputedStyle(div).color;
		const rgb = readRGBA(rgbString);
		if (rgb) {
			cssColorResults[name] = rgb;
			return rgb;
		}
		return undefined;
	} finally {
		document.body.removeChild(div);
	}
}

function tryGetRGBfromCssColor(name: string): Rgba | undefined {
	return cssColorResults[name] ?? getColorRgbFromBrowser(name);
}

function readRGBA(colorString: string): Rgba | undefined {
	const matches = rgbaRe.exec(colorString) || rgbRe.exec(colorString);
	if (matches) {
		return [
			normalizeRgbComponent<RedComponent>(parseInt(matches[1], 10)),
			normalizeRgbComponent<GreenComponent>(parseInt(matches[2], 10)),
			normalizeRgbComponent<BlueComponent>(parseInt(matches[3], 10)),
			normalizeAlphaComponent((matches.length < 5 ? 1 : parseFloat(matches[4])) as AlphaComponent),
		];
	}
	return undefined;
}

function colorStringToRgba(colorString: string): Rgba {
	colorString = colorString.toLowerCase();

	{
		const rgba = readRGBA(colorString);
		if (rgba) {
			return rgba;
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

	{
		const rgb = tryGetRGBfromCssColor(colorString);
		if (rgb) {
			return rgb;
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
