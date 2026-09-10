import {
	CustomBarItemData,
	IRange,
	LineWidth,
	PriceToCoordinateConverter,
	Time,
} from 'lightweight-charts';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { Position, areaBetween } from '@tradingview/lwc-toolkit/custom-series/line-paths';
import { GapCheck, barCoordinate, extendRange, visibleSegments } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { LineStyle, setLineStyle } from '@tradingview/lwc-toolkit/line-style';
import { stackLevels } from '@tradingview/lwc-toolkit/custom-series/stacking';

import { StackedAreaColor, StackedAreaSeriesOptions, defaultOptions } from './options';
import { StackedAreaHitTestResult, isHitTestData } from './compat';
import { paddedValues, percentValues, styleRuns } from './stack';
import { StackedAreaData } from './data';
import { buildPath } from './paths';

/**
 * Scrim painted over the bands which are not hovered. Neutral grey works on a
 * light and a dark theme alike, and painting it last leaves the band colours
 * themselves untouched.
 */
const hoverScrimColor = 'rgba(128, 128, 128, 0.35)';

interface AreaPoint {
	/** Horizontal media coordinate of the point. */
	x: number;
	/** Vertical media coordinate of the top of each band. */
	ys: number[];
	/** Per-point colour overrides, if the data item carries any. */
	colors?: StackedAreaData['colors'];
}

/** The appearance of one band at one point, after every override is applied. */
interface BandStyle {
	line: string;
	area: string;
	areaBottom?: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;
	lineVisible: boolean;
	areaVisible: boolean;
}

function paletteEntry(
	options: StackedAreaSeriesOptions,
	band: number
): StackedAreaColor {
	const palette = options.colors.length > 0 ? options.colors : defaultOptions.colors;
	return palette[band % palette.length];
}

function bandStyle(
	options: StackedAreaSeriesOptions,
	band: number,
	point: AreaPoint
): BandStyle {
	const entry = paletteEntry(options, band);
	const override = point.colors?.[band];
	return {
		line: override?.line ?? entry.line,
		area: override?.area ?? entry.area,
		areaBottom: override?.areaBottom ?? entry.areaBottom,
		lineWidth: entry.lineWidth ?? options.lineWidth,
		// The library's `LineStyle` enum has the same values as the toolkit's.
		lineStyle: (entry.lineStyle ?? options.lineStyle) as number as LineStyle,
		lineVisible: entry.lineVisible ?? options.lineVisible,
		areaVisible: entry.areaVisible ?? options.areaVisible,
	};
}

