// WebGL Context Manager - handles WebGL2 context and shader compilation

export interface WebGLProgram2 extends WebGLProgram {
	__attributes?: Map<string, number>;
	__uniforms?: Map<string, WebGLUniformLocation>;
}

export class WebGLContextManager {
	private _gl: WebGL2RenderingContext | null = null;
	private _canvas: HTMLCanvasElement | null = null;
	private _programs: Map<string, WebGLProgram2> = new Map();
	private _buffers: Map<string, WebGLBuffer> = new Map();
	private _vaos: Map<string, WebGLVertexArrayObject> = new Map();

	public get gl(): WebGL2RenderingContext | null {
		return this._gl;
	}

	public get canvas(): HTMLCanvasElement | null {
		return this._canvas;
	}

	public initialize(canvas: HTMLCanvasElement): boolean {
		if (this._gl !== null) {
			return true;
		}

		this._canvas = canvas;
		const gl = canvas.getContext('webgl2', {
			alpha: true,
			antialias: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: true,
			preserveDrawingBuffer: false,
			powerPreference: 'high-performance',
		});

		if (gl === null) {
			console.warn('WebGL2 not supported, falling back to Canvas2D');
			return false;
		}

		this._gl = gl;

		// Enable blending for transparency
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		return true;
	}

	public dispose(): void {
		if (this._gl === null) {
			return;
		}

		// Delete all programs
		this._programs.forEach((program) => {
			this._gl!.deleteProgram(program);
		});
		this._programs.clear();

		// Delete all buffers
		this._buffers.forEach((buffer) => {
			this._gl!.deleteBuffer(buffer);
		});
		this._buffers.clear();

		// Delete all VAOs
		this._vaos.forEach((vao) => {
			this._gl!.deleteVertexArray(vao);
		});
		this._vaos.clear();

		this._gl = null;
		this._canvas = null;
	}

	public createProgram(name: string, vertexSource: string, fragmentSource: string): WebGLProgram2 | null {
		if (this._gl === null) {
			return null;
		}

		const existing = this._programs.get(name);
		if (existing) {
			return existing;
		}

		const gl = this._gl;

		const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexSource);
		if (vertexShader === null) {
			return null;
		}

		const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentSource);
		if (fragmentShader === null) {
			gl.deleteShader(vertexShader);
			return null;
		}

		const program = gl.createProgram() as WebGLProgram2;
		if (program === null) {
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			return null;
		}

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		// Check link status
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Program link error:', gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			return null;
		}

		// Clean up shaders (they're now part of the program)
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		// Cache attribute and uniform locations
		program.__attributes = new Map();
		program.__uniforms = new Map();

		const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < numAttributes; i++) {
			const info = gl.getActiveAttrib(program, i);
			if (info) {
				program.__attributes.set(info.name, gl.getAttribLocation(program, info.name));
			}
		}

		const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numUniforms; i++) {
			const info = gl.getActiveUniform(program, i);
			if (info) {
				const location = gl.getUniformLocation(program, info.name);
				if (location !== null) {
					program.__uniforms.set(info.name, location);
				}
			}
		}

		this._programs.set(name, program);
		return program;
	}

	public getProgram(name: string): WebGLProgram2 | null {
		return this._programs.get(name) ?? null;
	}

	public createBuffer(name: string): WebGLBuffer | null {
		if (this._gl === null) {
			return null;
		}

		const existing = this._buffers.get(name);
		if (existing) {
			return existing;
		}

		const buffer = this._gl.createBuffer();
		if (buffer === null) {
			return null;
		}

		this._buffers.set(name, buffer);
		return buffer;
	}

	public getBuffer(name: string): WebGLBuffer | null {
		return this._buffers.get(name) ?? null;
	}

	public createVAO(name: string): WebGLVertexArrayObject | null {
		if (this._gl === null) {
			return null;
		}

		const existing = this._vaos.get(name);
		if (existing) {
			return existing;
		}

		const vao = this._gl.createVertexArray();
		if (vao === null) {
			return null;
		}

		this._vaos.set(name, vao);
		return vao;
	}

	public getVAO(name: string): WebGLVertexArrayObject | null {
		return this._vaos.get(name) ?? null;
	}

	public resize(width: number, height: number): void {
		if (this._gl === null || this._canvas === null) {
			return;
		}

		if (this._canvas.width !== width || this._canvas.height !== height) {
			this._canvas.width = width;
			this._canvas.height = height;
			this._gl.viewport(0, 0, width, height);
		}
	}

	public clear(): void {
		if (this._gl === null) {
			return;
		}

		this._gl.clearColor(0, 0, 0, 0);
		this._gl.clear(this._gl.COLOR_BUFFER_BIT);
	}

	private _compileShader(type: number, source: string): WebGLShader | null {
		if (this._gl === null) {
			return null;
		}

		const gl = this._gl;
		const shader = gl.createShader(type);
		if (shader === null) {
			return null;
		}

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Shader compile error:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}
}

// Global singleton for WebGL context management
let globalContextManager: WebGLContextManager | null = null;

export function getWebGLContextManager(): WebGLContextManager {
	if (globalContextManager === null) {
		globalContextManager = new WebGLContextManager();
	}
	return globalContextManager;
}
