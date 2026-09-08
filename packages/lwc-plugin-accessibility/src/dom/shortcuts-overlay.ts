import { AccessibilityMessages } from '../messages';

/** What the overlay should currently show. */
export interface ShortcutsOverlayState {
	/** The `showShortcuts` option. */
	enabled: boolean;
	hasFocus: boolean;
	open: boolean;
	highContrast: boolean;
}

/**
 * The visible keyboard-shortcuts overlay: a "Press H" hint shown while the pane
 * is focused, and an `H`-toggled panel listing the controls. Always built but
 * only shown when {@link AccessibilityPaneOptions.showShortcuts} is set;
 * `aria-hidden` because screen-reader users get the spoken `H` help instead.
 */
export class ShortcutsOverlay {
	private readonly _hint: HTMLElement;
	private readonly _panel: HTMLElement;

	public constructor(host: HTMLElement) {
		this._hint = document.createElement('div');
		this._hint.className = 'lw-chart-a11y-shortcuts-hint';
		this._hint.setAttribute('aria-hidden', 'true');
		host.appendChild(this._hint);

		this._panel = document.createElement('div');
		this._panel.className = 'lw-chart-a11y-shortcuts-panel';
		this._panel.setAttribute('aria-hidden', 'true');
		host.appendChild(this._panel);
	}

	/** (Re)builds the hint and panel text from the current messages. */
	public render(messages: AccessibilityMessages, args: { multiSeries: boolean; pageStep: number }): void {
		this._hint.textContent = messages.shortcutsHint;
		this._panel.textContent = '';
		const title = document.createElement('div');
		title.textContent = messages.shortcutsTitle;
		title.style.cssText = 'font-weight:600;margin-bottom:6px;';
		this._panel.appendChild(title);
		for (const { keys, action } of messages.shortcuts(args)) {
			const row = document.createElement('div');
			row.style.cssText = 'display:flex;gap:10px;align-items:baseline;margin-top:3px;';
			const keyEl = document.createElement('kbd');
			keyEl.textContent = keys;
			// `currentColor` keeps the key border in step with the (contrast-aware) text colour.
			keyEl.style.cssText = 'flex:0 0 auto;border:1px solid currentColor;border-radius:3px;padding:0 5px;font-family:monospace;white-space:nowrap;';
			const actionEl = document.createElement('span');
			actionEl.textContent = action;
			row.appendChild(keyEl);
			row.appendChild(actionEl);
			this._panel.appendChild(row);
		}
	}

	/** Positions / shows / hides the overlay and applies the contrast palette. */
	public style(state: ShortcutsOverlayState): void {
		const base = 'position:absolute;z-index:6;color:#fff;font-size:0.8125rem;line-height:1.45;pointer-events:none;';
		const surface = state.highContrast
			? 'background:#000;border:2px solid #fff;'
			: 'background:rgba(20,24,28,0.9);border:1px solid rgba(255,255,255,0.25);';
		const hintVisible = state.enabled && state.hasFocus && !state.open;
		this._hint.style.cssText = base + surface +
			'left:8px;bottom:8px;padding:3px 8px;border-radius:4px;white-space:nowrap;' +
			(hintVisible ? '' : 'display:none;');
		const panelVisible = state.enabled && state.open;
		this._panel.style.cssText = base + surface +
			'left:8px;top:8px;max-width:calc(100% - 16px);padding:8px 11px;border-radius:6px;' +
			(state.highContrast ? '' : 'box-shadow:0 2px 10px rgba(0,0,0,0.45);') +
			(panelVisible ? '' : 'display:none;');
	}
}
