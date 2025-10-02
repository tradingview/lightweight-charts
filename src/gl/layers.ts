import { resizeGLViewport } from './context';
import { createClipFromMediaMatrix } from './matrices';
import { IWebGLPaneContext, ViewportSize } from './types';

export interface WebGLRenderableSeries {
	onInit(context: IWebGLPaneContext): void;
	onRender(context: IWebGLPaneContext): void;
	onUpdate?(context: IWebGLPaneContext): void;
	onDestroy?(): void;
	/** Relative draw order; higher draws later within GL layer */
	order?: number;
	/** Optional CPU-side hit test in CSS pixel space */
	hitTest?(context: IWebGLPaneContext, xCss: number, yCss: number): { externalId?: string; zOrder?: 'top' | 'normal' | 'bottom'; cursorStyle?: string } | null;
}

export class WebGLLayerManager {
	private _gl: WebGL2RenderingContext | null = null;
	private _canvas: HTMLCanvasElement | null = null;
	private _viewport: ViewportSize | null = null;
	private _renderables: Set<WebGLRenderableSeries> = new Set();
	private _contextFactory: (() => IWebGLPaneContext) | null = null;

	public setContext(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, viewport: ViewportSize, ctxFactory: () => IWebGLPaneContext): void {
		this._gl = gl;
		this._canvas = canvas;
		this._viewport = viewport;
		this._contextFactory = ctxFactory;
	}

	public setViewport(viewport: ViewportSize): void {
		if (!this._gl || !this._canvas) { return; }
		this._viewport = viewport;
		resizeGLViewport(this._gl, this._canvas, viewport);
	}

	public register(series: WebGLRenderableSeries): void {
		this._renderables.add(series);
		if (this._contextFactory) {
			series.onInit(this._contextFactory());
		}
	}

	public unregister(series: WebGLRenderableSeries): void {
		if (this._renderables.delete(series)) {
			series.onDestroy?.();
		}
	}

	public clearAll(): void {
		for (const s of this._renderables) { s.onDestroy?.(); }
		this._renderables.clear();
	}

	public render(): void {
		if (!this._gl || !this._canvas || !this._contextFactory || !this._viewport) { return; }
		resizeGLViewport(this._gl, this._canvas, this._viewport);
		// Ensure scissor is disabled before global clear; series set their own if needed
		this._gl.disable(this._gl.SCISSOR_TEST);
		const clipFromMedia = createClipFromMediaMatrix(this._viewport);
		// Clear with transparent so overlays stack correctly
		this._gl.clearColor(0, 0, 0, 0);
		this._gl.clear(this._gl.COLOR_BUFFER_BIT);

		const baseCtx = this._contextFactory();
		// Augment only the matrix for this frame
		const ctx: IWebGLPaneContext = {
			...baseCtx,
			clipFromMedia,
		};
		// Stable order by 'order' value
		const ordered = Array.from(this._renderables).sort((aSeries: WebGLRenderableSeries, bSeries: WebGLRenderableSeries) => (aSeries.order ?? 0) - (bSeries.order ?? 0));
		for (const s of ordered) { s.onRender(ctx); }
	}

	public hitTestAt(xCss: number, yCss: number): { externalId?: string; zOrder?: 'top' | 'normal' | 'bottom'; cursorStyle?: string } | null {
		if (!this._contextFactory) { return null; }
		const ctx = this._contextFactory();
		let best: { externalId?: string; zOrder?: 'top' | 'normal' | 'bottom'; cursorStyle?: string } | null = null;
		const priority = (z?: 'top' | 'normal' | 'bottom'): number => z === 'top' ? 3 : z === 'normal' ? 2 : 1;
		for (const s of Array.from(this._renderables)) {
			const r = s.hitTest?.(ctx, xCss, yCss) ?? null;
			if (!r) { continue; }
			if (!best || priority(r.zOrder) > priority(best.zOrder)) { best = r; }
		}
		return best;
	}
}

