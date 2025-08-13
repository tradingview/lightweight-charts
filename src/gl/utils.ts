export function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
	logLabel: string = 'Shader'
): WebGLShader | null {
	const sh = gl.createShader(type);
	if (!sh) { return null; }
	gl.shaderSource(sh, source);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		// eslint-disable-next-line no-console
		console.error(`[${logLabel}] compile error:`, gl.getShaderInfoLog(sh) || '');
		gl.deleteShader(sh);
		return null;
	}
	return sh;
}

export function linkProgram(
	gl: WebGL2RenderingContext,
	vsSrc: string,
	fsSrc: string,
	logLabel: string = 'Program'
): WebGLProgram | null {
	const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc, `${logLabel} VS`);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc, `${logLabel} FS`);
	if (!vs || !fs) { return null; }
	const p = gl.createProgram();
	if (!p) { return null; }
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);
	gl.linkProgram(p);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		// eslint-disable-next-line no-console
		console.error(`[${logLabel}] link error:`, gl.getProgramInfoLog(p) || '');
		gl.deleteProgram(p);
		return null;
	}
	return p;
}

export function parseCssColorToFloat4(color: string): [number, number, number, number] {
	const c = color.trim();

	if (c[0] === '#') {
		const hex = c.slice(1);
		if (hex.length === 3 || hex.length === 4) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
			return [r / 255, g / 255, b / 255, a];
		}
		if (hex.length === 6 || hex.length === 8) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
			return [r / 255, g / 255, b / 255, a];
		}
	}

	const m = c.match(/^rgba?\s*\(([^)]+)\)\s*$/i);
	if (m) {
		const parts = m[1].split(',').map((value: string) => value.trim());
		if (parts.length >= 3) {
			const r = Math.max(0, Math.min(255, parseFloat(parts[0])));
			const g = Math.max(0, Math.min(255, parseFloat(parts[1])));
			const b = Math.max(0, Math.min(255, parseFloat(parts[2])));
			const a = parts.length >= 4 ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1;
			return [r / 255, g / 255, b / 255, a];
		}
	}

	try {
		const g: unknown = (globalThis as unknown);
		const maybeObj = (typeof g === 'object' && g !== null) ? (g as Record<string, unknown>) : null;
		const doc = (maybeObj && (maybeObj.document as Document | undefined)) || undefined;
		if (doc) {
			const el = doc.createElement('div');
			el.style.display = 'none';
			doc.body.appendChild(el);
			el.style.color = c;
			const computed = (doc.defaultView ? doc.defaultView.getComputedStyle(el) : window.getComputedStyle(el)).color;
			doc.body.removeChild(el);
			const mm = computed && computed.match(/^rgba?\s*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/i);
			if (mm) {
				const r = parseInt(mm[1], 10);
				const g2 = parseInt(mm[2], 10);
				const b = parseInt(mm[3], 10);
				const a = mm[4] ? parseFloat(mm[4]) : 1;
				return [r / 255, g2 / 255, b / 255, a];
			}
		}
	} catch {
		// ignore
	}

	return [0, 0, 0, 1];
}

