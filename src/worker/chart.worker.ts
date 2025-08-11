export {};
/* tslint:disable: no-any no-unsafe-any no-unsafe-member-access no-unsafe-call typedef align ter-indent ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-console */
// Worker engine that owns OffscreenCanvas, ChartModel, and communicates UI data back to main.
// helpers/model imports are expected before current directory
import { Coordinate } from '../model/coordinate';
import { KineticAnimation } from '../model/kinetic-animation';
import { LogicalRange } from '../model/time-data';

import { OffscreenCanvasTarget2D } from './canvas-target';
import { WorkerEngine } from './engine';
import { CanvasRenderingTarget2D as FancyTarget } from './fancy-canvas-shim';
import { WorkerPluginHost } from './plugins/host';
import type { WorkerRenderContexts, WorkerRenderSizes } from './plugins/types';
import { deserializeSABToSeriesItems } from './serialization-worker';
import { PriceAxisWidgetWorker } from './widgets/price-axis-widget-worker';
import { TimeAxisWidgetWorker } from './widgets/time-axis-widget-worker';

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvas: OffscreenCanvas | null = null;
let timeCtx: OffscreenCanvasRenderingContext2D | null = null;
let timeCanvas: OffscreenCanvas | null = null;
let overlayCtx: OffscreenCanvasRenderingContext2D | null = null;
let overlayCanvas: OffscreenCanvas | null = null;
let rightCtx: OffscreenCanvasRenderingContext2D | null = null;
let rightCanvas: OffscreenCanvas | null = null;
let dpr = 1;
let paneLogicalWidth = 0;
let paneLogicalHeight = 0;
let timeAxisLogicalHeight = 0;
let rightAxisLogicalWidth = 0;
let engine: WorkerEngine | null = null;
let renderCount = 0;
let baseTarget: OffscreenCanvasTarget2D | null = null;
let overlayTargetGlobal: OffscreenCanvasTarget2D | null = null;
let timeWidget: TimeAxisWidgetWorker | null = null;
let rightPriceWidget: PriceAxisWidgetWorker | null = null;
let pinchPrevScale = 1;
let lastPointerDownTime = 0;
let lastPointerDownX = 0;
let lastPointerDownY = 0;
let isDragging = false;
let kineticStepRafId: number | null = null;
let kinetic: KineticAnimation | null = null;
const recentRightOffsetSamples: { t: number; pos: number }[] = [];
// Pending state for coalescing/model-update batching
let pendingZoomDeltaSum = 0;
let pendingZoomAnchorX: number | null = null;
let pendingScrollChartDeltaSum = 0;
let pendingHoverX: number | null = null;
let pendingHoverY: number | null = null;
let lastAppliedHoverX = NaN;
let lastAppliedHoverY = NaN;
const hoverPixelThreshold = 1;
// Coalesced render scheduler
let renderRafId = 0;
let pendingFullRender = false;
let pendingOverlayRender = false;
function scheduleRender(overlayOnly: boolean): void {
    if (overlayOnly) {
        if (!pendingFullRender) { pendingOverlayRender = true; }
    } else {
        pendingFullRender = true;
        pendingOverlayRender = false;
    }
    if (!renderRafId) {
        renderRafId = requestAnimationFrame(() => {
            renderRafId = 0;
            if (pendingFullRender) {
                pendingFullRender = false;
                flushPendingModelUpdates(false);
                render();
                postCrosshairEvent();
                return;
            }
            if (pendingOverlayRender) {
                pendingOverlayRender = false;
                flushPendingModelUpdates(true);
                renderOverlayOnly();
                postCrosshairEvent();
            }
        });
    }
}

