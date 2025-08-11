import { DeepPartial } from '../../helpers/strict-type-checks';

import { TimeChartOptions } from '../../model/horz-scale-behavior-time/time-based-chart-options';
import { SeriesType } from '../../model/series-options';

import { fetchHtmlElement } from '../create-chart';
import { IChartApiBase } from '../ichart-api';
import { MouseEventsProxy } from './mouse-events-proxy';
import { serializeData, serializeDataToArrayBuffer } from './serialization';

// minimal worker-mode bootstrap that reuses the existing ChartApi for API shape

interface SeriesProxy {
	seriesType: () => SeriesType;
	applyOptions: (opts: unknown) => void;
	setData: (data: unknown[]) => void;
	update: (bar: unknown, historicalUpdate?: boolean) => void;
}

interface WorkerPluginHandle { id: string; applyOptions: (opts: unknown) => void; remove: () => void }
interface WorkerPluginDescriptor { url: string; exportName?: string; options?: unknown; id?: string }

interface WorkerChartApi extends Pick<IChartApiBase, 'resize' | 'remove'> {
	applyOptions: (opts: unknown) => void;
	timeScale: () => {
		fitContent: () => void;
		resetTimeScale: () => void;
		setVisibleLogicalRange: (range: { from: number; to: number }) => void;
		getVisibleLogicalRange: () => { from: number; to: number };
		scrollToPosition: (pos: number, animated: boolean) => void;
		scrollToRealTime: () => void;
	};
	addSeries: (definition: { type: SeriesType }, seriesOptions?: unknown) => SeriesProxy;
	removeSeries: (seriesApi: SeriesProxy) => void;
	addPlugin: (descriptor: WorkerPluginDescriptor) => WorkerPluginHandle;
}

