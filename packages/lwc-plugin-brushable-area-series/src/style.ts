import {
	BrushRange,
	BrushableAreaSeriesOptions,
	BrushableAreaStyle,
} from './options';

function mergeStyle(
	base: BrushableAreaStyle,
	override: Partial<BrushableAreaStyle> | undefined
): BrushableAreaStyle {
	if (override === undefined) {
		return base;
	}
	return {
		lineColor: override.lineColor ?? base.lineColor,
		topColor: override.topColor ?? base.topColor,
		bottomColor: override.bottomColor ?? base.bottomColor,
		lineWidth: override.lineWidth ?? base.lineWidth,
		lineStyle: override.lineStyle ?? base.lineStyle,
	};
}

/**
 * Builds the logical index → style lookup for one set of options: the style of
 * the last matching brush range, or `outsideStyle` while any range is set, each
 * merged over the base style. Points sharing a source style get the very same
 * object, which the renderer relies on to draw a run of points at once.
 */
export function createStyleResolver(
	options: BrushableAreaSeriesOptions
): (index: number) => BrushableAreaStyle {
	const base: BrushableAreaStyle = {
		lineColor: options.lineColor,
		topColor: options.topColor,
		bottomColor: options.bottomColor,
		lineWidth: options.lineWidth,
		lineStyle: options.lineStyle,
	};
	const ranges = options.brushRanges;
	const outside =
		ranges.length > 0 ? mergeStyle(base, options.outsideStyle) : base;
	const resolved: Map<BrushRange, BrushableAreaStyle> = new Map();

	return (index: number): BrushableAreaStyle => {
		// Last wins: a range set later covers the ones it overlaps, so a brush
		// dragged over an existing highlight behaves the way a user expects.
		let range: BrushRange | undefined;
		for (let i = ranges.length - 1; i >= 0; i--) {
			if (index >= ranges[i].range.from && index < ranges[i].range.to) {
				range = ranges[i];
				break;
			}
		}
		if (range === undefined) {
			return outside;
		}
		let style = resolved.get(range);
		if (style === undefined) {
			style = mergeStyle(base, range.style);
			resolved.set(range, style);
		}
		return style;
	};
}
