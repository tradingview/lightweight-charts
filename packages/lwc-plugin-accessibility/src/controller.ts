import { chartTableElement } from '@tradingview/lwc-toolkit/dom/pane-element';
import { IChartApi, IPaneApi, Time } from 'lightweight-charts';

import { ChartCanvases } from './dom/chart-canvases';
import { defaultMessages, mergeMessages } from './messages';
import {
	AccessibilityOptions,
	AccessibilityPaneOptions,
	defaultPaneOptions,
	definedOptions,
} from './options';
import { AccessibilityPlugin } from './pane-primitive';
import { UpdateAnnouncer, UpdateAnnouncerConfig, UpdateAnnouncerMode, paneLinks } from './update-announcer';

/** The handle returned by {@link addAccessibilityPlugin}. */
export interface AccessibilityPluginController {
	readonly plugins: readonly AccessibilityPlugin[];
	detach(): void;
	focus(paneIndex?: number): void;
	/**
	 * Reconciles the per-pane layers with the chart's current panes. Panes added
	 * or removed at runtime are picked up automatically on the next redraw, so
	 * this is only needed to force the check immediately.
	 */
	refresh(): void;
	/**
	 * Updates chart-level options at runtime, keeping the per-pane layers and the
	 * shared update region in sync — including `dataUpdates`, `messages` and
	 * `lang`, which the per-pane `applyOptions` alone cannot change on the shared
	 * region.
	 */
	applyOptions(options: AccessibilityOptions): void;
}

interface PaneEntry {
	pane: IPaneApi<Time>;
	plugin: AccessibilityPlugin;
}

/**
 * Attaches one {@link AccessibilityPlugin} per pane and returns a controller that
 * keeps them – and the single chart-level update region – in step.
 *
 * The API is typed as `IChartApi` (a `Time`-based chart) rather than a generic
 * `IChartApiBase<HorzScaleItem>`: the announcements format business days and UTC
 * timestamps, so every internal path assumes `Time`.
 */