// eslint-disable-next-line complexity
export function createWorkerChart(
	container: string | HTMLElement,
	options?: DeepPartial<TimeChartOptions>
): WorkerChartApi {
	const htmlElement = fetchHtmlElement(container);

	// Cleanup and set base container size if provided
	while (htmlElement.firstChild) {
		htmlElement.removeChild(htmlElement.firstChild);
	}
	const maybeSize = options as unknown as { width?: number; height?: number } | undefined;
	const explicitWidth = maybeSize?.width;
	const explicitHeight = maybeSize?.height;
	if (explicitWidth != null) {
		htmlElement.style.width = `${Math.floor(Number(explicitWidth))}px`;
	}
	if (explicitHeight != null) {
		htmlElement.style.height = `${Math.floor(Number(explicitHeight))}px`;
	}

	// Build table layout mirroring main-thread structure
	const table = document.createElement('table');
	table.style.width = '100%';
	table.style.height = '100%';
	table.style.borderCollapse = 'collapse';
	table.style.padding = '0';
	table.style.margin = '0';
	table.style.borderSpacing = '0';
	htmlElement.appendChild(table);

	const paneRow = document.createElement('tr');
	const leftStubTd = document.createElement('td');
	leftStubTd.style.padding = '0';
	leftStubTd.style.width = '0px';
	const paneTd = document.createElement('td');
	paneTd.style.padding = '0';
	paneTd.style.position = 'relative';
	const rightAxisTd = document.createElement('td');
	rightAxisTd.style.padding = '0';
	rightAxisTd.style.width = '60px';
	rightAxisTd.style.position = 'relative';
	rightAxisTd.style.overflow = 'hidden';
	paneRow.appendChild(leftStubTd);
	paneRow.appendChild(paneTd);
	paneRow.appendChild(rightAxisTd);

	const timeRow = document.createElement('tr');
	const timeLeftStubTd = document.createElement('td');
	timeLeftStubTd.style.padding = '0';
	const timeTd = document.createElement('td');
	timeTd.style.padding = '0';
	timeTd.style.height = '28px';
	timeTd.style.position = 'relative';
	// Ensure stacking context for overlays
	timeTd.style.overflow = 'hidden';
	const timeRightStubTd = document.createElement('td');
	timeRightStubTd.style.padding = '0';
	timeRow.appendChild(timeLeftStubTd);
	timeRow.appendChild(timeTd);
	timeRow.appendChild(timeRightStubTd);

	table.appendChild(paneRow);
	table.appendChild(timeRow);

	// Canvases inside cells
	const paneCanvas = document.createElement('canvas');
	paneCanvas.style.width = '100%';
	paneCanvas.style.height = '100%';
	paneCanvas.style.display = 'block';
	paneCanvas.style.position = 'absolute';
	paneCanvas.style.left = '0';
	paneCanvas.style.top = '0';
	paneCanvas.style.zIndex = '1';
	paneTd.appendChild(paneCanvas);

	// Overlay canvas for crosshair and top-layer drawings
	const paneOverlayCanvas = document.createElement('canvas');
	paneOverlayCanvas.style.width = '100%';
	paneOverlayCanvas.style.height = '100%';
	paneOverlayCanvas.style.display = 'block';
	paneOverlayCanvas.style.position = 'absolute';
	paneOverlayCanvas.style.left = '0';
	paneOverlayCanvas.style.top = '0';
	paneOverlayCanvas.style.zIndex = '2';
	paneTd.appendChild(paneOverlayCanvas);

	const timeCanvas = document.createElement('canvas');
	timeCanvas.style.width = '100%';
	timeCanvas.style.height = '100%';
	timeCanvas.style.display = 'block';
	timeTd.appendChild(timeCanvas);

	const rightPriceCanvas = document.createElement('canvas');
	rightPriceCanvas.style.width = '100%';
	rightPriceCanvas.style.height = '100%';
	rightPriceCanvas.style.display = 'block';
	rightAxisTd.appendChild(rightPriceCanvas);

	const offscreen = (paneCanvas).transferControlToOffscreen();
	const offscreenOverlay = (paneOverlayCanvas).transferControlToOffscreen();
	const offscreenTime = (timeCanvas).transferControlToOffscreen();
	const offscreenRight = (rightPriceCanvas).transferControlToOffscreen();

	const mode = (process.env.NODE_ENV === 'production') ? 'production' : 'development';
	const worker = new Worker(new URL(`../../dist/chart.worker.${mode}.js`, import.meta.url), { type: 'module' });

	const requestedTransport = (options as unknown as { dataTransport?: 'sab' | 'ab' | 'json' } | undefined)?.dataTransport;
	let dataTransport: 'sab' | 'ab' | 'json' = requestedTransport ?? 'sab';
	// Feature checks: if SAB not available, downgrade
	const supportsSab = (window as typeof globalThis).SharedArrayBuffer != null;
	if (dataTransport === 'sab' && !supportsSab) {
		dataTransport = 'json';
	}

	const measure = () => ({
		pane: (() => { const r = paneTd.getBoundingClientRect(); return { w: Math.max(0, Math.floor(r.width)), h: Math.max(0, Math.floor(r.height)) }; })(),
		timeHeight: Math.max(0, Math.floor(timeTd.getBoundingClientRect().height)),
		rightWidth: (() => { const r = rightAxisTd.getBoundingClientRect(); return Math.max(0, Math.floor(r.width)); })(),
	});
	const sizes = measure();
	timeRightStubTd.style.width = `${sizes.rightWidth}px`;

	worker.postMessage({ type: 'init', canvas: offscreen, overlayCanvas: offscreenOverlay, timeCanvas: offscreenTime, rightPriceCanvas: offscreenRight, width: sizes.pane.w, height: sizes.pane.h, timeHeight: sizes.timeHeight, rightWidth: sizes.rightWidth, dpr: (window.devicePixelRatio || 1) }, [offscreen as unknown as Transferable, offscreenOverlay as unknown as Transferable, offscreenTime as unknown as Transferable, offscreenRight as unknown as Transferable]);

	try {
		const w = window as unknown as { crossOriginIsolated?: boolean };
		if (w.crossOriginIsolated === false) {
			// eslint-disable-next-line no-console
			console.warn('[Lightweight Charts] crossOriginIsolated is false; SharedArrayBuffer features may be unavailable without COOP/COEP headers.');
		}
	} catch {
		// ignore
	}

	// resize handling: re-measure table cell sizes and notify worker
	const ro = new ResizeObserver(() => {
		const s = measure();
		timeRightStubTd.style.width = `${s.rightWidth}px`;
		if (s.pane.w && s.pane.h) {
			worker.postMessage({ type: 'resize', width: s.pane.w, height: s.pane.h, timeHeight: s.timeHeight, rightWidth: s.rightWidth, dpr: (window.devicePixelRatio || 1) });
		}
	});
	ro.observe(htmlElement);

	const mouseProxy = new MouseEventsProxy(htmlElement, worker);

	if (options) {
		worker.postMessage({ type: 'applyOptions', options });
	}

	let lastVisibleLogicalRange: { from: number; to: number } | null = null;
	let lastVisibleTimeRange: { from: unknown; to: unknown } | null = null;
	const visibleTimeRangeHandlers: ((r: { from: unknown; to: unknown } | null) => void)[] = [];
	const visibleLogicalRangeHandlers: ((r: { from: number; to: number } | null) => void)[] = [];
	// eslint-disable-next-line complexity
	worker.onmessage = (ev: MessageEvent) => {
		const msg = ev.data as { type: string };
		switch (msg.type) {
			case 'axisWidth': {
				const { side, width } = ev.data as { side: 'left' | 'right'; width: number };
				if (side === 'right') {
					rightAxisTd.style.width = `${Math.max(0, Math.floor(width))}px`;
					timeRightStubTd.style.width = `${Math.max(0, Math.floor(width))}px`;
				}
				break;
			}
			// price/time axes and crosshair labels are rendered within worker
			case 'cursor': {
				const { style } = ev.data as { style: string | null };
				htmlElement.style.cursor = style ?? '';
				break;
			}
			case 'event:crosshair': {
				const { param } = ev.data as { param: unknown };
				for (const handler of crosshairHandlers) { handler(param); }
				break;
			}
			case 'event:click': {
				const { param } = ev.data as { param: unknown };
				for (const handler of clickHandlers) { handler(param); }
				for (const handler of chartClickHandlers) { handler(param); }
				break;
			}
			case 'event:dblclick': {
				const { param } = ev.data as { param: unknown };
				for (const handler of dblClickHandlers) { handler(param); }
				break;
			}
			case 'visibleLogicalRange': {
				const { range } = ev.data as { range: { from: number; to: number } | null };
				lastVisibleLogicalRange = range ? { from: range.from, to: range.to } : null;
				// notify subscribers
				for (const h of visibleLogicalRangeHandlers) { try { h(lastVisibleLogicalRange); } catch (_err) { /* ignore subscriber error */ } }
				break;
			}
			case 'visibleTimeRange': {
				const { range } = ev.data as { range: { from: unknown; to: unknown } | null };
				lastVisibleTimeRange = range ? { from: range.from, to: range.to } : null;
				for (const h of visibleTimeRangeHandlers) { try { h(lastVisibleTimeRange); } catch (_err) { /* ignore subscriber error */ } }
				break;
			}
			default:
				break;
		}
	};

	const seriesMap = new Map<string, SeriesProxy>();

	const clickHandlers: ((p: unknown) => void)[] = [];
	const chartClickHandlers: ((p: unknown) => void)[] = [];
	const dblClickHandlers: ((p: unknown) => void)[] = [];
	const crosshairHandlers: ((p: unknown) => void)[] = [];

	const api: WorkerChartApi & {
		subscribeClick?: (h: (p: unknown) => void) => void;
		unsubscribeClick?: (h: (p: unknown) => void) => void;
		subscribeDblClick?: (h: (p: unknown) => void) => void;
		unsubscribeDblClick?: (h: (p: unknown) => void) => void;
		subscribeCrosshairMove?: (h: (p: unknown) => void) => void;
		unsubscribeCrosshairMove?: (h: (p: unknown) => void) => void;
	} = {
		applyOptions: (opts: unknown) => {
			try {
				const maybe = opts as { dataTransport?: 'sab' | 'ab' | 'json' } | undefined;
				if (maybe && maybe.dataTransport) {
					const val = maybe.dataTransport;
					if (val === 'json' || val === 'ab' || val === 'sab') {
						dataTransport = val;
					}
				}
			} catch { /* ignore */ }
			worker.postMessage({ type: 'applyOptions', options: opts });
		},
		resize: (width: number, height: number) => {
			if (Number.isFinite(width)) {
				htmlElement.style.width = `${Math.floor(width)}px`;
			}
			if (Number.isFinite(height)) {
				htmlElement.style.height = `${Math.floor(height)}px`;
			}
			const s = measure();
			timeRightStubTd.style.width = `${s.rightWidth}px`;
			worker.postMessage({ type: 'resize', width: s.pane.w, height: s.pane.h, timeHeight: s.timeHeight, rightWidth: s.rightWidth, dpr: (window.devicePixelRatio || 1) });
		},
		remove: () => { ro.disconnect(); mouseProxy.destroy(); worker.postMessage({ type: 'destroy' }); worker.terminate(); },
		timeScale: () => ({
			// minimal ITimeScaleApi surface wired to worker
			fitContent: () => worker.postMessage({ type: 'ts:fitContent' }),
			resetTimeScale: () => worker.postMessage({ type: 'ts:reset' }),
			setVisibleLogicalRange: (range: { from: number; to: number }) => worker.postMessage({ type: 'ts:setVisibleLogicalRange', range }),
			getVisibleLogicalRange: () => lastVisibleLogicalRange,
			subscribeVisibleTimeRangeChange: (h: (r: { from: unknown; to: unknown } | null) => void) => { visibleTimeRangeHandlers.push(h); },
			unsubscribeVisibleTimeRangeChange: (h: (r: { from: unknown; to: unknown } | null) => void) => { const i = visibleTimeRangeHandlers.indexOf(h); if (i !== -1) {visibleTimeRangeHandlers.splice(i, 1);} },
			subscribeVisibleLogicalRangeChange: (h: (r: { from: number; to: number } | null) => void) => { visibleLogicalRangeHandlers.push(h); },
			unsubscribeVisibleLogicalRangeChange: (h: (r: { from: number; to: number } | null) => void) => { const i = visibleLogicalRangeHandlers.indexOf(h); if (i !== -1) {visibleLogicalRangeHandlers.splice(i, 1);} },
			scrollToPosition: (pos: number, animated: boolean) => worker.postMessage({ type: 'ts:scrollToPosition', pos, animated }),
			scrollToRealTime: () => worker.postMessage({ type: 'ts:scrollToRealTime' }),
		}),
		addSeries: (definition: { type: SeriesType }, seriesOptions?: unknown) => {
			const type: SeriesType = definition?.type ?? 'Line';
			const seriesId = Math.random().toString(36).slice(2);
			worker.postMessage({ type: 'addSeries', seriesId, seriesType: type, options: seriesOptions });
			const s: SeriesProxy = {
				seriesType: () => type,
				applyOptions: (opts: unknown) => worker.postMessage({ type: 'applySeriesOptions', seriesId, options: opts }),
				setData: (data: unknown[]) => {
					const perfStart = performance.now();
					if (dataTransport === 'json') {
						worker.postMessage({ type: 'setDataJSON', seriesId, items: data });
						// eslint-disable-next-line no-console
						console.debug('[setData] json send ms', performance.now() - perfStart);
						return;
					}
					if (dataTransport === 'ab') {
						const buf = (serializeDataToArrayBuffer as unknown as (d: unknown[]) => ArrayBuffer)(data);
						worker.postMessage({ type: 'setData', seriesId, dataBuffer: buf }, [buf]);
						// eslint-disable-next-line no-console
						console.debug('[setData] ab serialize+post ms', performance.now() - perfStart);
						return;
					}
					// default: 'sab'
					try {
						const buf = (serializeData as unknown as (d: unknown[]) => SharedArrayBuffer)(data);
						worker.postMessage({ type: 'setData', seriesId, dataBuffer: buf });
						// eslint-disable-next-line no-console
						console.debug('[setData] sab serialize+post ms', performance.now() - perfStart);
					} catch (_e) {
						worker.postMessage({ type: 'setDataJSON', seriesId, items: data });
					}
				},
				update: (bar: unknown, historicalUpdate?: boolean) => worker.postMessage({ type: 'update', seriesId, bar, historicalUpdate: !!historicalUpdate }),
			};
			seriesMap.set(seriesId, s);
			return s;
		},
		removeSeries: (seriesApi: SeriesProxy) => {
			for (const [id, s] of seriesMap) {
				if (s === seriesApi) {
					worker.postMessage({ type: 'removeSeries', seriesId: id });
					seriesMap.delete(id);
					break;
				}
			}
		},
		addPlugin: (descriptor: WorkerPluginDescriptor) => {
			const id = descriptor.id ?? Math.random().toString(36).slice(2);
			worker.postMessage({ type: 'plugin:add', id, moduleUrl: descriptor.url, exportName: descriptor.exportName, options: descriptor.options });
			return {
				id,
				applyOptions: (opts: unknown) => worker.postMessage({ type: 'plugin:applyOptions', id, options: opts }),
				remove: () => worker.postMessage({ type: 'plugin:remove', id }),
			};
		},
		subscribeClick: (h: (p: unknown) => void) => { chartClickHandlers.push(h); },
		unsubscribeClick: (h: (p: unknown) => void) => { const idx = chartClickHandlers.indexOf(h); if (idx !== -1) { chartClickHandlers.splice(idx, 1); } },
		subscribeDblClick: (h: (p: unknown) => void) => { dblClickHandlers.push(h); },
		unsubscribeDblClick: (h: (p: unknown) => void) => { const idx = dblClickHandlers.indexOf(h); if (idx !== -1) { dblClickHandlers.splice(idx, 1); } },
		subscribeCrosshairMove: (h: (p: unknown) => void) => { crosshairHandlers.push(h); },
		unsubscribeCrosshairMove: (h: (p: unknown) => void) => { const idx = crosshairHandlers.indexOf(h); if (idx !== -1) { crosshairHandlers.splice(idx, 1); } },
	};

	return api;
}

