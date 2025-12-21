// High-performance WebGL2 Candlesticks Renderer
// Uses instanced rendering to draw all candlesticks in a single draw call

import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { HoveredObject } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { SeriesItemsIndexesRange } from '../../model/time-data';
import { CandlestickItem } from '../candlesticks-renderer';
import { IPaneRenderer } from '../ipane-renderer';

import { WebGLContextManager } from './webgl-context-manager';
import { rectFragmentShader, rectVertexShader } from './webgl-shaders';

export interface WebGLCandlestickData {
	bars: readonly CandlestickItem[];
	barSpacing: number;
	wickVisible: boolean;
	borderVisible: boolean;
	visibleRange: SeriesItemsIndexesRange | null;
}

// Color parsing helper
function parseColor(color: string): [number, number, number, number] {
	// Handle hex colors
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16) / 255;
			const g = parseInt(hex[1] + hex[1], 16) / 255;
			const b = parseInt(hex[2] + hex[2], 16) / 255;
			return [r, g, b, 1];
		} else if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16) / 255;
			const g = parseInt(hex.slice(2, 4), 16) / 255;
			const b = parseInt(hex.slice(4, 6), 16) / 255;
			return [r, g, b, 1];
		} else if (hex.length === 8) {
			const r = parseInt(hex.slice(0, 2), 16) / 255;
			const g = parseInt(hex.slice(2, 4), 16) / 255;
			const b = parseInt(hex.slice(4, 6), 16) / 255;
			const a = parseInt(hex.slice(6, 8), 16) / 255;
			return [r, g, b, a];
		}
	}

	// Handle rgb/rgba
	const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
	if (rgbaMatch) {
		return [
			parseInt(rgbaMatch[1], 10) / 255,
			parseInt(rgbaMatch[2], 10) / 255,
			parseInt(rgbaMatch[3], 10) / 255,
			rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
		];
	}

	// Default to black
	return [0, 0, 0, 1];
}

// Pre-allocated buffers for batch rendering
const MAX_CANDLESTICKS = 10000;
const FLOATS_PER_RECT = 8; // x, y, width, height, r, g, b, a
const RECTS_PER_CANDLESTICK = 3; // body + 2 wicks (upper and lower)

export class WebGLCandlesticksRenderer implements IPaneRenderer {
	private _data: WebGLCandlestickData | null = null;
	private _contextManager: WebGLContextManager | null = null;
	private _initialized: boolean = false;

	// Pre-allocated typed arrays for performance
	private _rectBuffer: Float32Array = new Float32Array(MAX_CANDLESTICKS * RECTS_PER_CANDLESTICK * FLOATS_PER_RECT);
	private _rectCount: number = 0;

	// Dirty tracking for incremental updates
	private _bufferNeedsUpload: boolean = true;

	public setData(data: WebGLCandlestickData): void {
		this._data = data;
		this._bufferNeedsUpload = true;
	}

	public setContextManager(manager: WebGLContextManager): void {
		this._contextManager = manager;
	}

	public draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		// Try WebGL rendering first
		if (this._contextManager !== null && this._tryWebGLRender()) {
			return;
		}