function flushPendingModelUpdates(overlayOnly: boolean): void {
    if (!engine) { return; }
    const model = engine.model;
    if (!overlayOnly) {
        if (pendingZoomAnchorX != null && pendingZoomDeltaSum !== 0) {
            const dz = Math.max(-1, Math.min(1, pendingZoomDeltaSum));
            const zoomScale = Math.sign(dz) * Math.min(1, Math.abs(dz));
            model.zoomTime(pendingZoomAnchorX as Coordinate, zoomScale);
        }
        if (pendingScrollChartDeltaSum !== 0) {
            model.scrollChart((pendingScrollChartDeltaSum * -80) as Coordinate);
        }
        // reset after applying
        pendingZoomAnchorX = null;
        pendingZoomDeltaSum = 0;
        pendingScrollChartDeltaSum = 0;
    }
    if (pendingHoverX != null && pendingHoverY != null) {
        const x = pendingHoverX;
        const y = pendingHoverY;
        pendingHoverX = pendingHoverY = null;
        if (Number.isNaN(lastAppliedHoverX) || Math.abs(x - lastAppliedHoverX) >= hoverPixelThreshold || Math.abs(y - lastAppliedHoverY) >= hoverPixelThreshold) {
            const pane = model.panes()[0];
            if (pane) {
                model.setAndSaveCurrentPosition(x as Coordinate, y as Coordinate, null, pane);
                lastAppliedHoverX = x;
                lastAppliedHoverY = y;
            }
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const seriesInstanceToId: WeakMap<any, string> = new WeakMap();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSeriesSnapshot(model: any, idx: number | null): { seriesById: Record<string, unknown>; hoveredSeriesId?: string } {
    const out: Record<string, unknown> = {};
    let hoveredSeriesId: string | undefined;
    const hovered = model.hoveredSource?.() ?? null;
    if (hovered && hovered.source && (hovered.source).bars) {
        const srcAny = hovered.source;
        const sid = seriesInstanceToId.get(srcAny);
        if (sid) { hoveredSeriesId = sid; }
    }
    if (idx != null) {
        const serieses = model.serieses?.() ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const s of serieses as any[]) {
            const sid = seriesInstanceToId.get(s);
            if (!sid) { continue; }
            try {
                const row = (s).bars()?.search(idx) ?? null;
                if (row) { out[sid] = row; }
            } catch (_e) { /* ignore lookup errors */ }
        }
    }
    return { seriesById: out, hoveredSeriesId };
}

function postCrosshairEvent(): void {
    if (!engine) { return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model: any = engine.model;
    const cross = model.crosshairSource();
    const idx = cross.appliedIndex?.() ?? null;
    const x = cross.appliedX?.();
    const y = cross.appliedY?.();
    const point = (x != null && y != null) ? { x, y } : undefined;
    const pane = cross.pane?.() ?? null;
    const paneIndex = pane ? model.getPaneIndex(pane) : -1;
    let time: unknown;
    if (idx != null) {
        const t = model.timeScale().indexToTime?.(idx);
        if (t !== undefined) { time = t; }
    }
    const snap = buildSeriesSnapshot(model, idx as number | null);
    (self as any).postMessage({ type: 'event:crosshair', param: { time, logical: idx ?? undefined, point, paneIndex: paneIndex >= 0 ? paneIndex : undefined, seriesById: snap.seriesById, hoveredSeriesId: snap.hoveredSeriesId } });
}

type SeriesTypeName = 'Line' | 'Area' | 'Histogram' | 'Candlestick' | 'Bar';

interface SeriesState {
	id: string;
	type: SeriesTypeName;
    buffer?: ArrayBufferLike;
	options?: Record<string, unknown>;
}

const seriesStateById: Map<string, SeriesState> = new Map();

interface EngineOptions {
	backgroundTopColor: string;
	backgroundBottomColor: string;
}

const engineOptions: EngineOptions = {
	backgroundTopColor: '#FFFFFF',
	backgroundBottomColor: '#FFFFFF',
};

let pluginHost: WorkerPluginHost | null = null;

function currentWorkerSizes(): WorkerRenderSizes {
    return {
        paneWidth: Math.max(0, Math.floor(paneLogicalWidth)),
        paneHeight: Math.max(0, Math.floor(paneLogicalHeight)),
        timeAxisHeight: Math.max(0, Math.floor(timeAxisLogicalHeight)),
        rightAxisWidth: Math.max(0, Math.floor(rightAxisLogicalWidth)),
        devicePixelRatio: dpr || 1,
    };
}

function currentWorkerContexts(): WorkerRenderContexts {
    return {
        pane: ctx,
        overlay: overlayCtx,
        time: timeCtx,
        right: rightCtx,
    };
}

// eslint-disable-next-line complexity
function render(): void {
	if (!ctx || !canvas || !engine) {return;}
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
	if (engineOptions.backgroundTopColor === engineOptions.backgroundBottomColor) {
		ctx.fillStyle = engineOptions.backgroundBottomColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	} else {
		const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
		g.addColorStop(0, engineOptions.backgroundTopColor);
		g.addColorStop(1, engineOptions.backgroundBottomColor);
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// DEBUG: draw a red diagonal to confirm painting coordinates
	if (renderCount < 3) {
		try {
			ctx.save();
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(10, 10);
			ctx.lineTo(Math.min(400 * dpr, canvas.width - 10), Math.min(200 * dpr, canvas.height - 10));
			ctx.stroke();
			ctx.restore();
        } catch (_e) { /* ignore draw errors */ }
	}

	const panes = engine.model.panes();
	if (panes.length === 0) { return; }
	const pane = panes[0];
    // Primary target compatible with our renderers
	// Provide bitmap dimensions to the target; renderers multiply coords by pixel ratio
    const target = baseTarget ?? new OffscreenCanvasTarget2D(ctx, canvas.width, canvas.height, 0, 0, dpr);
    // Optional shim target for any renderer paths that expect fancy-canvas class identity
    const fancyTarget = new FancyTarget(
        ctx,
        { width: Math.max(1, Math.floor(canvas.width / dpr)), height: Math.max(1, Math.floor(canvas.height / dpr)) },
        0,
        0,
        dpr as unknown as number
    );

    // grid (background)
	const gridView = pane.grid().paneView();
	const gridRenderer = gridView.renderer(pane);
	if (gridRenderer) {
		try {
            (gridRenderer as any).draw(target as any, false);
        } catch (_e) { /* ignore draw errors */ }
	}

    // bottom pane views (background)
	const sources = pane.orderedSources();
        // optionally log
	for (const source of sources) {
		const views = (source as any).bottomPaneViews?.() ?? (source as any).bottomPaneViews?.(pane) ?? [];
		for (const view of views) {
			const renderer = view.renderer?.(pane) ?? view.renderer?.();
			if (renderer) {
				if ((renderer).drawBackground) {
					(renderer).drawBackground(target as any, false);
				} else {
					(renderer).draw((target as any), false);
				}
			}
		}
	}

    // data sources (main)
	for (const source of sources) {
		const views = (source as any).paneViews?.() ?? source.paneViews?.(pane) ?? [];
		if (renderCount < 5) {
            // eslint-disable-next-line no-console
			console.log('[worker] source', (source as any).constructor?.name, 'views:', views.length);
		}
		for (const view of views) {
			const renderer = (view).renderer?.(pane) ?? (view).renderer?.();
			if (renderer) {
				if ((renderer).drawBackground) {
					(renderer).drawBackground(target as any, false);
				}
				(renderer).draw((renderer).draw.length >= 2 ? (target as any) : (fancyTarget as any), false);
			}
		}
	}

    // Overlay pass on a separate canvas to mirror main-thread top canvas (overlay-only paint doesn't change range)
	if (overlayCanvas && overlayCtx) {
		const overlayTarget = overlayTargetGlobal ?? new OffscreenCanvasTarget2D(overlayCtx, overlayCanvas.width, overlayCanvas.height, 0, 0, dpr);
        // clear overlay
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        // label views (overlay)
        for (const source of sources) {
            const views = (source as any).labelPaneViews?.() ?? (source as any).labelPaneViews?.(pane) ?? [];
            for (const view of views) {
                const renderer = view.renderer?.(pane) ?? view.renderer?.();
                if (renderer) {
                    (renderer).draw((overlayTarget as any), false);
                }
            }
        }
        // top views
        for (const source of sources) {
            const views = (source as any).topPaneViews?.() ?? (source as any).topPaneViews?.(pane) ?? [];
            for (const view of views) {
                const renderer = view.renderer?.(pane) ?? view.renderer?.();
                if (renderer) {
                    (renderer).draw((overlayTarget as any), false);
                }
            }
        }
        // crosshair on top
        const crosshair = engine.model.crosshairSource();
        const crosshairViews = (crosshair as any).paneViews?.(pane) ?? [];
        for (const view of crosshairViews) {
            const renderer = view.renderer?.(pane) ?? view.renderer?.();
            if (renderer) {
                (renderer).draw((overlayTarget as any), false);
            }
        }
    }
	renderCount++;

	if (pluginHost) {
		try { pluginHost.renderPane(); } catch { /* ignore plugin errors */ }
	}

	// Render time axis (worker widget). Paint in logical pixels
    if (timeCanvas && timeCtx && timeWidget) {
        const desiredW = Math.max(1, Math.floor(paneLogicalWidth * dpr));
        const desiredH = Math.max(1, Math.floor(timeAxisLogicalHeight * dpr));
        if (timeCanvas.width !== desiredW || timeCanvas.height !== desiredH) {
            timeCanvas.width = desiredW;
            timeCanvas.height = desiredH;
            const ctx2d = timeCanvas.getContext('2d');
            if (ctx2d) { timeCtx = ctx2d; }
        }
        timeWidget.paint(dpr);
    }

	// Render right price axis (worker widget). Paint in logical pixels
    if (rightCanvas && rightCtx && rightPriceWidget) {
        const desiredW = Math.max(1, Math.floor(rightAxisLogicalWidth * dpr));
        const desiredH = Math.max(1, Math.floor(paneLogicalHeight * dpr));
        if (rightCanvas.width !== desiredW || rightCanvas.height !== desiredH) {
            rightCanvas.width = desiredW;
            rightCanvas.height = desiredH;
            const ctx2d = rightCanvas.getContext('2d');
            if (ctx2d) { rightCtx = ctx2d; }
        }
        rightPriceWidget.paint(dpr);
    }

	// Plugins: axis hooks
	if (pluginHost) {
		try { pluginHost.renderTimeAxis(); } catch { /* ignore */ }
		try { pluginHost.renderRightAxis(); } catch { /* ignore */ }
	}
}

// eslint-disable-next-line complexity
function renderOverlayOnly(): void {
    if (!engine) { return; }
    const panes = engine.model.panes();
    if (!overlayCanvas || !overlayCtx || panes.length === 0) { return; }
    const pane = panes[0];
    const overlayTarget = overlayTargetGlobal ?? new OffscreenCanvasTarget2D(overlayCtx, overlayCanvas.width, overlayCanvas.height, 0, 0, dpr);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    const sources = pane.orderedSources();
    for (const source of sources) {
        const labelViews = (source as any).labelPaneViews?.() ?? (source as any).labelPaneViews?.(pane) ?? [];
        for (const view of labelViews) {
            const r = view.renderer?.(pane) ?? view.renderer?.();
            if (r) { (r).draw((overlayTarget as any), false); }
        }
    }
    for (const source of sources) {
        const topViews = (source as any).topPaneViews?.() ?? (source as any).topPaneViews?.(pane) ?? [];
        for (const view of topViews) {
            const r = view.renderer?.(pane) ?? view.renderer?.();
            if (r) { (r).draw((overlayTarget as any), false); }
        }
    }
    const crosshair = engine.model.crosshairSource();
    const crosshairViews = (crosshair as any).paneViews?.(pane) ?? [];
    for (const view of crosshairViews) {
        const r = view.renderer?.(pane) ?? view.renderer?.();
        if (r) { (r).draw((overlayTarget as any), false); }
    }
    if (timeCanvas && timeCtx && timeWidget) { timeWidget.paint(dpr); }
    if (rightCanvas && rightCtx && rightPriceWidget) { rightPriceWidget.paint(dpr); }
	if (pluginHost) {
		try { pluginHost.renderOverlay(); } catch { /* ignore */ }
		try { pluginHost.renderTimeAxis(); } catch { /* ignore */ }
		try { pluginHost.renderRightAxis(); } catch { /* ignore */ }
	}
}

function determineWheelSpeedAdjustment(deltaMode: number): number {
    // DOM_DELTA_PAGE = 2, DOM_DELTA_LINE = 1, DOM_DELTA_PIXEL = 0
    if (deltaMode === 2) { return 120; }
    if (deltaMode === 1) { return 32; }
    // Try to mirror windowsChrome fix heuristically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ua = ((self as any) && (self as any).navigator && (self as any).navigator.userAgent) ? (self as any).navigator.userAgent as string : '';
    const isWindows = /Windows/i.test(ua);
    const isChromium = /(Chrome|Chromium|Edg)/i.test(ua);
    if (isWindows && isChromium) {
        return 1 / (dpr || 1);
    }
    return 1;
}

function cancelKinetic(): void {
    if (kineticStepRafId != null) {
        cancelAnimationFrame(kineticStepRafId);
        kineticStepRafId = null;
    }
    kinetic = null;
}

function startKineticFromSamples(): void {
    if (!engine) { return; }
    const ts = performance.now();
    const timeScale = engine.model.timeScale();
    const barSpacing = timeScale.barSpacing();
    // Constants from PaneWidget (mirrored)
    const minSpeed = 0.2 / barSpacing;
    const maxSpeed = 7 / barSpacing;
    const dumpingCoeff = 0.997;
    const minMove = 15 / barSpacing;
    kinetic = new KineticAnimation(minSpeed, maxSpeed, dumpingCoeff, minMove);
    // Seed with recent samples collected during drag; fall back to synthetic samples if unavailable
    if (recentRightOffsetSamples.length >= 2) {
        // Add latest first as KineticAnimation expects most recent as position1
        for (let i = 0; i < Math.min(4, recentRightOffsetSamples.length); i++) {
            const s = recentRightOffsetSamples[i];
            kinetic.addPosition(s.pos as Coordinate, s.t);
        }
    } else {
        kinetic.addPosition(timeScale.rightOffset() as Coordinate, ts - 16);
        kinetic.addPosition(timeScale.rightOffset() as Coordinate, ts);
    }
    kinetic.start(timeScale.rightOffset() as Coordinate, ts);
    if (kineticStepRafId != null) { cancelAnimationFrame(kineticStepRafId); }
    const step = (): void => {
        if (!engine || !kinetic) { kineticStepRafId = null; return; }
        const now = performance.now();
        // Guard: if animation hasn't started or already finished, stop gracefully
        if (kinetic.finished(now)) { kineticStepRafId = null; kinetic = null; return; }
        const pos = kinetic.getPosition(now);
        engine.model.setRightOffset(pos);
        scheduleRender(false);
        if (!kinetic.finished(now)) {
            kineticStepRafId = requestAnimationFrame(step);
        } else {
            kineticStepRafId = null;
            kinetic = null;
        }
    };
    kineticStepRafId = requestAnimationFrame(step);
}

// eslint-disable-next-line complexity
self.onmessage = (ev: MessageEvent) => {
	const { type } = ev.data as { type: string };
	switch (type) {
        case 'init': {
            const { canvas: offscreen, overlayCanvas: offscreenOverlay, timeCanvas: offscreenTime, rightPriceCanvas: offscreenRight, width, height, timeHeight, rightWidth, dpr: devicePixelRatio } = ev.data as { canvas: OffscreenCanvas; overlayCanvas?: OffscreenCanvas; timeCanvas: OffscreenCanvas; rightPriceCanvas: OffscreenCanvas; width: number; height: number; timeHeight: number; rightWidth: number; dpr?: number };
			// Initialize engine first so invalidate handler can access a fully constructed model
            engine = new WorkerEngine({ width, height });
            paneLogicalWidth = width;
            paneLogicalHeight = height;
            timeAxisLogicalHeight = timeHeight;
            rightAxisLogicalWidth = rightWidth;
			canvas = offscreen;
            timeCanvas = offscreenTime;
            overlayCanvas = offscreenOverlay ?? null;
			rightCanvas = offscreenRight;
			dpr = devicePixelRatio || 1;
			canvas.width = Math.max(1, Math.floor(width * dpr));
			canvas.height = Math.max(1, Math.floor(height * dpr));
			const mainCtxSettings: CanvasRenderingContext2DSettings = { alpha: false, desynchronized: true };
			ctx = canvas.getContext('2d', mainCtxSettings as unknown as CanvasRenderingContext2DSettings);
			// Axis canvases use logical pixel backing stores to avoid double scaling
            if (timeCanvas) {
                timeCanvas.width = Math.max(1, Math.floor(width * dpr));
                timeCanvas.height = Math.max(1, Math.floor(timeHeight * dpr));
                timeCtx = timeCanvas.getContext('2d');
            }
            if (rightCanvas) {
                rightCanvas.width = Math.max(1, Math.floor(rightWidth * dpr));
                rightCanvas.height = Math.max(1, Math.floor(height * dpr));
                rightCtx = rightCanvas.getContext('2d');
            }
			if (overlayCanvas) {
				overlayCanvas.width = Math.max(1, Math.floor(width * dpr));
				overlayCanvas.height = Math.max(1, Math.floor(height * dpr));
				const overlayCtxSettings: CanvasRenderingContext2DSettings = { alpha: true, desynchronized: true };
				overlayCtx = overlayCanvas.getContext('2d', overlayCtxSettings as unknown as CanvasRenderingContext2DSettings);
			}
            if (timeCtx) { timeWidget = new TimeAxisWidgetWorker(engine.model, timeCtx); timeWidget.setSize(width, timeHeight); }
            if (rightCtx) { rightPriceWidget = new PriceAxisWidgetWorker(engine.model, rightCtx, 'right'); rightPriceWidget.setSize(rightWidth, height); }
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				engine.setWidth(Math.floor(canvas.width / dpr));
				engine.setHeight(Math.floor(canvas.height / dpr));
                engine.invalidateFull();
                baseTarget = new OffscreenCanvasTarget2D(ctx, canvas.width, canvas.height, 0, 0, dpr);
                overlayTargetGlobal = overlayCanvas && overlayCtx ? new OffscreenCanvasTarget2D(overlayCtx, overlayCanvas.width, overlayCanvas.height, 0, 0, dpr) : null;
                // Initialize plugin host after contexts are ready
                pluginHost = new WorkerPluginHost(
                    engine.model,
                    (overlayOnly?: boolean) => scheduleRender(!!overlayOnly),
                    currentWorkerSizes(),
                    currentWorkerContexts()
                );
                render();
			}
			break;
		}
		case 'resize': {
			if (canvas && ctx) {
				const { width, height, timeHeight, rightWidth, dpr: devicePixelRatio } = ev.data as { width: number; height: number; timeHeight: number; rightWidth: number; dpr?: number };
				dpr = devicePixelRatio || dpr || 1;
				canvas.width = Math.max(1, Math.floor(width * dpr));
				canvas.height = Math.max(1, Math.floor(height * dpr));
                if (timeCanvas) { timeCanvas.width = Math.max(1, Math.floor(width * dpr)); timeCanvas.height = Math.max(1, Math.floor(timeHeight * dpr)); }
                if (rightCanvas) { rightCanvas.width = Math.max(1, Math.floor(rightWidth * dpr)); rightCanvas.height = Math.max(1, Math.floor(height * dpr)); }
                if (overlayCanvas) { overlayCanvas.width = Math.max(1, Math.floor(width * dpr)); overlayCanvas.height = Math.max(1, Math.floor(height * dpr)); }
                paneLogicalWidth = width;
                paneLogicalHeight = height;
                timeAxisLogicalHeight = timeHeight;
                rightAxisLogicalWidth = rightWidth;
                if (timeWidget) { timeWidget.setSize(width, timeHeight); }
                if (rightPriceWidget) { rightPriceWidget.setSize(rightWidth, height); }
                engine?.setWidth(width);
                engine?.setHeight(height);
                if (pluginHost) {
                    try {
                        pluginHost.setSizes(currentWorkerSizes());
                        pluginHost.setContexts(currentWorkerContexts());
                        pluginHost.onResize();
                    } catch { /* ignore */ }
                }
				render();
			}
			break;
		}
		case 'wheel': {
			const { deltaX, deltaY, deltaMode, x } = ev.data as { deltaX: number; deltaY: number; deltaMode: number; x: number };
			const adj = determineWheelSpeedAdjustment(deltaMode);
			const scaledDeltaX = adj * deltaX / 100;
			const scaledDeltaY = -(adj * deltaY / 100);
			if (scaledDeltaY !== 0) {
				pendingZoomDeltaSum += scaledDeltaY;
				pendingZoomAnchorX = x;
				scheduleRender(false);
			}
			if (scaledDeltaX !== 0) {
				pendingScrollChartDeltaSum += scaledDeltaX;
				scheduleRender(false);
			}
			break;
		}
		case 'pointerDown': {
			const { x } = ev.data as { x: number };
            engine?.model.startScrollTime(x as Coordinate);
			lastPointerDownTime = performance.now();
			lastPointerDownX = x;
			lastPointerDownY = 0;
			isDragging = true;
			cancelKinetic();
			break;
		}
		case 'pointerMove': {
			const { x } = ev.data as { x: number };
			engine?.model.scrollTimeTo(x as Coordinate);
			// kinetic handled by KineticAnimation heuristics in startKineticFromSamples()
			scheduleRender(false);
            // Sample recent offsets for kinetic start; keep most recent first
            try {
                const now = performance.now();
                const ro = engine?.model.timeScale().rightOffset() as unknown as number;
                if (Number.isFinite(ro)) {
                    recentRightOffsetSamples.unshift({ t: now, pos: ro });
                    if (recentRightOffsetSamples.length > 4) { recentRightOffsetSamples.length = 4; }
                }
            } catch (_err) { /* ignore sampling errors */ }
			postCrosshairEvent();
			break;
		}
		case 'pointerUp': {
			engine?.model.endScrollTime();
			// Click detection: short duration and small movement
			const dt = performance.now() - lastPointerDownTime;
			if (dt < 250) {
				// @TODO: return correct point's data
				(self as any).postMessage({ type: 'event:click', param: { point: { x: lastPointerDownX, y: lastPointerDownY }, time: lastPointerDownTime } });
				break;
			}
			// Kinetic scroll
            if (isDragging) { startKineticFromSamples(); }
			isDragging = false;
            recentRightOffsetSamples.length = 0;
			break;
		}
		case 'hoverMove': {
			const { x, y } = ev.data as { x: number; y: number };
			pendingHoverX = x;
			pendingHoverY = y;
			// Update cursor/hovers via invalidate handler
			scheduleRender(true);
			break;
		}
		case 'hoverLeave': {
			engine?.model.clearCurrentPosition(true);
			scheduleRender(true);
			postCrosshairEvent();
			break;
		}
		case 'pinchStart': {
			const { x } = ev.data as { x: number };
			pinchPrevScale = 1;
			engine?.model.startScaleTime(x as Coordinate);
			break;
		}
		case 'pinch': {
			const { x, scale } = ev.data as { x: number; scale: number };
			const zoomDelta = (scale - pinchPrevScale) * 5;
			pinchPrevScale = scale;
			engine?.model.zoomTime(x as Coordinate, zoomDelta);
			render();
			break;
		}
		case 'pinchEnd': {
			engine?.model.endScaleTime();
			render();
			break;
		}
        case 'ts:fitContent': {
            if (!engine) { break; }
            engine.model.fitContent();
            scheduleRender(false);
            break;
        }
		case 'ts:reset': {
			engine?.model.resetTimeScale();
			render();
			break;
		}
        case 'ts:setVisibleLogicalRange': {
            const { range } = ev.data as { range: { from: number; to: number } };
            engine?.model.setTargetLogicalRange(range as unknown as LogicalRange);
            scheduleRender(false);
            break;
        }
        case 'ts:scrollToPosition': {
            const { pos } = ev.data as { pos: number; animated?: boolean };
            engine?.model.setRightOffset(pos);
            scheduleRender(false);
            break;
        }
		case 'ts:scrollToRealTime': {
			engine?.model.timeScale().scrollToRealTime();
			render();
			break;
		}
        case 'addSeries': {
            const { seriesId, seriesType, options } = ev.data as { seriesId: string; seriesType: SeriesTypeName; options?: Record<string, unknown> };
            seriesStateById.set(seriesId, { id: seriesId, type: seriesType, options });
            engine?.addSeries(seriesId, seriesType, options);
            // Remember mapping for event payloads
            try {
                const all = engine?.model.serieses?.() ?? [];
                if (all.length > 0) {
                    const last = all[all.length - 1];
                    seriesInstanceToId.set(last as object, seriesId);
                }
            } catch (_err) { /* ignore mapping errors */ }
        // no-op
			break;
		}
		case 'removeSeries': {
			const { seriesId } = ev.data as { seriesId: string };
			seriesStateById.delete(seriesId);
			if (ctx && canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
			break;
		}
		case 'applySeriesOptions': {
			const { seriesId, options } = ev.data as { seriesId: string; options: Record<string, unknown> };
			const s = seriesStateById.get(seriesId);
			if (s) {
				s.options = { ...(s.options ?? {}), ...options };
			}
            engine?.applySeriesOptions(seriesId, options);
			break;
		}
		case 'destroy': {
			ctx = null;
			canvas = null;
			engine = null;
            try { pluginHost = null; } catch { /* ignore */ }
			break;
		}
        case 'setData': {
            const { seriesId, dataBuffer } = ev.data as { seriesId: string; dataBuffer: ArrayBufferLike };
			const s = seriesStateById.get(seriesId);
			if (s) {
				s.buffer = dataBuffer;
			}
            if (ctx && canvas) {
                const t0 = performance.now();
                const items = deserializeSABToSeriesItems(dataBuffer);
                const t1 = performance.now();
                engine?.setData(seriesId, items);
                const t2 = performance.now();
                // eslint-disable-next-line no-console
                console.log('[worker] setData packed -> deser ms:', (t1 - t0).toFixed(2), 'apply ms:', (t2 - t1).toFixed(2));
                render();
            }
			break;
		}
        case 'setDataJSON': {
            const { seriesId, items } = ev.data as { seriesId: string; items: any[] };
            if (ctx && canvas) {
                const t0 = performance.now();
                engine?.setData(seriesId, items);
                const t1 = performance.now();
                // eslint-disable-next-line no-console
                console.log('[worker] setData json -> apply ms:', (t1 - t0).toFixed(2));
                render();
            }
            break;
        }
        case 'applyOptions': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { options } = ev.data as { options: any };
            // apply full chart options to model to keep time/price scales in sync
            engine?.model.applyOptions(options as Record<string, unknown>);
            if (options?.timeScale) {
                const ts = engine?.model.timeScale();
                if (ts && typeof options.timeScale.barSpacing === 'number') {
                    ts.setBarSpacing(Number(options.timeScale.barSpacing));
                }
            }
            if (options?.layout?.background) {
                const bg = options.layout.background;
                if (bg.type === 'solid') {
                    engineOptions.backgroundTopColor = bg.color ?? engineOptions.backgroundTopColor;
                    engineOptions.backgroundBottomColor = bg.color ?? engineOptions.backgroundBottomColor;
                } else {
                    engineOptions.backgroundTopColor = bg.topColor ?? engineOptions.backgroundTopColor;
                    engineOptions.backgroundBottomColor = bg.bottomColor ?? engineOptions.backgroundBottomColor;
                }
            }
			scheduleRender(false);
            break;
        }
        case 'plugin:add': {
            const { id, moduleUrl, exportName, options } = ev.data as { id: string; moduleUrl: string; exportName?: string; options?: unknown };
            // dynamic import user-provided module URL and register plugin instance
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            (async () => {
                try {
                    const mod: Record<string, unknown> = await import(moduleUrl);
                    // Prefer default export if available, otherwise named
                    const factory = (exportName ? mod[exportName] : (mod as { default?: unknown }).default) as ((opts?: unknown) => import('./plugins/types').WorkerPlugin<unknown>) | undefined;
                    if (typeof factory === 'function') {
                        const instance = (factory as (opts?: unknown) => import('./plugins/types').WorkerPlugin<unknown>)(options);
                        pluginHost?.register(id, instance, options);
                        scheduleRender(false);
                    } else {
                        // eslint-disable-next-line no-console
                        console.warn('[worker] plugin:add invalid factory export from', moduleUrl);
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('[worker] failed to import plugin module', moduleUrl, e);
                }
            })();
            break;
        }
        case 'plugin:remove': {
            const { id } = ev.data as { id: string };
            pluginHost?.unregister(id);
            scheduleRender(false);
            break;
        }
        case 'plugin:applyOptions': {
            const { id, options } = ev.data as { id: string; options: unknown };
            pluginHost?.applyOptions(id, options);
            scheduleRender(false);
            break;
        }
        case 'dblClick': {
            engine?.model.resetTimeScale();
            render();
            break;
        }
        case 'update': {
            const { seriesId, bar, historicalUpdate } = ev.data as { seriesId: string; bar: any; historicalUpdate?: boolean };
            engine?.updateData(seriesId, bar, !!historicalUpdate);
            render();
            break;
        }
		default:
			break;
	}
};

