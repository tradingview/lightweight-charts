import { HostAttributes } from './host-attributes';

/**
 * Hides every canvas of a chart – the panes' *and* the axes' – from assistive
 * technology, and keeps doing so as the library re-creates them (a price axis
 * canvas is rebuilt whenever the scale is recreated).
 *
 * This is the chart-level counterpart of the per-pane treatment: a single pane
 * primitive must not reach across the whole chart, so
 * {@link addAccessibilityPlugin} owns this pass and a directly attached
 * primitive only hides its own pane.
 */
export class ChartCanvases {
	private readonly _attributes = new HostAttributes();
	private _observer: MutationObserver | null = null;

	public constructor(table: HTMLElement) {
		this._attributes.hideCanvases(table);
		this._observer = new MutationObserver((mutations: MutationRecord[]) => {
			for (const mutation of mutations) {
				for (const node of Array.from(mutation.addedNodes)) {
					if (node instanceof HTMLElement) {
						this._attributes.hideCanvases(node);
					}
				}
			}
		});
		this._observer.observe(table, { childList: true, subtree: true });
	}

	public dispose(): void {
		// Stop observing before restoring, so our own restores are not re-swept.
		this._observer?.disconnect();
		this._observer = null;
		this._attributes.restore();
	}
}
