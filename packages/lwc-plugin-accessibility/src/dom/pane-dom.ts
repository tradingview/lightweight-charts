import { DataTable } from '../data-table';
import {
	FocusRingStyle,
	createFocusRing,
	hideFocusRing,
	showFocusRingAt,
	styleFocusOutline,
	styleFocusRing,
} from '../focus-ring';
import { AccessibilityMessages } from '../messages';

import { HostAttributes } from './host-attributes';
import { LiveRegionWriter, VISUALLY_HIDDEN, createLiveRegion } from './live-region';
import { ShortcutsOverlay } from './shortcuts-overlay';

/** Source of unique ids for the per-pane `aria-describedby` target. */
let descriptionIdCounter = 0;

/** Sets (or clears) the BCP-47 `lang` attribute on an announced region. */
function applyLang(element: HTMLElement | null, lang: string | undefined): void {
	if (!element) {
		return;
	}
	if (lang) {
		element.setAttribute('lang', lang);
	} else {
		element.removeAttribute('lang');
	}
}

/** Everything the injected DOM shows; rebuilt by the primitive on every change. */
export interface PaneLayerView {
	roleDescription: string;
	/** Accessible name of the pane region. */
	label: string;
	/** Visually hidden description read after the name on focus. */
	description: string;
	/** BCP-47 tag for the announced regions, or `undefined` to clear it. */
	lang: string | undefined;
	/**
	 * Writing direction of the host page. The library forces `direction: ltr` on
	 * the chart element, so the layer has to opt back in for the plugin's panels
	 * to sit on the leading side of a right-to-left page.
	 */
	direction: 'ltr' | 'rtl';
	focusRing: FocusRingStyle;
	hasFocus: boolean;
	shortcutsEnabled: boolean;
	shortcutsOpen: boolean;
	multiSeries: boolean;
	pageStep: number;
	messages: AccessibilityMessages;
}

/**
 * The DOM one pane's accessibility layer owns: the focusable semantic overlay
 * with its description and live regions, the focus ring and the optional
 * shortcuts overlay, plus every change made to the host's own chart DOM so
 * {@link remove} can put it back exactly as it was found.
 */
export class PaneLayer {
	public readonly container: HTMLElement;
	/** The pane's canvas wrapper the layer lives in – the pointer target for the pane. */
	public host: HTMLElement;
	public readonly liveWriter: LiveRegionWriter;
	public readonly statusWriter: LiveRegionWriter;
	public readonly table: DataTable;

	private readonly _description: HTMLElement;
	private readonly _liveRegion: HTMLElement;
	private _statusRegion: HTMLElement | null = null;
	private readonly _focusRing: HTMLElement;
	private readonly _shortcuts: ShortcutsOverlay;
	private readonly _hostAttributes = new HostAttributes();
	private _observer: MutationObserver | null = null;

	/**
	 * @param paneElement - the pane's row in the chart table.
	 * @param paneContent - the canvas wrapper the layer is appended to.
	 * @param withStatusRegion - whether this pane owns its own polite region (it
	 * does not when a chart-level shared region is already in place).
	 */
	public constructor(
		paneElement: HTMLElement,
		paneContent: HTMLElement,
		view: PaneLayerView,
		withStatusRegion: boolean
	) {
		this._hostAttributes.markStructurePresentational(paneElement);
		// Hide this pane's canvas(es) from assistive technology and take any
		// focusable descendant (e.g. the attribution link) out of the tab order –
		// a focusable element inside an aria-hidden subtree is a WCAG failure.
		// Canvases outside the pane (the axes, other panes) are the controller's
		// job: a single pane primitive must not reach across the whole chart.
		this._hostAttributes.hideCanvases(paneElement);
		this._hostAttributes.neutraliseFocusables(paneElement);
		this.host = paneContent;

		const layer = document.createElement('div');
		layer.className = 'lw-chart-a11y-layer';
		layer.tabIndex = 0;
		// `application` role lets screen readers forward arrow keys to our handler
		// instead of using them for virtual cursor navigation.
		layer.setAttribute('role', 'application');
		layer.style.cssText = [
			'position:absolute',
			'inset:0',
			'outline:none',
			'outline-offset:-3px',
			'pointer-events:none',
			'z-index:5',
		].join(';');
		paneContent.appendChild(layer);
		this.container = layer;

		// A visually-hidden description gives the application real content – so a
		// screen reader doesn't report the region as "empty" – and is read after the
		// name on focus via aria-describedby.
		this._description = document.createElement('div');
		this._description.id = `lw-chart-a11y-desc-${++descriptionIdCounter}`;
		this._description.className = 'lw-chart-a11y-description';
		this._description.style.cssText = VISUALLY_HIDDEN;
		layer.setAttribute('aria-describedby', this._description.id);
		layer.appendChild(this._description);

		// Assertive: announces the focused point / series change immediately in
		// response to a key press. (Not `role="status"`, which would imply the
		// contradictory `aria-live="polite"`.)
		this._liveRegion = createLiveRegion('lw-chart-a11y-live-region', 'assertive');
		layer.appendChild(this._liveRegion);
		if (withStatusRegion) {
			this._statusRegion = createLiveRegion('lw-chart-a11y-status-region', 'polite');
			layer.appendChild(this._statusRegion);
		}

		this._focusRing = createFocusRing();
		layer.appendChild(this._focusRing);
		this._shortcuts = new ShortcutsOverlay(layer);
		this.table = new DataTable(layer);

		this.liveWriter = new LiveRegionWriter(() => this._liveRegion);
		this.statusWriter = new LiveRegionWriter(() => this._statusRegion);

		this.render(view);
		this._watchForRecreatedElements(paneElement);
	}

