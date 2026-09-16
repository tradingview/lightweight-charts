import { LiveRegionWriter, createLiveRegion } from './dom/live-region';
import { AccessibilityMessages, formatUpdateMessage } from './messages';
import { AnySeries } from './types';

/**
 * Mirrors an announcement to the host's `onAnnounce`. The live region is always
 * written first, and an exception from application code must not abort the
 * announcer's own bookkeeping, so a throwing callback is ignored here.
 */
export function mirrorAnnouncement(
	onAnnounce: ((message: string) => void) | undefined,
	message: string
): void {
	if (onAnnounce === undefined) {
		return;
	}
	try {
		onAnnounce(message);
	} catch {
		// Left to the application's own error handling.
	}
}

/** How the shared region combines the panes that reported a data change. */
export type UpdateAnnouncerMode = 'active' | 'combine';

/** A pane that can hand over its pending per-series update summaries. */
export interface UpdateSource {
	collectPendingUpdateSummaries(): string[];
}

/** Runtime settings of the shared region. */
export interface UpdateAnnouncerConfig {
	mode: UpdateAnnouncerMode;
	messages: AccessibilityMessages;
	debounceMs: number;
	maxSeries: number;
	lang?: string;
	onAnnounce?: (message: string) => void;
}

/**
 * A single chart-level polite live region shared by all per-pane
 * {@link AccessibilityPlugin} instances created by {@link addAccessibilityPlugin}.
 *
 * Each pane plugin keeps its own assertive region for navigation, but routing
 * every background *data-update* announcement through one region avoids the case
 * where several panes mutate their own polite regions in the same tick and a
 * screen reader only voices the last one.
 *
 * - `'active'` mode announces only the last-focused pane (falling back to pane 0).
 * - `'combine'` mode merges the changed series from every reporting pane into one
 *   message, in pane order.
 */
export class UpdateAnnouncer {
	private _region: HTMLElement | null;
	private _config: UpdateAnnouncerConfig;
	private readonly _sources: UpdateSource[] = [];
	private readonly _dirty = new Set<UpdateSource>();
	private _handle: ReturnType<typeof setTimeout> | null = null;
	private readonly _writer = new LiveRegionWriter(() => this._region);
	// The pane that was focused last. Tracked by identity, not by pane index –
	// indices shift when panes are added or removed.
	private _active: UpdateSource | null = null;

	public constructor(host: HTMLElement, config: UpdateAnnouncerConfig) {
		this._config = config;
		const region = createLiveRegion('lw-chart-a11y-shared-status-region', 'polite');
		if (config.lang) {
			region.setAttribute('lang', config.lang);
		}
		host.appendChild(region);
		this._region = region;
	}

	/** Registers a pane; registration order is pane order. */
	public register(source: UpdateSource): void {
		this._sources.push(source);
	}

	/** Keeps fallback selection and combined summaries in the current pane order. */
	public reorder(sources: readonly UpdateSource[]): void {
		this._sources.splice(0, this._sources.length, ...sources);
	}

	/**
	 * Drops a pane that is gone (its pane was removed from the chart). Clearing
	 * `_active` matters: in `'active'` mode a detached pane would otherwise stay
	 * the one being listened to and no pane would announce anything.
	 */
	public unregister(source: UpdateSource): void {
		const index = this._sources.indexOf(source);
		if (index >= 0) {
			this._sources.splice(index, 1);
		}
		this._dirty.delete(source);
		if (this._active === source) {
			this._active = null;
		}
	}

	public setActiveSource(source: UpdateSource): void {
		this._active = source;
	}

	/** Reconfigures the shared region at runtime (mode / messages / debounce / lang). */
	public configure(config: UpdateAnnouncerConfig): void {
		this._config = config;
		if (this._region) {
			if (config.lang) {
				this._region.setAttribute('lang', config.lang);
			} else {
				this._region.removeAttribute('lang');
			}
		}
	}

	public notifyDirty(source: UpdateSource): void {
		this._dirty.add(source);
		// Start-once (do not reset): a sub-debounce-interval stream still announces
		// periodically instead of having its timer pushed out indefinitely.
		if (this._handle === null) {
			this._handle = setTimeout(() => {
				this._handle = null;
				this._flush();
			}, this._config.debounceMs);
		}
	}

	public dispose(): void {
		if (this._handle !== null) {
			clearTimeout(this._handle);
			this._handle = null;
		}
		this._writer.dispose();
		this._region?.remove();
		this._region = null;
		this._sources.length = 0;
		this._dirty.clear();
		this._active = null;
	}

