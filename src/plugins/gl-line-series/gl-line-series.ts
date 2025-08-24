import { CustomWebGLSeriesOptions, ICustomWebGLSeriesPaneView } from '../../gl/public';
import { IWebGLPaneContext } from '../../gl/types';
import { linkProgram, parseCssColorToFloat4 } from '../../gl/utils';

export interface GLLinePoint {
	logicalIndex: number; // TimePointIndex number
	price: number;
}

export interface GLLineSeriesOptions extends CustomWebGLSeriesOptions {
	color?: string;
	points?: GLLinePoint[];
	lineWidthPx?: number;
	hittest?: boolean;
}

export class GLLineSeries implements ICustomWebGLSeriesPaneView<GLLineSeriesOptions> {
	private _gl: WebGL2RenderingContext | null = null;
	private _program: WebGLProgram | null = null;
	private _vao: WebGLVertexArrayObject | null = null;
	private _vboUnitQuad: WebGLBuffer | null = null; // (0,0)-(1,1)
	private _vboVerts: WebGLBuffer | null = null; // [index, price] per-vertex for polyline
	private _uTransformLoc: WebGLUniformLocation | null = null;
	private _uColorLoc: WebGLUniformLocation | null = null;
	private _uPxFromClipLoc: WebGLUniformLocation | null = null;
	private _uHalfWidthPxLoc: WebGLUniformLocation | null = null;
	private _vertexCount: number = 0;
	private _color: [number, number, number, number] = [0, 0.6, 1.0, 1.0];
	private _points: GLLinePoint[] = [];
	private _lineWidthPx: number = 1;

	private _needsUpload: boolean = true;

	public constructor(initial?: GLLineSeriesOptions) {
		if (initial?.color) { this._color = parseCssColorToFloat4(initial.color); }
		if (initial?.points) {
			this._points = initial.points.slice();
		}
	}

