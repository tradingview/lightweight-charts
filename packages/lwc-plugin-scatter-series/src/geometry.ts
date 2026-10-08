import type { ScatterHitGeometry } from './hit-test';
import type { ScatterModel } from './model';
import type { ScatterShape } from './options';

/**
 * How X values map to horizontal pane coordinates for one frame:
 * `x ↦ origin + (x − start) × pxPerUnit`, in CSS pixels.
 *
 * Points are drawn at their exact fractional X, not snapped to a slot. The
 * mapping is linear because the slots are evenly spaced on the time scale,
 * which holds as long as no other series adds time points between them.
 */
export interface XMapping {
	/** X value of the first slot. */
	start: number;
	/** Pane coordinate of the first slot. */
	origin: number;
	/** Pixels per X unit. */
	pxPerUnit: number;
}

/** The pane coordinate of an X value. */
export function xToCoordinate(mapping: XMapping, x: number): number {
	return mapping.origin + (x - mapping.start) * mapping.pxPerUnit;
}

/** The X value at a pane coordinate: the inverse of {@link xToCoordinate}. */
export function coordinateToX(mapping: XMapping, coordinate: number): number {
	return mapping.start + (coordinate - mapping.origin) / mapping.pxPerUnit;
}

/** Converts a Y value to a pane coordinate, or `null` when it cannot. */
export type YToCoordinate = (y: number) => number | null;

/** Whether a marker of radius `radius` centred on `(x, y)` reaches into a pane of `width` × `height`. */
export function isInPane(x: number, y: number, radius: number, width: number, height: number): boolean {
	return x + radius >= 0 && x - radius <= width && y + radius >= 0 && y - radius <= height;
}

interface GeometryArrays {
	xs: Float64Array;
	ys: Float64Array;
	radii: Float64Array;
	shapes: ScatterShape[];
	strokeWidths: Float64Array;
}

function allocate(model: ScatterModel): GeometryArrays {
	const count = model.resolved.length;
	const radii = new Float64Array(count);
	const strokeWidths = new Float64Array(count);
	const shapes = new Array<ScatterShape>(count);
	for (let index = 0; index < count; index++) {
		const point = model.resolved[index];
		radii[index] = point.size / 2;
		strokeWidths[index] = point.strokeWidth;
		shapes[index] = point.shape;
	}
	return { xs: new Float64Array(count), ys: new Float64Array(count), radii, shapes, strokeWidths };
}

function fill(arrays: GeometryArrays, model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): void {
	const { xs, ys } = arrays;
	xs.fill(Number.NaN);
	ys.fill(Number.NaN);
	for (const index of model.drawOrder) {
		const point = model.resolved[index];
		const y = yToCoordinate(point.y);
		if (y === null) {
			continue;
		}
		xs[index] = xToCoordinate(mapping, point.x);
		ys[index] = y;
	}
}

/*
 Prices whose coordinates pin down the price scale: its mapping is linear in
 the price, or in `log10(|price| + offset)` (the library's logarithmic
 formula), so three positive prices determine it.
 */
const PROBES: readonly number[] = [1, 2, 1000];

/**
 * Pane coordinates of every visible point of a model, in CSS pixels, for
 * drawing and for {@link hitTestScatter}; hidden points and points whose Y
 * has no coordinate get `NaN`. The arrays are allocated once per model and
 * filled again only when the scales moved, so neither a repaint over unmoved
 * scales (a hover change) nor a hit test on every pointer move recomputes the
 * coordinates of thousands of points.
 */
export class ScatterGeometryCache {
	#model: ScatterModel | null = null;
	#arrays: GeometryArrays | null = null;
	#geometry: ScatterHitGeometry | null = null;
	// The scales the arrays were filled for: the X mapping, then the coordinates of the probes.
	readonly #scales: Float64Array = new Float64Array(3 + PROBES.length);
	readonly #next: Float64Array = new Float64Array(3 + PROBES.length);
	#fills: number = 0;

	public geometry(model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): ScatterHitGeometry {
		if (model !== this.#model || this.#arrays === null) {
			this.#model = model;
			this.#arrays = allocate(model);
			this.#geometry = null;
		}
		const next = this.#next;
		next[0] = mapping.start;
		next[1] = mapping.origin;
		next[2] = mapping.pxPerUnit;
		for (let i = 0; i < PROBES.length; i++) {
			next[3 + i] = yToCoordinate(PROBES[i]) ?? Number.NaN;
		}
		let moved = this.#geometry === null;
		for (let i = 0; i < next.length && !moved; i++) {
			moved = !Object.is(next[i], this.#scales[i]);
		}
		if (moved) {
			fill(this.#arrays, model, mapping, yToCoordinate);
			this.#geometry = { ...this.#arrays, order: model.drawOrder };
			this.#scales.set(next);
			this.#fills++;
		}
		return this.#geometry as ScatterHitGeometry;
	}

	/** How many times the coordinates were computed: it changes whenever the model or the scales do. */
	public fills(): number {
		return this.#fills;
	}
}
