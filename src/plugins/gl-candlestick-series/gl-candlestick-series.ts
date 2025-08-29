import {
	CustomWebGLSeriesOptions,
	ICustomWebGLSeriesPaneView,
} from '../../gl/public';
import { IWebGLPaneContext } from '../../gl/types';
import { linkProgram, parseCssColorToFloat4 } from '../../gl/utils';

export interface GLCandleBar {
	logicalIndex: number;
	open: number;
	high: number;
	low: number;
	close: number;
}

export interface GLCandlestickSeriesOptions extends CustomWebGLSeriesOptions {
	bars?: GLCandleBar[];
	barWidth?: number; // logical width in index units
	upColor?: string;
	downColor?: string;
	wickColor?: string;
}

export class GLCandlestickSeries
	implements ICustomWebGLSeriesPaneView<GLCandlestickSeriesOptions> {
	private _gl: WebGL2RenderingContext | null = null;
	private _program: WebGLProgram | null = null;
	private _vao: WebGLVertexArrayObject | null = null;
	private _vboUnitQuad: WebGLBuffer | null = null; // shared (0,0)-(1,1)
	private _vboBars: WebGLBuffer | null = null; // [index, open, high, low, close]*

	// uniforms (single program)
	private _uTransform: WebGLUniformLocation | null = null;
	private _uPxFromClip: WebGLUniformLocation | null = null;
	private _uPxPerLogical: WebGLUniformLocation | null = null;
	private _uUpColor: WebGLUniformLocation | null = null;
	private _uDownColor: WebGLUniformLocation | null = null;
	private _uWickColor: WebGLUniformLocation | null = null;
	private _uVisibleRange: WebGLUniformLocation | null = null; // vec2(left,right)
	private _uBarWidth: WebGLUniformLocation | null = null;
	private _uDrawKind: WebGLUniformLocation | null = null; // 0=body,1=wick

	private _bars: GLCandleBar[] = [];
	private _barWidth: number = 0.8;
	private _upColor: [number, number, number, number] = [0.2, 0.8, 0.4, 1.0];
	private _downColor: [number, number, number, number] = [0.9, 0.35, 0.3, 1.0];
	private _wickColor: [number, number, number, number] = [0.2, 0.2, 0.2, 1.0];
	private _needsUpload: boolean = true;
	private _instanceCount: number = 0;

	public constructor(initial?: GLCandlestickSeriesOptions) {
		if (initial?.bars) {
			this._bars = initial.bars.slice();
		}
		if (initial?.barWidth != null) {
			this._barWidth = initial.barWidth;
		}
		if (initial?.upColor) { this._upColor = parseCssColorToFloat4(initial.upColor); }
		if (initial?.downColor) { this._downColor = parseCssColorToFloat4(initial.downColor); }
		if (initial?.wickColor) { this._wickColor = parseCssColorToFloat4(initial.wickColor); }
	}

	// eslint-disable-next-line complexity
	public onInit(
		context: IWebGLPaneContext,
		options: Readonly<GLCandlestickSeriesOptions>
	): void {
		const gl = context.gl;
		this._gl = gl;
		if (options.bars) {
			this._bars = options.bars.slice();
			this._needsUpload = true;
		}
		if (options.barWidth != null) {
			this._barWidth = options.barWidth;
		}
		if (options.upColor) { this._upColor = parseCssColorToFloat4(options.upColor); }
		if (options.downColor) { this._downColor = parseCssColorToFloat4(options.downColor); }
		if (options.wickColor) { this._wickColor = parseCssColorToFloat4(options.wickColor); }

		// Common unit quad VBO
		this._vboUnitQuad = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboUnitQuad);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
			gl.STATIC_DRAW
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		// Single program: raw OHLC + transform; branch by u_drawKind for body vs wick
		this._program = linkProgram(
			gl,
			`#version 300 es
			precision highp float;
			precision highp int;
			layout(location=0) in vec2 a_unit; // (0..1, 0..1)
			layout(location=1) in float a_index; // logical index
			layout(location=2) in vec4 a_ohlc; // open,high,low,close
			uniform mat4 u_transform; // clipFromTimePrice
			uniform float u_barWidth; // logical units
			uniform vec2 u_pxFromClip; // clip units per pixel
			uniform float u_pxPerLogical; // pixels per logical index
			// uniform vec2 u_visibleRange; // left,right (disabled discard)
			uniform int u_drawKind; // 0=body, 1=wick
			out float v_sign;
			void main(){
				v_sign = (a_ohlc.w >= a_ohlc.x) ? 1.0 : 0.0;
				float x;
				float y;
				if (u_drawKind == 0) {
					// Body
					float widthPx = max(2.0, floor(u_barWidth * u_pxPerLogical + 0.0));
					float widthLogical = widthPx / u_pxPerLogical;
					float left = a_index - 0.5 * widthLogical;
					float right = a_index + 0.5 * widthLogical;
					float bodyTop = max(a_ohlc.x, a_ohlc.w);
					float bodyBot = min(a_ohlc.x, a_ohlc.w);
					x = mix(left, right, a_unit.x);
					y = mix(bodyBot, bodyTop, a_unit.y);
					vec4 c = u_transform * vec4(x, y, 0.0, 1.0);
					vec2 p = c.xy / c.w;
					vec2 pos = floor(p / u_pxFromClip + 0.5) * u_pxFromClip;
					gl_Position = vec4(pos, 0.0, 1.0);
				} else {
					// Wick: compute center in clip space, then offset by +/- 0.5px in clip
					float yVal = mix(a_ohlc.z, a_ohlc.y, a_unit.y);
					vec4 c = u_transform * vec4(a_index, yVal, 0.0, 1.0);
					vec2 center = c.xy / c.w;
					float xOff = (a_unit.x - 0.5) * u_pxFromClip.x; // +/- 0.5px in clip units
					float ySnapped = floor(center.y / u_pxFromClip.y + 0.5) * u_pxFromClip.y;
					gl_Position = vec4(center.x + xOff, ySnapped, 0.0, 1.0);
				}
			}
		`,
			`#version 300 es
			precision highp float;
			precision highp int;
			in float v_sign;
			uniform vec4 u_upColor;
			uniform vec4 u_downColor;
			uniform vec4 u_wickColor;
			uniform int u_drawKind; // 0=body, 1=wick
			out vec4 fragColor;
			void main(){ fragColor = (u_drawKind == 1) ? u_wickColor : ((v_sign > 0.5) ? u_upColor : u_downColor); }
		`,
			'GLCandles'
		);
		if (!this._program) { return; }

		// Lookup uniforms (single program)
		this._uTransform = gl.getUniformLocation(this._program, 'u_transform');
		this._uPxFromClip = gl.getUniformLocation(this._program, 'u_pxFromClip');
		this._uPxPerLogical = gl.getUniformLocation(this._program, 'u_pxPerLogical');
		this._uUpColor = gl.getUniformLocation(this._program, 'u_upColor');
		this._uDownColor = gl.getUniformLocation(this._program, 'u_downColor');
		this._uWickColor = gl.getUniformLocation(this._program, 'u_wickColor');
		this._uVisibleRange = null; // disabled
		this._uBarWidth = gl.getUniformLocation(this._program, 'u_barWidth');
		this._uDrawKind = gl.getUniformLocation(this._program, 'u_drawKind');

		// VAO
		this._vao = gl.createVertexArray();
		this._vboBars = gl.createBuffer();
		if (!this._vao || !this._vboBars || !this._vboUnitQuad) { return; }
		gl.bindVertexArray(this._vao);
		// a_unit
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboUnitQuad);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
		// Be explicit: a_unit advances per-vertex
		gl.vertexAttribDivisor(0, 0);
		// a_index, a_ohlc
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboBars);
		const strideBars = 5 * 4;
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 1, gl.FLOAT, false, strideBars, 0);
		gl.vertexAttribDivisor(1, 1);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 4, gl.FLOAT, false, strideBars, 4);
		gl.vertexAttribDivisor(2, 1);
		gl.bindVertexArray(null);
	}

	public onRender(context: IWebGLPaneContext): void {
		if (!this._program || !this._vao || !this._vboBars) { return; }
		this._uploadIfNeeded(context);
		const gl = context.gl;
		const r = context.clipRect;
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(r.xMin, r.yMin, Math.max(0, r.xMax - r.xMin), Math.max(0, r.yMax - r.yMin));
		gl.useProgram(this._program);
		// Common uniforms
		if (this._uTransform) { gl.uniformMatrix4fv(this._uTransform, false, context.clipFromTimePrice); }
		if (this._uPxFromClip) {
			const W = Math.max(1, Math.floor(context.viewport.widthCssPx * context.viewport.devicePixelRatio));
			const H = Math.max(1, Math.floor(context.viewport.heightCssPx * context.viewport.devicePixelRatio));
			gl.uniform2f(this._uPxFromClip, 2 / W, 2 / H);
		}
		if (this._uPxPerLogical) { gl.uniform1f(this._uPxPerLogical, context.scaleInfo.barSpacing * (context.viewport.devicePixelRatio || 1)); }
		if (this._uVisibleRange) { gl.uniform2f(this._uVisibleRange, context.scaleInfo.visibleLeft, context.scaleInfo.visibleRight); }
		if (this._uUpColor) { gl.uniform4f(this._uUpColor, this._upColor[0], this._upColor[1], this._upColor[2], this._upColor[3]); }
		if (this._uDownColor) { gl.uniform4f(this._uDownColor, this._downColor[0], this._downColor[1], this._downColor[2], this._downColor[3]); }
		if (this._uWickColor) { gl.uniform4f(this._uWickColor, this._wickColor[0], this._wickColor[1], this._wickColor[2], this._wickColor[3]); }
		gl.bindVertexArray(this._vao);
		// Draw wicks
		if (this._uDrawKind) { gl.uniform1i(this._uDrawKind, 1); }
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this._instanceCount);
		// Draw bodies
		if (this._uDrawKind) { gl.uniform1i(this._uDrawKind, 0); }
		if (this._uBarWidth) { gl.uniform1f(this._uBarWidth, this._barWidth); }
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this._instanceCount);
		gl.bindVertexArray(null);
		gl.disable(gl.SCISSOR_TEST);
	}

	public onUpdate(
		context: IWebGLPaneContext,
		options: Readonly<Partial<GLCandlestickSeriesOptions>>
	): void {
		if (options.bars) {
			this._bars = options.bars.slice();
			this._needsUpload = true;
		}
		if (options.barWidth != null) {
			this._barWidth = options.barWidth;
			this._needsUpload = true;
		}
		if (options.upColor) { this._upColor = parseCssColorToFloat4(options.upColor); }
		if (options.downColor) { this._downColor = parseCssColorToFloat4(options.downColor); }
		if (options.wickColor) { this._wickColor = parseCssColorToFloat4(options.wickColor); }
		// no hittest in simplified version
	}

	public onDestroy(): void {
		const gl = this._glFromAny();
		if (!gl) { return; }
		if (this._vboBars) { gl.deleteBuffer(this._vboBars); }
		if (this._vboUnitQuad) { gl.deleteBuffer(this._vboUnitQuad); }
		if (this._vao) { gl.deleteVertexArray(this._vao); }
		if (this._program) { gl.deleteProgram(this._program); }
		this._program = null;
		this._vao = null;
		this._vboBars = null;
		this._vboUnitQuad = null;
	}

// Draw helpers removed; single onRender handles both kinds

	// Upload raw bar data only when it changes
	private _uploadIfNeeded(context: IWebGLPaneContext): void {
		if (!this._needsUpload || !this._vboBars) { return; }
		const data: number[] = [];
		for (let i = 0; i < this._bars.length; i++) {
			const b = this._bars[i];
			data.push(b.logicalIndex, b.open, b.high, b.low, b.close);
		}
		const arr = new Float32Array(data);
		const gl = context.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboBars);
		gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		this._instanceCount = this._bars.length;
		this._needsUpload = false;
	}

	private _glFromAny(): WebGL2RenderingContext | null {
		return this._gl;
	}
}
