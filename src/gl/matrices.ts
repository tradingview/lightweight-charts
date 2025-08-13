import { ViewportSize } from './types';

// Returns a 4x4 matrix mapping media pixel coordinates (0..W, 0..H) to GL clip space (-1..1)
export function createClipFromMediaMatrix(size: ViewportSize): Float32Array {
	const W = Math.max(1, Math.floor(size.widthCssPx * size.devicePixelRatio));
	const H = Math.max(1, Math.floor(size.heightCssPx * size.devicePixelRatio));
	// Column-major 4x4: scale to 2/W, -2/H then translate -1, +1
	return new Float32Array([
		2 / W, 0, 0, 0,
		0, -2 / H, 0, 0,
		0, 0, 1, 0,
		-1, 1, 0, 1,
	]);
}

// Composes a simple 2D affine transform for time/price to media pixel, then to clip
// For v1 we let series derive time->x and price->y via callbacks and build the matrix at draw time if needed
export function composeClipFromTimePrice(
	clipFromMedia: Float32Array,
	scaleX: number,
	translateX: number,
	scaleY: number,
	translateY: number
): Float32Array {
	// MediaFromTimePrice = [ scaleX 0 0 translateX; 0 scaleY 0 translateY; 0 0 1 0; 0 0 0 1 ]
	const m = new Float32Array([
		scaleX, 0, 0, 0,
		0, scaleY, 0, 0,
		0, 0, 1, 0,
		translateX, translateY, 0, 1,
	]);
	return multiply4x4(clipFromMedia, m);
}

export function multiply4x4(a: Float32Array, b: Float32Array): Float32Array {
	const out = new Float32Array(16);
	for (let r = 0; r < 4; r++) {
		for (let c = 0; c < 4; c++) {
			out[c * 4 + r] = a[0 * 4 + r] * b[c * 4 + 0] + a[1 * 4 + r] * b[c * 4 + 1] + a[2 * 4 + r] * b[c * 4 + 2] + a[3 * 4 + r] * b[c * 4 + 3];
		}
	}
	return out;
}

