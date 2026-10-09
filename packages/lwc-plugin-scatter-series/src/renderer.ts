import {
	CustomSeriesHitTestResult,
	ICustomSeriesPaneRenderer,
	LineStyle,
	PriceToCoordinateConverter,
} from 'lightweight-charts';
import { beginMarker, beginMarkerOffset } from '@tradingview/lwc-toolkit/canvas/markers';
import type {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
import { setLineStyle } from '@tradingview/lwc-toolkit/line-style';

import { XMapping, YToCoordinate, isInPane, xToCoordinate } from './geometry';
import { ScatterHitGeometry, hitTestScatter } from './hit-test';
import type { ScatterModel } from './model';
import { DEFAULT_LINE_COLOR, ScatterBaseline, ScatterPlotBorder } from './options';
import { cappedStrokeWidth } from './size';
import { strokeColorOf } from './style';

/** Least radius a marker is traced at, bitmap pixels: a smaller one would vanish. */
const MIN_TRACE_RADIUS = 0.5;

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
	/** Where the points are, for drawing and hit testing. */
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

/**
 * Draws the whole scatter dataset. The series data handed over by the chart
 * is only the slot grid; the points themselves come from the model, drawn at
 * their exact X through the frame's {@link XMapping}.
 *
 * Drawing order: plot border and baselines, group lines, points (groupless
 * first, then group by group, each in data order), and the hovered point on
 * top at `hoveredOpacity`. Lines and shapes are drawn in the bitmap
 * coordinate space; a point's size includes its stroke.
 *
 * Not a `CustomSeriesRendererBase`: that base draws the series data in the
 * visible range, and this renderer draws none of it.
 */
export class ScatterSeriesRenderer implements ICustomSeriesPaneRenderer {
	readonly #state: ScatterRenderState;
	// The hit test data last reported: the chart compares it by reference, and
	// repaints the pane whenever it is another object.
	#hitData: ScatterHitData | null = null;

	public constructor(state: ScatterRenderState) {
		this.#state = state;
	}

	public draw(
		target: CanvasRenderingTarget2D,
		priceToCoordinate: PriceToCoordinateConverter,
		isHovered: boolean,
		hitTestData?: unknown
	): void {
		const mapping = this.#state.xMapping();
		if (mapping === null) {
			return;
		}
		const model = this.#state.model();
		const options = this.#state.options();
		// The chart passes back the hit test data of the point under the
		// pointer, unless it was found in a model replaced since. When it
		// reports nothing, fall back to the point hovered through the API.
		const hoveredIndex = isHovered && isHitData(hitTestData) && hitTestData.model === model
			? hitTestData.index
			: this.#state.hoveredIndex();
		const background = this.#state.backgroundColor();
		// The coordinates of the points, computed again only when the scales moved.
		const geometry = this.#state.geometry(model, mapping, priceToCoordinate);
		target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) => {
			const ctx = scope.context;
			ctx.save();
			try {
				this.#drawPlotBorder(scope, options);
				this.#drawBaselines(scope, options, mapping, priceToCoordinate);
				this.#drawLines(scope, model, geometry, mapping, priceToCoordinate);
				this.#drawPoints(scope, model, options, background, geometry, hoveredIndex);
			} finally {
				ctx.restore();
			}
		});
		this.#state.drawn();
	}

	/**
	 * Reports the point under the cursor, with its `objectId`, and its data
	 * index as the hit test data. Optional on `ICustomSeriesPaneRenderer`; the
	 * chart calls it from `lightweight-charts` 5.2.
	 */
	public hitTest(x: number, y: number, priceToCoordinate: PriceToCoordinateConverter): CustomSeriesHitTestResult | null {
		const mapping = this.#state.xMapping();
		if (mapping === null) {
			return null;
		}
		const model = this.#state.model();
		const geometry = this.#state.geometry(model, mapping, priceToCoordinate);
		const options = this.#state.options();
		const hit = hitTestScatter(geometry, x, y, this.#state.hoveredIndex(), options.hitTestTolerance, options.hoveredSizeIncrease);
		this.#state.hit(model, hit !== null ? hit.index : null);
		if (hit === null) {
			return null;
		}
		// The same object while the same point is under the pointer: a move
		// within the point repaints nothing.
		if (this.#hitData === null || this.#hitData.model !== model || this.#hitData.index !== hit.index) {
			this.#hitData = { model, index: hit.index };
		}
		return {
			distance: hit.distance,
			objectId: model.resolved[hit.index].id,
			type: 'point',
			cursorStyle: 'pointer',
			hitTestData: this.#hitData,
		};
	}

	#drawPlotBorder(scope: BitmapCoordinatesRenderingScope, options: Readonly<ScatterRenderOptions>): void {
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
			setLineStyle(ctx, border.style);
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

	#drawBaselines(
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
			ctx.strokeStyle = baseline.color ?? DEFAULT_LINE_COLOR;
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
			setLineStyle(ctx, baseline.style ?? LineStyle.Solid);
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}

	#drawLines(
		scope: BitmapCoordinatesRenderingScope,
		model: ScatterModel,
		geometry: ScatterHitGeometry,
		mapping: XMapping,
		priceToCoordinate: PriceToCoordinateConverter
	): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope;
		const { xs, ys } = geometry;
		ctx.lineJoin = 'round';
		ctx.globalAlpha = 1;
		for (const group of model.groups) {
			if (!group.visible || !group.lineVisible || !(group.lineWidth > 0)) {
				continue;
			}
			// A cap lengthens every dash by the line width, which would close the
			// gaps of a dotted line: dashed lines are drawn without, as the chart's
			// own lines are; a solid one keeps its round ends.
			ctx.lineCap = group.lineStyle === LineStyle.Solid ? 'round' : 'butt';
			ctx.lineWidth = group.lineWidth * horizontalPixelRatio;
			setLineStyle(ctx, group.lineStyle);
			ctx.strokeStyle = group.lineColor;
			ctx.beginPath();
			let penDown = false;
			for (const index of model.groupMembers[group.index]) {
				let x = xs[index];
				let y: number | null = ys[index];
				if (Number.isNaN(x)) {
					// Not drawn as a point (beyond the X domain): the line still goes there.
					const point = model.resolved[index];
					x = xToCoordinate(mapping, point.x);
					y = priceToCoordinate(point.y);
				}
				if (y === null || Number.isNaN(y)) {
					// Never draw to NaN: break the line instead.
					penDown = false;
					continue;
				}
				const bx = x * horizontalPixelRatio;
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
	#drawPoints(
		scope: BitmapCoordinatesRenderingScope,
		model: ScatterModel,
		options: Readonly<ScatterRenderOptions>,
		background: string,
		geometry: ScatterHitGeometry,
		hoveredIndex: number | null
	): void {
		const { context: ctx, mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
		const { xs, ys } = geometry;
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
			const size = point.size + grow;
			const radius = size / 2;
			const reach = radius + (ring ? options.hoveredRingGap + options.hoveredRingWidth : 0);
			// Cull points entirely outside the pane, and those with no coordinates (NaN).
			const x = xs[index];
			const y = ys[index];
			if (!isInPane(x, y, reach, mediaSize.width, mediaSize.height)) {
				return;
			}
			if (opacity !== alpha) {
				alpha = opacity;
				ctx.globalAlpha = alpha;
			}
			const strokeWidth = cappedStrokeWidth(size, point.strokeWidth) * pixelRatio;
			const outer = radius * pixelRatio;
			const centreLine = Math.max(MIN_TRACE_RADIUS, outer - strokeWidth / 2);
			const bx = x * horizontalPixelRatio;
			const by = y * verticalPixelRatio;
			// One marker per path: a circle is drawn by `arc` alone, as an exact oval.
			beginMarker(ctx, point.shape, bx, by, centreLine);
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
				beginMarkerOffset(
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
