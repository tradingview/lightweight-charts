import { IChartApi, IPaneApi, Time } from 'lightweight-charts';

import { defaultMessages, mergeMessages } from './messages';
import {
	AccessibilityOptions,
	AccessibilityPaneOptions,
	defaultPaneOptions,
} from './options';
import { AccessibilityPlugin } from './pane-primitive';
import { UpdateAnnouncer, UpdateAnnouncerConfig, UpdateAnnouncerMode, paneLinks } from './update-announcer';

/** The handle returned by {@link addAccessibilityPlugin}. */
export interface AccessibilityPluginController {
	readonly plugins: readonly AccessibilityPlugin[];
	detach(): void;
	focus(paneIndex?: number): void;
	refresh(): void;
	/**
	 * Updates chart-level options at runtime, keeping the per-pane layers and the
	 * shared update region in sync — including `dataUpdates`, `messages` and
	 * `lang`, which the per-pane `applyOptions` alone cannot change on the shared
	 * region.
	 */
	applyOptions(options: AccessibilityOptions): void;
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
	const entries: { pane: IPaneApi<Time>; plugin: AccessibilityPlugin }[] = [];
	let announcer: UpdateAnnouncer | null = null;
	// Mutable so the controller's applyOptions can reconfigure at runtime.
	let current: AccessibilityOptions = { ...options };

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
	});

	const resolveOptions = (paneIndex: number): Partial<AccessibilityPaneOptions> => {
		// `chartTitle` is resolved per pane below; `dataUpdates` is chart-level only.
		const { chartTitle, dataUpdates: _dataUpdates, ...rest } = current;
		const resolved: Partial<AccessibilityPaneOptions> = {
			...rest,
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

	const detach = (): void => {
		const disposing = announcer;
		announcer = null;
		while (entries.length > 0) {
			const entry = entries.pop();
			if (entry) {
				paneLinks.get(entry.plugin)?.attachAnnouncer(null);
				entry.pane.detachPrimitive(entry.plugin);
			}
		}
		// Remove the shared region only after the per-pane plugins are torn down.
		disposing?.dispose();
	};

	const attach = (): void => {
		detach();
		const sharedAnnouncer = new UpdateAnnouncer(chart.chartElement(), announcerConfig());
		announcer = sharedAnnouncer;
		chart.panes().forEach((pane: IPaneApi<Time>, paneIndex: number) => {
			const plugin = new AccessibilityPlugin(resolveOptions(paneIndex), paneIndex);
			pane.attachPrimitive(plugin);
			const link = paneLinks.get(plugin);
			link?.attachAnnouncer(sharedAnnouncer);
			if (link) {
				sharedAnnouncer.register(link.source);
			}
			entries.push({ pane, plugin });
		});
	};

	const applyOptions = (next: AccessibilityOptions): void => {
		current = { ...current, ...next };
		// Keep the shared region (mode / messages / debounce / lang) and every pane in sync.
		announcer?.configure(announcerConfig());
		entries.forEach(({ plugin }, paneIndex) => plugin.applyOptions(resolveOptions(paneIndex)));
	};

	attach();

	return {
		get plugins(): readonly AccessibilityPlugin[] {
			return entries.map(entry => entry.plugin);
		},
		detach,
		focus(paneIndex = 0): void {
			entries[paneIndex]?.plugin.focus();
		},
		refresh: attach,
		applyOptions,
	};
}
