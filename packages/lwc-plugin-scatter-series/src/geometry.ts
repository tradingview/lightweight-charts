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

/**
 * Pane coordinates of every visible point of `model`, in CSS pixels, ready for
 * {@link hitTestScatter}. Hidden points and points whose Y has no coordinate
 * get `NaN`.
 */
export function computeGeometry(model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): ScatterHitGeometry {
	const arrays = allocate(model);
	fill(arrays, model, mapping, yToCoordinate);
	return { ...arrays, order: model.drawOrder };
}

/*
 Two prices whose coordinates pin down the price scale: its mapping is linear
 in the price, or in its logarithm, so two positive prices determine it.
 */
const PROBE_LOW = 1;
const PROBE_HIGH = 2;

/**
 * {@link computeGeometry} for the pointer: the arrays are allocated once per
 * model and filled again only when the scales moved, so hit testing on every
 * pointer move neither allocates nor recomputes the coordinates of thousands
 * of points.
 */
export class ScatterGeometryCache {
	private _model: ScatterModel | null = null;
	private _arrays: GeometryArrays | null = null;
	private _geometry: ScatterHitGeometry | null = null;
	private _key: number[] = [];

	public geometry(model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): ScatterHitGeometry {
		if (model !== this._model || this._arrays === null) {
			this._model = model;
			this._arrays = allocate(model);
			this._geometry = null;
		}
		const key = [
			mapping.start,
			mapping.origin,
			mapping.pxPerUnit,
			yToCoordinate(PROBE_LOW) ?? Number.NaN,
			yToCoordinate(PROBE_HIGH) ?? Number.NaN,
		];
		if (this._geometry === null || key.some((value: number, i: number) => !Object.is(value, this._key[i]))) {
			fill(this._arrays, model, mapping, yToCoordinate);
			this._geometry = { ...this._arrays, order: model.drawOrder };
			this._key = key;
		}
		return this._geometry;
	}
}