	/** Applies the current view to every node: text, `lang`, focus styling, overlay. */
	public render(view: PaneLayerView): void {
		this.container.style.direction = view.direction;
		this.container.setAttribute('aria-roledescription', view.roleDescription);
		this.container.setAttribute('aria-label', view.label);
		this._description.textContent = view.description;
		applyLang(this.container, view.lang);
		applyLang(this._liveRegion, view.lang);
		applyLang(this._statusRegion, view.lang);
		styleFocusRing(this._focusRing, view.focusRing);
		styleFocusOutline(this.container, view.focusRing, view.hasFocus);
		this._shortcuts.render(view.messages, { multiSeries: view.multiSeries, pageStep: view.pageStep });
		this._shortcuts.style({
			enabled: view.shortcutsEnabled,
			hasFocus: view.hasFocus,
			open: view.shortcutsOpen,
			highContrast: view.focusRing.highContrast,
		});
		this.table.restyle(view.focusRing.highContrast);
	}

	/** Places the focus ring at a coordinate local to the pane's canvas wrapper. */
	public showRingAt(x: number, y: number): void {
		showFocusRingAt(this._focusRing, x, y);
	}

	public hideRing(): void {
		hideFocusRing(this._focusRing);
	}

	/** Drops this pane's polite region once a chart-level shared one takes over. */
	public dropStatusRegion(): void {
		this._statusRegion?.remove();
		this._statusRegion = null;
	}

	/** Rehosts the layer after a pane move without rebuilding its semantic content. */
	public moveTo(paneElement: HTMLElement, paneContent: HTMLElement): void {
		const focused = this.container.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
		this._observer?.disconnect();
		this._hostAttributes.restore();
		this._hostAttributes.markStructurePresentational(paneElement);
		this._hostAttributes.hideCanvases(paneElement);
		this._hostAttributes.neutraliseFocusables(paneElement);
		this.host = paneContent;
		paneContent.appendChild(this.container);
		this._watchForRecreatedElements(paneElement);
		focused?.focus({ preventScroll: true });
	}

	/** Removes the injected DOM and restores every host attribute we changed. */
	public remove(): void {
		this.liveWriter.dispose();
		this.statusWriter.dispose();
		this.table.remove();
		this.container.remove();
		// Stop observing before restoring, so our own restores are not re-swept.
		this._observer?.disconnect();
		this._observer = null;
		this._hostAttributes.restore();
	}

	/**
	 * The library re-creates parts of the pane DOM after we attach – e.g. the
	 * attribution link is rebuilt whenever the layout theme changes – which would
	 * put a fresh focusable element back into the tab order inside our
	 * presentational subtree, and fresh canvases back into the accessibility
	 * tree. Watch this pane's row and re-apply the treatment to anything that
	 * reappears.
	 */
	private _watchForRecreatedElements(paneElement: HTMLElement): void {
		this._observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of Array.from(mutation.addedNodes)) {
					if (!(node instanceof HTMLElement) || this.container.contains(node)) {
						continue;
					}
					this._hostAttributes.neutraliseFocusables(node);
					this._hostAttributes.hideCanvases(node);
				}
			}
		});
		this._observer.observe(paneElement, { childList: true, subtree: true });
	}
}