	public onInit(context: IWebGLPaneContext, options: Readonly<GLLineSeriesOptions>): void {
		const gl = context.gl;
		this._gl = gl;

		if (options.color) { this._color = parseCssColorToFloat4(options.color); }
		if (options.points) {
			this._points = options.points.slice();
			this._needsUpload = true;
		}
		if (options.lineWidthPx != null) {
			this._lineWidthPx = options.lineWidthPx;
		}

		this._program = linkProgram(
			gl,
			`#version 300 es
			precision highp float;
			// Instanced thick line via per-segment quad in data space
			layout(location=0) in vec2 a_unit; // (0..1, 0..1)
			layout(location=1) in vec2 a_p0;   // index, price
			layout(location=2) in vec2 a_p1;   // index, price
			uniform mat4 u_transform; // clipFromTimePrice
			uniform vec2 u_pxFromClip; // clip units per pixel (dx, dy)
			uniform float u_halfWidthPx; // half of desired line width in pixels
			// uniform vec2 u_visibleRange; // left,right (disabled discard)
			void main(){
				// Compute positions in clip space
				vec4 c0 = u_transform * vec4(a_p0, 0.0, 1.0);
				vec4 c1 = u_transform * vec4(a_p1, 0.0, 1.0);
				vec2 p0 = c0.xy / c0.w;
				vec2 p1 = c1.xy / c1.w;
				// Build normalized direction and perpendicular in clip space, convert 1px offset
				vec2 dir = normalize(p1 - p0 + vec2(1e-6));
				vec2 n = vec2(-dir.y, dir.x);
				vec2 px = u_pxFromClip; // clip units per pixel
				float offPx = (a_unit.y - 0.5) * 2.0 * u_halfWidthPx;
				vec2 pos = mix(p0, p1, a_unit.x) + n * offPx * px;
				gl_Position = vec4(pos, 0.0, 1.0);
			}
		`,
			`#version 300 es
			precision highp float;
			uniform vec4 u_color;
			out vec4 fragColor;
			void main(){ fragColor = u_color; }
		`,
			'GLLineSeries'
		);

		if (!this._program) { return; }
		this._uTransformLoc = gl.getUniformLocation(this._program, 'u_transform');
		this._uColorLoc = gl.getUniformLocation(this._program, 'u_color');
		this._uPxFromClipLoc = gl.getUniformLocation(this._program, 'u_pxFromClip');
		this._uHalfWidthPxLoc = gl.getUniformLocation(this._program, 'u_halfWidthPx');

		this._vao = gl.createVertexArray();
		this._vboUnitQuad = gl.createBuffer();
		this._vboVerts = gl.createBuffer();
		if (!this._vao || !this._vboVerts || !this._vboUnitQuad) { return; }
		gl.bindVertexArray(this._vao);
		// unit quad (0,0)-(1,1)
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboUnitQuad);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
		// Ensure no accidental instancing on location 0
		gl.vertexAttribDivisor(0, 0);
		// segment endpoints stream
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboVerts);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 0);
		gl.vertexAttribDivisor(1, 1);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 16, 8);
		gl.vertexAttribDivisor(2, 1);
		gl.bindVertexArray(null);
	}

	public onRender(context: IWebGLPaneContext): void {
		if (!this._program || !this._vao || !this._vboVerts) {
			return;
		}
		const gl = context.gl;
		this._uploadIfNeeded(gl);

		gl.useProgram(this._program);
		if (this._uTransformLoc) { gl.uniformMatrix4fv(this._uTransformLoc, false, context.clipFromTimePrice); }
		if (this._uPxFromClipLoc) {
			// Convert 1px in media space to clip units. clipFromMedia scales by (2/W, -2/H)
			const W = Math.max(1, Math.floor(context.viewport.widthCssPx * context.viewport.devicePixelRatio));
			const H = Math.max(1, Math.floor(context.viewport.heightCssPx * context.viewport.devicePixelRatio));
			gl.uniform2f(this._uPxFromClipLoc, 2.0 / W, 2.0 / H);
		}
		if (this._uHalfWidthPxLoc) {
			gl.uniform1f(this._uHalfWidthPxLoc, Math.max(0.5, (this._lineWidthPx || 1) * 0.5 * (context.viewport.devicePixelRatio || 1)));
		}
		if (this._uColorLoc) {
			gl.uniform4f(
				this._uColorLoc,
				this._color[0],
				this._color[1],
				this._color[2],
				this._color[3]
			);
		}
		// visible range discard disabled

		// Optional scissor to reduce rasterization outside clipRect
		const r = context.clipRect;
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(
			r.xMin,
			r.yMin,
			Math.max(0, r.xMax - r.xMin),
			Math.max(0, r.yMax - r.yMin)
		);
		gl.bindVertexArray(this._vao);
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.max(0, this._vertexCount - 1));
		gl.bindVertexArray(null);
		gl.disable(gl.SCISSOR_TEST);
		// simplified: no picking, no join pass
	}

	private _uploadIfNeeded(gl: WebGL2RenderingContext): void {
		if (!this._needsUpload || !this._vboVerts) { return; }
		const segs: number[] = [];
		for (let i = 0; i < this._points.length - 1; i++) {
			const p0 = this._points[i];
			const p1 = this._points[i + 1];
			segs.push(p0.logicalIndex, p0.price, p1.logicalIndex, p1.price);
		}
		const arr = new Float32Array(segs);
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vboVerts);
		gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		this._vertexCount = this._points.length;
		this._needsUpload = false;
	}

	public onUpdate(context: IWebGLPaneContext, options: Readonly<Partial<GLLineSeriesOptions>>): void {
		if (options.color) { this._color = parseCssColorToFloat4(options.color); }

		if (options.points) {
			this._points = options.points.slice();
			this._needsUpload = true;
		}

		if (options.lineWidthPx != null) {
			this._lineWidthPx = options.lineWidthPx;
			this._needsUpload = true;
		}
		// no hittest support in simplified renderer
	}

	public onDestroy(): void {
		const gl = this._glFromAny();

		if (gl) {
			if (this._vboVerts) {
				gl.deleteBuffer(this._vboVerts);
			}
			if (this._vao) {
				gl.deleteVertexArray(this._vao);
			}

			if (this._program) {
				gl.deleteProgram(this._program);
			}
		}

		this._program = null;
		this._vao = null;
		this._vboVerts = null;
	}

	private _glFromAny(): WebGL2RenderingContext | null {
		return this._gl;
	}
}