export function addAccessibilityPlugin(
	chart: IChartApi,
	options: AccessibilityOptions = {}
): AccessibilityPluginController {
	const entries: PaneEntry[] = [];
	let announcer: UpdateAnnouncer | null = null;
	// Mutable so the controller's applyOptions can reconfigure at runtime.
	let current: AccessibilityOptions = { ...options };
	// Set while detach() is tearing down, so a primitive's own detach callback
	// does not mutate the list being drained.
	let disposing = false;
	let syncHandle: ReturnType<typeof requestAnimationFrame> | null = null;
	let canvases: ChartCanvases | null = null;

	// 'active' (the default) announces only the focused pane; 'all' announces
	// every pane and the announcer combines them into one message.
	const announcerMode = (): UpdateAnnouncerMode =>
		(current.dataUpdates?.mode ?? 'active') === 'active' ? 'active' : 'combine';
	const resolveAnnounce = (paneIndex: number): boolean => {
		const dataUpdates = current.dataUpdates;
		if (dataUpdates?.mode === 'none') {
			return false;
		}
		// In 'active' mode every accepted pane still reports; the announcer filters
		// the flush down to the active pane.
		return dataUpdates?.panes?.(paneIndex) ?? true;
	};
	const resolveLang = (): string | undefined =>
		current.lang ?? (chart.options().localization.locale || undefined);
	const debounceMs = (): number =>
		current.dataUpdates?.debounceMs ?? defaultPaneOptions.updateDebounceMs;

	const announcerConfig = (): UpdateAnnouncerConfig => ({
		mode: announcerMode(),
		messages: mergeMessages(defaultMessages, current.messages),
		debounceMs: debounceMs(),
		maxSeries: current.updateMaxSeries ?? defaultPaneOptions.updateMaxSeries,
		lang: resolveLang(),
		onAnnounce: current.onAnnounce,
	});

	const resolveOptions = (paneIndex: number): Partial<AccessibilityPaneOptions> => {
		// `chartTitle` is resolved per pane below; `dataUpdates` is chart-level only.
		const { chartTitle, dataUpdates: _dataUpdates, ...rest } = current;
		const resolved: Partial<AccessibilityPaneOptions> = {
			...definedOptions(rest),
			announceDataUpdates: resolveAnnounce(paneIndex),
			updateDebounceMs: debounceMs(),
		};
		if (chartTitle !== undefined) {
			resolved.chartTitle = typeof chartTitle === 'function'
				? chartTitle(paneIndex)
				: chartTitle;
		}
		return resolved;
	};

	/**
	 * Whether a pane can still be detached from. `chart.remove()` destroys the
	 * chart without telling its primitives, and detaching from a destroyed pane
	 * reaches into a dead model, so both the pane's membership and its (removed)
	 * element are checked – behind a `try` because the accessors themselves throw
	 * on a disposed chart.
	 */
	const paneAlive = (pane: IPaneApi<Time>): boolean => {
		try {
			return chart.panes().includes(pane) && pane.getHTMLElement() !== null;
		} catch {
			return false;
		}
	};

	const chartPanes = (): readonly IPaneApi<Time>[] => {
		try {
			return chart.panes();
		} catch {
			return [];
		}
	};

	/** Releases one entry's links; detaches the primitive when its pane is still alive. */
	const releaseEntry = (entry: PaneEntry, detachPrimitive: boolean): void => {
		const link = paneLinks.get(entry.plugin);
		if (link) {
			link.attachController(null);
			link.attachAnnouncer(null);
			announcer?.unregister(link.source);
		}
		if (detachPrimitive && paneAlive(entry.pane)) {
			entry.pane.detachPrimitive(entry.plugin);
		}
	};

	/** Called by a primitive the library detached from under us (a removed pane). */
	const forget = (plugin: AccessibilityPlugin): void => {
		if (disposing) {
			return;
		}
		const index = entries.findIndex((entry: PaneEntry) => entry.plugin === plugin);
		if (index >= 0) {
			releaseEntry(entries[index], false);
			entries.splice(index, 1);
		}
	};

	const attachPane = (pane: IPaneApi<Time>, paneIndex: number): void => {
		const plugin = new AccessibilityPlugin(resolveOptions(paneIndex), paneIndex);
		pane.attachPrimitive(plugin);
		const link = paneLinks.get(plugin);
		if (link) {
			link.attachAnnouncer(announcer);
			link.attachController({ sync: scheduleSync, detached: (): void => forget(plugin) });
			announcer?.register(link.source);
		}
		entries.push({ pane, plugin });
	};

	/**
	 * Reconciles the layers with the chart's panes, attaching and detaching only
	 * the difference – so adding a pane never disturbs the focus or the options of
	 * the panes that were already there.
	 */
	const sync = (): void => {
		if (disposing) {
			return;
		}
		const panes = chartPanes();
		for (const entry of entries.slice()) {
			if (!panes.includes(entry.pane)) {
				forget(entry.plugin);
			}
		}
		if (panes.length === 0) {
			// No panes (or a chart that has been removed): nothing to attach to.
			return;
		}
		if (announcer === null) {
			// The first sync, or one after `detach()` – the controller can be
			// re-attached with `refresh()`.
			announcer = new UpdateAnnouncer(chart.chartElement(), announcerConfig());
		}
		panes.forEach((pane: IPaneApi<Time>, paneIndex: number) => {
			if (!entries.some((entry: PaneEntry) => entry.pane === pane)) {
				attachPane(pane, paneIndex);
			}
		});
		// Keep the entries – and therefore `plugins` and `focus(i)` – in pane order
		// even after a pane was moved with `pane.moveTo()`.
		entries.sort((a: PaneEntry, b: PaneEntry) => panes.indexOf(a.pane) - panes.indexOf(b.pane));
		entries.forEach(({ plugin }: PaneEntry, paneIndex: number) => plugin.applyOptions(resolveOptions(paneIndex)));
		announcer.reorder(entries.flatMap(({ plugin }: PaneEntry) => {
			const link = paneLinks.get(plugin);
			return link ? [link.source] : [];
		}));
		if (canvases === null) {
			const table = chartTableElement(chart);
			if (table) {
				canvases = new ChartCanvases(table);
			}
		}
	};

	/**
	 * The panes are checked from `updateAllViews`, in the middle of the library's
	 * own update cycle, so the reconciliation itself is deferred to the next frame
	 * rather than attaching a primitive re-entrantly.
	 */
	const scheduleSync = (): void => {
		if (disposing || syncHandle !== null) {
			return;
		}
		const panes = chartPanes();
		if (panes.length === entries.length && panes.every((pane: IPaneApi<Time>, index: number) => entries[index].pane === pane)) {
			return;
		}
		syncHandle = requestAnimationFrame(() => {
			syncHandle = null;
			sync();
		});
	};

	const detach = (): void => {
		disposing = true;
		if (syncHandle !== null) {
			cancelAnimationFrame(syncHandle);
			syncHandle = null;
		}
		canvases?.dispose();
		canvases = null;
		const disposingAnnouncer = announcer;
		while (entries.length > 0) {
			const entry = entries.pop();
			if (entry) {
				releaseEntry(entry, true);
			}
		}
		announcer = null;
		// Remove the shared region only after the per-pane plugins are torn down.
		disposingAnnouncer?.dispose();
		disposing = false;
	};

	const applyOptions = (next: AccessibilityOptions): void => {
		current = { ...current, ...definedOptions(next) };
		// Keep the shared region (mode / messages / debounce / lang) and every pane in sync.
		announcer?.configure(announcerConfig());
		entries.forEach(({ plugin }: PaneEntry, paneIndex: number) => plugin.applyOptions(resolveOptions(paneIndex)));
	};

	sync();

	return {
		get plugins(): readonly AccessibilityPlugin[] {
			return entries.map((entry: PaneEntry) => entry.plugin);
		},
		detach,
		focus(paneIndex = 0): void {
			entries[paneIndex]?.plugin.focus();
		},
		refresh: sync,
		applyOptions,
	};
}
