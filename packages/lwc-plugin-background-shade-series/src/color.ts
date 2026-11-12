/** A color as red, green and blue channels (`0`–`255`) and an alpha (`0`–`1`). */
export type Rgba = readonly [number, number, number, number];

/**
 * Reads a color in one of the two forms a canvas context normalizes every
 * CSS color to: `#rrggbb`, or `rgba(r, g, b, a)` when it is translucent. Also
 * accepts `rgb(r, g, b)`. Returns `null` for anything else.
 */
export function parseNormalizedColor(color: string): Rgba | null {
	const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
	if (hex !== null) {
		return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16), 1];
	}
	const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
	if (rgb !== null) {
		return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
	}
	return null;
}

/**
 * Where `value` sits between `low` and `high`, as a ratio clamped to `0`–`1`:
 * `0` at `low` and beyond it, `1` at `high` and beyond it. The bounds may be
 * given in either order. When they are equal, a value below them is `0` and
 * any other value `1`.
 */
export function shadeRatio(value: number, low: number, high: number): number {
	if (low === high) {
		return value < low ? 0 : 1;
	}
	return Math.min(1, Math.max(0, (value - low) / (high - low)));
}

/**
 * The color `ratio` of the way from `from` to `to`, as a CSS color. The
 * channels are mixed with premultiplied alpha, as CSS gradients are, so that
 * a transparent end only fades the other color out: `transparent` (which is
 * transparent black) to green is a translucent green halfway, not a dark one.
 */
export function mixColors(from: Rgba, to: Rgba, ratio: number): string {
	const alpha = from[3] + (to[3] - from[3]) * ratio;
	const channel = (i: number): number => {
		if (alpha <= 0) {
			return 0;
		}
		const premultiplied = from[i] * from[3] + (to[i] * to[3] - from[i] * from[3]) * ratio;
		return Math.round(premultiplied / alpha);
	};
	return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${Math.round(alpha * 1000) / 1000})`;
}

let scratchContext: CanvasRenderingContext2D | null | undefined;

/**
 * A 2D context of its own for checking colors, so that a check never leaves
 * anything in the `fillStyle` of the context the chart draws on. `null`
 * without a DOM.
 */
function colorContext(): CanvasRenderingContext2D | null {
	if (scratchContext === undefined) {
		scratchContext = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
	}
	return scratchContext;
}

/**
 * A CSS color as a canvas reads it back, `#rrggbb` or `rgba(…)` for an sRGB
 * color, or `null` when the canvas does not accept it. An invalid color is
 * ignored by `fillStyle`, which shows as a different read-back after two
 * different starting values.
 */
export function normalizeCssColor(color: string): string | null {
	const ctx = colorContext();
	if (ctx === null) {
		return null;
	}
	ctx.fillStyle = '#000001';
	ctx.fillStyle = color;
	const first = ctx.fillStyle;
	ctx.fillStyle = '#000002';
	ctx.fillStyle = color;
	return typeof first === 'string' && first === ctx.fillStyle ? first : null;
}