	private _flush(): void {
		const summaries: string[] = [];
		// Nothing focused yet falls back to the first registered pane (pane 0).
		const active = this._active ?? this._sources[0];
		// Iterate in registration (pane) order so the combined message is stable.
		for (const source of this._sources) {
			if (!this._dirty.has(source)) {
				continue;
			}
			// Always collect (and clear) the pane's pending summaries; keep them
			// only when combining or when this is the active pane.
			const pending = source.collectPendingUpdateSummaries();
			if (this._config.mode === 'combine' || source === active) {
				summaries.push(...pending);
			}
		}
		this._dirty.clear();
		const message = formatUpdateMessage(summaries, this._config.messages, this._config.maxSeries);
		if (this._region !== null && message.length > 0) {
			// The live region first: a host callback that throws must not cost
			// the screen-reader announcement this region exists for.
			this._writer.write(message);
			mirrorAnnouncement(this._config.onAnnounce, message);
		}
	}
}

/** What one pane's update tracker reads from the owning primitive. */
export interface PaneUpdatesHost {
	/** Whether updates are announced at all, and how they are coalesced. */
	config: () => { enabled: boolean; debounceMs: number; maxSeries: number; messages: AccessibilityMessages };
	/** The pane's series in pane order, so the summaries keep a stable order. */
	seriesOrder: () => readonly AnySeries[];
	/** One changed series' summary. */
	describe: (series: AnySeries) => string;
	/** Writes to this pane's own polite region (unused when a shared region took over). */
	write: (message: string) => void;
}

/**
 * The per-pane half of data-update announcing: a set of series whose data
 * changed, and – when this pane owns its polite region – the debounced flush
 * that turns them into one announcement.
 */
export class PaneUpdates implements UpdateSource {
	private readonly _host: PaneUpdatesHost;
	private readonly _dirty = new Set<AnySeries>();
	private _handle: ReturnType<typeof setTimeout> | null = null;

	public constructor(host: PaneUpdatesHost) {
		this._host = host;
	}

	public markDirty(series: AnySeries): void {
		this._dirty.add(series);
	}

	public forget(series: AnySeries): void {
		this._dirty.delete(series);
	}

	/** Debounced local flush, used when no chart-level shared region is in place. */
	public schedule(): void {
		if (this._handle !== null) {
			clearTimeout(this._handle);
		}
		this._handle = setTimeout(() => {
			this._handle = null;
			const { messages, maxSeries } = this._host.config();
			// collectPendingUpdateSummaries always clears the dirty set; the writer
			// no-ops when the region is gone or the message is empty.
			this._host.write(formatUpdateMessage(this.collectPendingUpdateSummaries(), messages, maxSeries));
		}, this._host.config().debounceMs);
	}

	/**
	 * Returns this pane's pending per-series summaries and clears the dirty set.
	 * Reached from the local flush above and, for the shared region, from
	 * {@link UpdateAnnouncer} via the internal PaneLink.
	 */
	public collectPendingUpdateSummaries(): string[] {
		if (!this._host.config().enabled || this._dirty.size === 0) {
			this._dirty.clear();
			return [];
		}
		const changed = this._host.seriesOrder().filter(series => this._dirty.has(series));
		this._dirty.clear();
		return changed.map(series => this._host.describe(series));
	}

	public dispose(): void {
		if (this._handle !== null) {
			clearTimeout(this._handle);
			this._handle = null;
		}
		this._dirty.clear();
	}
}

/**
 * Private channel between {@link AccessibilityPlugin}, {@link addAccessibilityPlugin}
 * and {@link UpdateAnnouncer}. Keeping this cross-object coordination in a
 * module-scoped WeakMap (rather than on the plugin class) means it never appears
 * on the public `AccessibilityPlugin` surface or in the generated typings.
 */
export interface PaneLink {
	attachAnnouncer(announcer: UpdateAnnouncer | null): void;
	attachController(hooks: ControllerHooks | null): void;
	readonly source: UpdateSource;
}

/** What a pane primitive reports back to {@link addAccessibilityPlugin}. */
export interface ControllerHooks {
	/** Called on every redraw: the controller checks the chart's panes cheaply. */
	sync: () => void;
	/** Called when the library detached this primitive (its pane was removed). */
	detached: () => void;
}

export const paneLinks = new WeakMap<object, PaneLink>();
