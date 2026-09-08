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
	};
}

/**
 * Builds the index → style lookup for one set of options: the style of the
 * first matching brush range, or `outsideStyle` while any range is set, each
 * merged over the base style. Points sharing a source style get the very same
 * object, which the renderer relies on to stroke a run of points at once.
 */
export function createStyleResolver(
	options: BrushableAreaSeriesOptions
): (index: number) => BrushableAreaStyle {
	const base: BrushableAreaStyle = {
		lineColor: options.lineColor,
		topColor: options.topColor,
		bottomColor: options.bottomColor,
		lineWidth: options.lineWidth,
	};
	const ranges = options.brushRanges;
	const outside =
		ranges.length > 0 ? mergeStyle(base, options.outsideStyle) : base;
	const resolved: Map<BrushRange, BrushableAreaStyle> = new Map();

	return (index: number): BrushableAreaStyle => {
		const range = ranges.find(
			(brushRange: BrushRange) =>
				index >= brushRange.range.from && index < brushRange.range.to
		);
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