		// Fall back to Canvas2D if WebGL not available
		this._canvas2DFallback(target);
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		// TODO: Implement hit testing
		return null;
	}

	private _tryWebGLRender(): boolean {
		if (this._contextManager === null || this._data === null) {
			return false;
		}

		const gl = this._contextManager.gl;
		if (gl === null) {
			return false;
		}

		// Initialize program if needed
		if (!this._initialized) {
			const program = this._contextManager.createProgram('rect', rectVertexShader, rectFragmentShader);
			if (program === null) {
				return false;
			}

			this._contextManager.createBuffer('rects');
			this._contextManager.createVAO('candlesticks');
			this._initialized = true;
		}

		const program = this._contextManager.getProgram('rect');
		const buffer = this._contextManager.getBuffer('rects');
		const vao = this._contextManager.getVAO('candlesticks');

		if (program === null || buffer === null || vao === null) {
			return false;
		}

		// Build rect data
		this._buildRectData();

		if (this._rectCount === 0) {
			return true; // Nothing to draw
		}

		// Upload data to GPU
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		if (this._bufferNeedsUpload) {
			gl.bufferData(gl.ARRAY_BUFFER, this._rectBuffer.subarray(0, this._rectCount * FLOATS_PER_RECT), gl.DYNAMIC_DRAW);
			this._bufferNeedsUpload = false;
		}

		// Set up VAO
		gl.bindVertexArray(vao);

		const stride = FLOATS_PER_RECT * 4; // 4 bytes per float

		// a_rect: x, y, width, height
		const rectLoc = program.__attributes?.get('a_rect') ?? 0;
		gl.enableVertexAttribArray(rectLoc);
		gl.vertexAttribPointer(rectLoc, 4, gl.FLOAT, false, stride, 0);
		gl.vertexAttribDivisor(rectLoc, 1);

		// a_color: r, g, b, a
		const colorLoc = program.__attributes?.get('a_color') ?? 1;
		gl.enableVertexAttribArray(colorLoc);
		gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 16);
		gl.vertexAttribDivisor(colorLoc, 1);

		// Use program and set uniforms
		gl.useProgram(program);

		const canvas = this._contextManager.canvas;
		if (canvas) {
			const resolutionLoc = program.__uniforms?.get('u_resolution');
			if (resolutionLoc) {
				gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
			}
		}

		// Draw all rects with instanced rendering
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this._rectCount);

		// Clean up
		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		return true;
	}

	private _buildRectData(): void {
		if (this._data === null || this._data.visibleRange === null) {
			this._rectCount = 0;
			return;
		}

		const { bars, visibleRange, barSpacing, wickVisible } = this._data;
		const barWidth = Math.max(1, Math.floor(barSpacing * 0.8));
		const wickWidth = Math.max(1, Math.floor(barWidth * 0.2));
		const halfBarWidth = barWidth / 2;
		const halfWickWidth = wickWidth / 2;

		let rectIndex = 0;
		const buffer = this._rectBuffer;

		for (let i = visibleRange.from; i < visibleRange.to && rectIndex < MAX_CANDLESTICKS * RECTS_PER_CANDLESTICK; i++) {
			const bar = bars[i];
			const x = bar.x;
			const openY = bar.openY;
			const closeY = bar.closeY;
			const highY = bar.highY;
			const lowY = bar.lowY;

			const bodyTop = Math.min(openY, closeY);
			const bodyBottom = Math.max(openY, closeY);
			const bodyHeight = Math.max(1, bodyBottom - bodyTop);

			// Parse body color
			const bodyColor = parseColor(bar.barColor);

			// Body rect
			const bodyOffset = rectIndex * FLOATS_PER_RECT;
			buffer[bodyOffset + 0] = x - halfBarWidth;     // x
			buffer[bodyOffset + 1] = bodyTop;              // y
			buffer[bodyOffset + 2] = barWidth;             // width
			buffer[bodyOffset + 3] = bodyHeight;           // height
			buffer[bodyOffset + 4] = bodyColor[0];         // r
			buffer[bodyOffset + 5] = bodyColor[1];         // g
			buffer[bodyOffset + 6] = bodyColor[2];         // b
			buffer[bodyOffset + 7] = bodyColor[3];         // a
			rectIndex++;

			// Wicks
			if (wickVisible) {
				const wickColor = parseColor(bar.barWickColor);

				// Upper wick (from high to body top)
				const upperWickHeight = bodyTop - highY;
				if (upperWickHeight > 0) {
					const upperOffset = rectIndex * FLOATS_PER_RECT;
					buffer[upperOffset + 0] = x - halfWickWidth;
					buffer[upperOffset + 1] = highY;
					buffer[upperOffset + 2] = wickWidth;
					buffer[upperOffset + 3] = upperWickHeight;
					buffer[upperOffset + 4] = wickColor[0];
					buffer[upperOffset + 5] = wickColor[1];
					buffer[upperOffset + 6] = wickColor[2];
					buffer[upperOffset + 7] = wickColor[3];
					rectIndex++;
				}

				// Lower wick (from body bottom to low)
				const lowerWickHeight = lowY - bodyBottom;
				if (lowerWickHeight > 0) {
					const lowerOffset = rectIndex * FLOATS_PER_RECT;
					buffer[lowerOffset + 0] = x - halfWickWidth;
					buffer[lowerOffset + 1] = bodyBottom;
					buffer[lowerOffset + 2] = wickWidth;
					buffer[lowerOffset + 3] = lowerWickHeight;
					buffer[lowerOffset + 4] = wickColor[0];
					buffer[lowerOffset + 5] = wickColor[1];
					buffer[lowerOffset + 6] = wickColor[2];
					buffer[lowerOffset + 7] = wickColor[3];
					rectIndex++;
				}
			}
		}

		this._rectCount = rectIndex;
	}

	private _canvas2DFallback(target: CanvasRenderingTarget2D): void {
		// Minimal Canvas2D fallback for when WebGL is not available
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}

		target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
			const { bars, visibleRange, barSpacing, wickVisible } = this._data!;
			const barWidth = Math.max(1, Math.floor(barSpacing * horizontalPixelRatio * 0.8));
			const wickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
			const halfBarWidth = Math.floor(barWidth / 2);
			const halfWickWidth = Math.floor(wickWidth / 2);

			let prevBodyColor = '';
			let prevWickColor = '';

			for (let i = visibleRange!.from; i < visibleRange!.to; i++) {
				const bar = bars[i];
				const x = Math.round(bar.x * horizontalPixelRatio);
				const openY = Math.round(bar.openY * verticalPixelRatio);
				const closeY = Math.round(bar.closeY * verticalPixelRatio);
				const highY = Math.round(bar.highY * verticalPixelRatio);
				const lowY = Math.round(bar.lowY * verticalPixelRatio);

				const bodyTop = Math.min(openY, closeY);
				const bodyBottom = Math.max(openY, closeY);

				// Draw wicks first
				if (wickVisible) {
					if (bar.barWickColor !== prevWickColor) {
						ctx.fillStyle = bar.barWickColor;
						prevWickColor = bar.barWickColor;
					}

					// Upper wick
					if (highY < bodyTop) {
						ctx.fillRect(x - halfWickWidth, highY, wickWidth, bodyTop - highY);
					}

					// Lower wick
					if (lowY > bodyBottom) {
						ctx.fillRect(x - halfWickWidth, bodyBottom, wickWidth, lowY - bodyBottom);
					}
				}

				// Draw body
				if (bar.barColor !== prevBodyColor) {
					ctx.fillStyle = bar.barColor;
					prevBodyColor = bar.barColor;
				}

				const bodyHeight = Math.max(1, bodyBottom - bodyTop);
				ctx.fillRect(x - halfBarWidth, bodyTop, barWidth, bodyHeight);
			}
		});
	}
}
