import { ViewportSize, WebGLLayerOptions } from './types';

export interface CreatedGLContext {
	canvas: HTMLCanvasElement;
	gl: WebGL2RenderingContext | null;
}

export function createWebGL2Context(
	canvas: HTMLCanvasElement,
	options: Partial<WebGLLayerOptions>
): WebGL2RenderingContext | null {
	const {
		antialias = true,
		premultipliedAlpha = true,
		preserveDrawingBuffer = false,
		powerPreference = 'high-performance',
	} = options;

	const gl: WebGL2RenderingContext | null = canvas.getContext('webgl2', {
		antialias,
		premultipliedAlpha,
		preserveDrawingBuffer,
		powerPreference,
		alpha: true,
		depth: false,
		stencil: false,
		desynchronized: true,
	});

	if (!gl) {
		return null;
	}

	// Initial GL state suitable for blending over opaque 2D base canvas
	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.STENCIL_TEST);
	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	);
	return gl;
}

export function resizeGLViewport(
	gl: WebGL2RenderingContext,
	canvas: HTMLCanvasElement,
	size: ViewportSize
): void {
	const width = Math.max(
		1,
		Math.floor(size.widthCssPx * size.devicePixelRatio)
	);
	const height = Math.max(
		1,
		Math.floor(size.heightCssPx * size.devicePixelRatio)
	);
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
	}
	gl.viewport(0, 0, width, height);
}
