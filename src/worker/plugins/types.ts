/* eslint-disable @typescript-eslint/no-explicit-any */

export type WorkerPluginInstanceId = string;

export interface WorkerRenderSizes {
	paneWidth: number;
	paneHeight: number;
	timeAxisHeight: number;
	rightAxisWidth: number;
	devicePixelRatio: number;
}

export interface WorkerRenderContexts {
	pane: OffscreenCanvasRenderingContext2D | null;
	overlay: OffscreenCanvasRenderingContext2D | null;
	time: OffscreenCanvasRenderingContext2D | null;
	right: OffscreenCanvasRenderingContext2D | null;
}

export interface WorkerPluginContext {
    /** Lightweight Charts internal model for read-only usage. */
	model: any;
    /** Current logical/bitmap sizes and DPR. */
	sizes: WorkerRenderSizes;
    /** Raw 2D contexts for the four drawing layers. */
	contexts: WorkerRenderContexts;
    /** Request a repaint on next animation frame. */
	requestRender: (overlayOnly?: boolean) => void;
}

export interface WorkerPlugin<TOptions = unknown> {
    /** Called once after the plugin instance is created and registered. */
	onInit?: (ctx: WorkerPluginContext, options: TOptions) => void;
    /** Called on every full pane render, after library base drawing is done. */
	onRenderPane?: (ctx: WorkerPluginContext) => void;
    /** Called on every overlay render (e.g., crosshair/top views). */
	onRenderOverlay?: (ctx: WorkerPluginContext) => void;
    /** Called when the time axis is repainted. */
	onRenderTimeAxis?: (ctx: WorkerPluginContext) => void;
    /** Called when the right price axis is repainted. */
	onRenderRightAxis?: (ctx: WorkerPluginContext) => void;
    /** Called when container size or DPR change. */
	onResize?: (ctx: WorkerPluginContext) => void;
    /** Apply partial options. */
	applyOptions?: (options: Partial<TOptions>) => void;
    /** Cleanup. */
	onDestroy?: () => void;
}

export type WorkerPluginFactory<TOptions = unknown> = (initialOptions?: TOptions) => WorkerPlugin<TOptions>;

