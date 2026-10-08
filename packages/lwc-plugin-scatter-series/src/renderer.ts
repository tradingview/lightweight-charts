import type {
	CustomSeriesHitTestResult,
	ICustomSeriesPaneRenderer,
	PriceToCoordinateConverter,
} from 'lightweight-charts';
import type {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import { setLineStyle, type LineStyle as ToolkitLineStyle } from '@tradingview/lwc-toolkit/line-style';
import type { LineStyle } from 'lightweight-charts';

import { XMapping, YToCoordinate, isInPane, xToCoordinate } from './geometry';
import { ScatterHitGeometry, hitTestScatter } from './hit-test';
import type { ScatterModel } from './model';
import type { ScatterBaseline, ScatterPlotBorder, ScatterShape } from './options';
import { traceMarkerOffset } from './shapes';
import { cappedStrokeWidth } from './size';
import { strokeColorOf } from './style';

/** Default colour of a baseline which sets none. */
const DEFAULT_BASELINE_COLOR = '#9598A1';

/** `LineStyle.Solid`. */
const SOLID = 0 as LineStyle;

/** The options the renderer draws and hit tests with. */
export interface ScatterRenderOptions {
	/** Opacity of the hovered point, `0`–`1`. */
	hoveredOpacity: number;
	/** Pixels added to the size of the hovered point, at least `0`. */
	hoveredSizeIncrease: number;
	/** Width of the ring around the hovered point, CSS pixels; `0` for none. */
	hoveredRingWidth: number;
	/** Colour of that ring; `null` for the point colour. */
	hoveredRingColor: string | null;
	/** Room between the hovered point and its ring, CSS pixels, at least `0`. */
	hoveredRingGap: number;
	/** Accent border along the plot edges. */
	plotBorder: ScatterPlotBorder;
	/** Reference lines under the points. */
	baselines: readonly ScatterBaseline[];
	/** How far outside a point the pointer may be and still hover it, CSS pixels. */
	hitTestTolerance: number;
}

/** What the renderer reads from the series on every frame. */
export interface ScatterRenderState {
	/** The current model. */
	model(): ScatterModel;
	/** The current options. */
	options(): Readonly<ScatterRenderOptions>;
	/** The chart's background colour for this frame: the automatic ring colour of filled points. */
	backgroundColor(): string;
	/** The X mapping of the current frame, or `null` when the X axis has no points yet. */
	xMapping(): XMapping | null;
	/**
	 * Data index of the point highlighted when the chart reports none: the one
	 * hovered by the pointer, else the one set with `setHoveredPoint`.
	 */
	hoveredIndex(): number | null;
	/** Where the points are, for hit testing. */
	geometry(model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): ScatterHitGeometry;
	/** Called with the data index of the point every hit test finds, or `null`. */
	hit(model: ScatterModel, index: number | null): void;
	/** Called after every draw, once the frame's geometry is final. */
	drawn(): void;
}

/**
 * The hit test data of a point: its data index in the model it was found in.
 * A point is identified by index, not by `objectId`, so that a duplicate id
 * still highlights the point under the pointer.
 */
interface ScatterHitData {
	model: ScatterModel;
	index: number;
}

function isHitData(value: unknown): value is ScatterHitData {
	return typeof value === 'object' && value !== null && typeof (value as Partial<ScatterHitData>).index === 'number';
}

function toolkitStyle(style: LineStyle): ToolkitLineStyle {
	// The library's `LineStyle` enum has the toolkit's values.
	return style as unknown as ToolkitLineStyle;
}

/** Adds the outline of a marker centred on `(x, y)` to the current path, in bitmap pixels. */
function traceMarker(ctx: CanvasRenderingContext2D, shape: ScatterShape, x: number, y: number, r: number): void {
	switch (shape) {
		case 'square':
			ctx.rect(x - r, y - r, 2 * r, 2 * r);
			return;
		case 'diamond':
			ctx.moveTo(x, y - r);
			ctx.lineTo(x + r, y);
			ctx.lineTo(x, y + r);
			ctx.lineTo(x - r, y);
			ctx.closePath();
			return;
		case 'triangleUp':
			ctx.moveTo(x, y - r);
			ctx.lineTo(x + r, y + r);
			ctx.lineTo(x - r, y + r);
			ctx.closePath();
			return;
		case 'triangleDown':
			ctx.moveTo(x, y + r);
			ctx.lineTo(x + r, y - r);
			ctx.lineTo(x - r, y - r);
			ctx.closePath();
			return;
		default:
			ctx.arc(x, y, r, 0, 2 * Math.PI);
	}
}

/**
 * Draws the whole scatter dataset. The series data handed over by the chart
 * is only the slot grid; the points themselves come from the model, drawn at
 * their exact X through the frame's {@link XMapping}.
 *
 * Drawing order: plot border and baselines, group lines, points (groupless
 * first, then group by group, each in data order), and the hovered point on
 * top at `hoveredOpacity`. Lines and shapes are drawn in the bitmap
 * coordinate space; a point's size includes its stroke.
 */
export class ScatterSeriesRenderer implements ICustomSeriesPaneRenderer {
	private readonly _state: ScatterRenderState;

	public constructor(state: ScatterRenderState) {
		this._state = state;
	}

	public draw(
		target: CanvasRenderingTarget2D,
		priceToCoordinate: PriceToCoordinateConverter,
		isHovered: boolean,
		hitTestData?: unknown
	): void {
		const mapping = this._state.xMapping();
		if (mapping === null) {
			return;
		}
		const model = this._state.model();
		const options = this._state.options();
		// The chart passes back the hit test data of the point under the
		// pointer, unless it was found in a model replaced since. When it
		// reports nothing, fall back to the point hovered through the API.
		const hoveredIndex = isHovered && isHitData(hitTestData) && hitTestData.model === model
			? hitTestData.index
			: this._state.hoveredIndex();
		const background = this._state.backgroundColor();
		target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
			const ctx = scope.context;
			ctx.save();
			try {
				this._drawPlotBorder(scope, options);
				this._drawBaselines(scope, options, mapping, priceToCoordinate);
				this._drawLines(scope, model, mapping, priceToCoordinate);
				this._drawPoints(scope, model, options, background, mapping, priceToCoordinate, hoveredIndex);
			} finally {
				ctx.restore();
			}
		});
		this._state.drawn();
	}

	/**
	 * Reports the point under the cursor, with its `objectId`, and its data
	 * index as the hit test data. Optional on `ICustomSeriesPaneRenderer`; the
	 * chart calls it from `lightweight-charts` 5.2.
	 */
	public hitTest(x: number, y: number, priceToCoordinate: PriceToCoordinateConverter): CustomSeriesHitTestResult | null {
		const mapping = this._state.xMapping();
		if (mapping === null) {
			return null;
		}
		const model = this._state.model();
		const geometry = this._state.geometry(model, mapping, priceToCoordinate);
		const options = this._state.options();
		const hit = hitTestScatter(geometry, x, y, this._state.hoveredIndex(), options.hitTestTolerance, options.hoveredSizeIncrease);
		this._state.hit(model, hit !== null ? hit.index : null);
		if (hit === null) {
			return null;
		}
		const hitTestData: ScatterHitData = { model, index: hit.index };
		return {
			distance: hit.distance,
			objectId: model.resolved[hit.index].id,
			type: 'point',
			cursorStyle: 'pointer',
			hitTestData,
		};
	}

	private _drawPlotBorder(scope: BitmapCoordinatesRenderingScope, options: Readonly<ScatterRenderOptions>): void {
		const border = options.plotBorder;
		if (!border.visible || !(border.width > 0)) {
			return;
		}
		const { context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio } = scope;
		const vertical = Math.max(1, Math.round(border.width * horizontalPixelRatio));
		const horizontal = Math.max(1, Math.round(border.width * verticalPixelRatio));
		ctx.strokeStyle = border.color;
		ctx.lineCap = 'butt';
		ctx.globalAlpha = 1;
		const edge = (width: number, x1: number, y1: number, x2: number, y2: number): void => {
			ctx.lineWidth = width;
			setLineStyle(ctx, toolkitStyle(border.style));
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		};
		// Each edge sits inside the plot, so the whole width is visible. The
		// side edges stop at the top and bottom ones, so that a translucent
		// colour does not darken the corners.
		const top = border.top ? horizontal : 0;
		const bottom = bitmapSize.height - (border.bottom ? horizontal : 0);
		if (border.top) {
			edge(horizontal, 0, horizontal / 2, bitmapSize.width, horizontal / 2);
		}
		if (border.bottom) {
			edge(horizontal, 0, bitmapSize.height - horizontal / 2, bitmapSize.width, bitmapSize.height - horizontal / 2);
		}
		if (border.left) {
			edge(vertical, vertical / 2, top, vertical / 2, bottom);
		}
		if (border.right) {
			edge(vertical, bitmapSize.width - vertical / 2, top, bitmapSize.width - vertical / 2, bottom);
		}
		ctx.setLineDash([]);
	}

	private _drawBaselines(
		scope: BitmapCoordinatesRenderingScope,
		options: Readonly<ScatterRenderOptions>,
		mapping: XMapping,
		priceToCoordinate: PriceToCoordinateConverter
	): void {
		const { context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio } = scope;
		ctx.lineCap = 'butt';
		ctx.globalAlpha = 1;
		for (const baseline of options.baselines) {
			if (!Number.isFinite(baseline.value)) {
				continue;
			}
			const width = baseline.width !== undefined && baseline.width > 0 ? baseline.width : 1;
			// At least one device pixel, as the plot border: a line rounded to no
			// width would be drawn with the width of the line before it.
			const bitmapWidth = (pixelRatio: number): number => Math.max(1, Math.round(width * pixelRatio));
			ctx.strokeStyle = baseline.color ?? DEFAULT_BASELINE_COLOR;
			ctx.beginPath();
			if (baseline.axis === 'y') {
				const y = priceToCoordinate(baseline.value);
				if (y === null) {
					continue;
				}
				const line = positionsLine(y, verticalPixelRatio, bitmapWidth(verticalPixelRatio), true);
				const centre = line.position + line.length / 2;
				ctx.lineWidth = line.length;
				ctx.moveTo(0, centre);
				ctx.lineTo(bitmapSize.width, centre);
			} else {
				const x = xToCoordinate(mapping, baseline.value);
				const line = positionsLine(x, horizontalPixelRatio, bitmapWidth(horizontalPixelRatio), true);
				const centre = line.position + line.length / 2;
				ctx.lineWidth = line.length;
				ctx.moveTo(centre, 0);
				ctx.lineTo(centre, bitmapSize.height);
			}
			setLineStyle(ctx, toolkitStyle(baseline.style ?? (0 as LineStyle)));
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}

	private _drawLines(
		scope: BitmapCoordinatesRenderingScope,
		model: ScatterModel,
		mapping: XMapping,
		priceToCoordinate: PriceToCoordinateConverter
	): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		ctx.lineJoin = 'round';
		ctx.globalAlpha = 1;
		for (const group of model.groups) {
			if (!group.visible || !group.lineVisible || !(group.lineWidth > 0)) {
				continue;
			}
			// A cap lengthens every dash by the line width, which would close the
			// gaps of a dotted line: dashed lines are drawn without, as the chart's
			// own lines are; a solid one keeps its round ends.
			ctx.lineCap = group.lineStyle === SOLID ? 'round' : 'butt';
			ctx.lineWidth = group.lineWidth * horizontalPixelRatio;
			setLineStyle(ctx, toolkitStyle(group.lineStyle));
			ctx.strokeStyle = group.lineColor;
			ctx.beginPath();
			let penDown = false;
			for (const index of model.groupMembers[group.index]) {
				const point = model.resolved[index];
				const y = priceToCoordinate(point.y);
				if (y === null) {
					// Never draw to NaN: break the line instead.
					penDown = false;
					continue;
				}
				const bx = xToCoordinate(mapping, point.x) * horizontalPixelRatio;
				const by = y * verticalPixelRatio;
				if (penDown) {
					ctx.lineTo(bx, by);
				} else {
					ctx.moveTo(bx, by);
					penDown = true;
				}
			}
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}

	/**
	 * Draws the visible points, then the hovered one on top, at
	 * `hoveredOpacity`, grown by `hoveredSizeIncrease` and with its ring.
	 *
	 * A point's size includes its stroke: the stroke is centred on a radius
	 * half its width inside the outer edge, and the fill reaches it. The stroke
	 * is at most a quarter of the size, so a small point keeps its colour. A
	 * hollow point is the stroke alone, in the point colour unless a stroke
	 * colour is set. The context state changes only between points that differ.
	 */
	private _drawPoints(
		scope: BitmapCoordinatesRenderingScope,
		model: ScatterModel,
		options: Readonly<ScatterRenderOptions>,
		background: string,
		mapping: XMapping,
		priceToCoordinate: PriceToCoordinateConverter,
		hoveredIndex: number | null
	): void {
		const { context: ctx, mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
		const pixelRatio = horizontalPixelRatio;
		ctx.lineJoin = 'round';
		ctx.setLineDash([]);
		let fillStyle: string | null = null;
		let strokeStyle: string | null = null;
		let lineWidth = -1;
		let alpha = -1;

		/** Draws a point at `opacity`, `grow` pixels larger, and with the hover ring when `ring`. */
		const drawPoint = (index: number, opacity: number, grow: number, ring: boolean): void => {
			const point = model.resolved[index];
			const y = priceToCoordinate(point.y);
			if (y === null) {
				return;
			}
			const x = xToCoordinate(mapping, point.x);
			const size = point.size + grow;
			const radius = size / 2;
			const ringReach = ring ? options.hoveredRingGap + options.hoveredRingWidth : 0;
			// Cull points entirely outside the pane.
			if (!isInPane(x, y, radius + ringReach, mediaSize.width, mediaSize.height)) {
				return;
			}
			if (opacity !== alpha) {
				alpha = opacity;
				ctx.globalAlpha = alpha;
			}
			const strokeWidth = cappedStrokeWidth(size, point.strokeWidth) * pixelRatio;
			const outer = radius * pixelRatio;
			const centreLine = Math.max(0.5, outer - strokeWidth / 2);
			const bx = x * horizontalPixelRatio;
			const by = y * verticalPixelRatio;
			ctx.beginPath();
			traceMarker(ctx, point.shape, bx, by, centreLine);
			if (!point.hollow) {
				if (point.color !== fillStyle) {
					fillStyle = point.color;
					ctx.fillStyle = fillStyle;
				}
				ctx.fill();
			}
			if (strokeWidth > 0) {
				const color = strokeColorOf(point, background);
				if (color !== strokeStyle) {
					strokeStyle = color;
					ctx.strokeStyle = color;
				}
				if (strokeWidth !== lineWidth) {
					lineWidth = strokeWidth;
					ctx.lineWidth = lineWidth;
				}
				ctx.stroke();
			}
			if (ring) {
				// Centred `gap + width / 2` outside the outer edge of the marker.
				const ringWidth = options.hoveredRingWidth * pixelRatio;
				ctx.beginPath();
				traceMarkerOffset(
					ctx,
					point.shape,
					bx,
					by,
					centreLine,
					strokeWidth / 2 + options.hoveredRingGap * pixelRatio + ringWidth / 2
				);
				strokeStyle = options.hoveredRingColor ?? point.color;
				ctx.strokeStyle = strokeStyle;
				lineWidth = ringWidth;
				ctx.lineWidth = lineWidth;
				ctx.stroke();
			}
		};

		for (const index of model.drawOrder) {
			if (index !== hoveredIndex) {
				drawPoint(index, model.resolved[index].opacity, 0, false);
			}
		}
		if (hoveredIndex !== null && model.resolved[hoveredIndex]?.visible === true) {
			drawPoint(
				hoveredIndex,
				options.hoveredOpacity,
				options.hoveredSizeIncrease,
				options.hoveredRingWidth > 0
			);
		}
	}
}