export class StackedAreaSeriesRenderer<
	HorzScaleItem = Time,
	TData extends StackedAreaData<HorzScaleItem> = StackedAreaData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, StackedAreaSeriesOptions>
{
	public constructor(private readonly _isGap?: GapCheck<HorzScaleItem, TData>) {
		super();
	}

	/**
	 * Reports the band under the cursor. Optional on
	 * `ICustomSeriesPaneRenderer` from `lightweight-charts` 5.1; on 5.0.0 it is
	 * simply an extra method the chart never calls.
	 */
	public hitTest(
		x: number,
		y: number,
		priceToCoordinate: PriceToCoordinateConverter
	): StackedAreaHitTestResult | null {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null || data.visibleRange === null) {
			return null;
		}
		const { from, to } = data.visibleRange;
		if (from >= to) { return null; }
		const range = extendRange({ from, to }, data.bars.length);
		const coordinate = (index: number): number => barCoordinate(data.bars[index], data.bars[from], data.barSpacing);
		const segments = options.gapHandling === 'break' ? visibleSegments(data.bars, range, this._isGap) : [range];
		// A nearest bar can be arbitrarily far away across an unpainted gap.
		// Only consider the run whose drawn horizontal extent contains the cursor.
		const segment = segments.find(run => run.to - run.from > 1 && x >= coordinate(run.from) && x <= coordinate(run.to - 1));
		if (segment === undefined) { return null; }
		let hitIndex = -1;
		let hitDistance = Number.POSITIVE_INFINITY;
		for (let i = segment.from; i < segment.to; i++) {
			const distance = Math.abs(coordinate(i) - x);
			if (distance < hitDistance) {
				hitDistance = distance;
				hitIndex = i;
			}
		}
		if (hitIndex < 0) {
			return null;
		}
		const values = data.bars[hitIndex].originalData.values;
		const levels = this._levels(values, values.length, options);
		let previousY = priceToCoordinate(options.base);
		if (previousY === null) {
			return null;
		}
		for (let band = 0; band < levels.length; band++) {
			const levelY = priceToCoordinate(levels[band]);
			if (levelY === null) {
				continue;
			}
			const top = Math.min(previousY, levelY);
			const bottom = Math.max(previousY, levelY);
			previousY = levelY;
			if (y >= top && y <= bottom) {
				return {
					distance: 0,
					objectId: String(band),
					type: 'range',
					hitTestData: { bandIndex: band },
				};
			}
		}
		return null;
	}

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, StackedAreaSeriesOptions>
	): void {
		const { data, options, priceToCoordinate, from, to, isHovered, hitTestData } = args;
		const baseY = priceToCoordinate(options.base);
		if (baseY === null) {
			return;
		}
		const range = extendRange({ from, to }, data.bars.length);
		let bandCount = 0;
		for (let i = range.from; i < range.to; i++) {
			bandCount = Math.max(bandCount, data.bars[i].originalData.values.length);
		}
		if (bandCount === 0) {
			return;
		}
		const points = new Array<AreaPoint>(range.to - range.from);
		for (let i = range.from; i < range.to; i++) {
			const bar: CustomBarItemData<HorzScaleItem, TData> = data.bars[i];
			const levels = this._levels(bar.originalData.values, bandCount, options);
			points[i - range.from] = {
				x: barCoordinate(bar, data.bars[from], data.barSpacing),
				ys: levels.map((level: number): number => priceToCoordinate(level) ?? baseY),
				colors: bar.originalData.colors,
			};
		}

		const segments = options.gapHandling === 'break'
			? visibleSegments(data.bars, range, this._isGap)
			: [range];
		const hoveredBand = isHovered && isHitTestData(hitTestData)
			? hitTestData.bandIndex
			: null;
		const scrim = hoveredBand === null ? null : new Path2D();

		for (const segment of segments) {
			this._drawSegment(scope, options, segment, range.from, points, baseY, bandCount, hoveredBand, scrim);
		}

		if (scrim !== null) {
			scope.context.fillStyle = hoverScrimColor;
			scope.context.fill(scrim);
		}
	}

	/** Price of the top of each band of one point, in stacking order. */
	private _levels(
		values: readonly number[],
		bandCount: number,
		options: StackedAreaSeriesOptions
	): number[] {
		const padded = paddedValues(values, bandCount);
		return stackLevels(options.percent ? percentValues(padded) : padded, options.base);
	}

	private _drawSegment(
		scope: BitmapCoordinatesRenderingScope,
		options: StackedAreaSeriesOptions,
		segment: IRange<number>,
		offset: number,
		points: readonly AreaPoint[],
		baseY: number,
		bandCount: number,
		hoveredBand: number | null,
		scrim: Path2D | null
	): void {
		const ctx = scope.context;
		const { horizontalPixelRatio, verticalPixelRatio } = scope;
		const point = (index: number): AreaPoint => points[index - offset];
		const yOf = (index: number, band: number): number =>
			band < 0 ? baseY : point(index).ys[band];
		const positions = (run: IRange<number>, band: number, reversed: boolean): Position[] => {
			const result: Position[] = [];
			for (let i = run.from; i < run.to; i++) {
				const index = reversed ? run.from + run.to - 1 - i : i;
				result.push({
					x: point(index).x * horizontalPixelRatio,
					y: yOf(index, band) * verticalPixelRatio,
				});
			}
			return result;
		};

		for (let band = 0; band < bandCount; band++) {
			const runs = styleRuns(
				segment.from,
				segment.to,
				(index: number): string => {
					const style = bandStyle(options, band, point(index));
					return `${style.area}|${style.areaBottom ?? ''}`;
				}
			);
			for (const run of runs) {
				const style = bandStyle(options, band, point(run.from));
				if (!style.areaVisible || run.to - run.from < 2) {
					continue;
				}
				const upperPoints = positions(run, band, false);
				const lowerPoints = positions(run, band - 1, true);
				const path = areaBetween(
					buildPath(upperPoints, options.lineType),
					buildPath(lowerPoints, options.lineType, true)
				);
				ctx.fillStyle = style.areaBottom === undefined
					? style.area
					: this._gradient(ctx, upperPoints, lowerPoints, style.area, style.areaBottom);
				ctx.fill(path);
				if (scrim !== null && hoveredBand !== band) {
					scrim.addPath(path);
				}
			}
		}

		ctx.lineJoin = 'round';
		for (let band = 0; band < bandCount; band++) {
			const runs = styleRuns(
				segment.from,
				segment.to,
				(index: number): string => bandStyle(options, band, point(index)).line
			);
			for (const run of runs) {
				const style = bandStyle(options, band, point(run.from));
				if (!style.lineVisible || run.to - run.from < 2) {
					continue;
				}
				const line = buildPath(positions(run, band, false), options.lineType);
				ctx.lineWidth = style.lineWidth * horizontalPixelRatio;
				setLineStyle(ctx, style.lineStyle);
				ctx.strokeStyle = style.line;
				ctx.stroke(line.path);
			}
		}
		ctx.setLineDash([]);
	}

	/** A vertical gradient spanning the part of the band being filled. */
	private _gradient(
		ctx: CanvasRenderingContext2D,
		upper: readonly Position[],
		lower: readonly Position[],
		top: string,
		bottom: string
	): CanvasGradient {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;
		for (const point of [...upper, ...lower]) {
			min = Math.min(min, point.y);
			max = Math.max(max, point.y);
		}
		const gradient = ctx.createLinearGradient(0, min, 0, max);
		gradient.addColorStop(0, top);
		gradient.addColorStop(1, bottom);
		return gradient;
	}
}
