/** Elements that can receive keyboard focus and so must be neutralised inside the hidden chart DOM. */
const FOCUSABLE_SELECTOR =
	'a[href],button,input,select,textarea,iframe,[tabindex],[contenteditable="true"],audio[controls],video[controls]';

interface SharedAttributeState {
	count: number;
	previousValue: string | null;
}

/**
 * Reference counts per element and attribute, so two plugins treating the same
 * shared node (e.g. the chart table) restore it only once both have detached.
 */
const presentationRoles = new WeakMap<HTMLElement, SharedAttributeState>();
const ariaHiddenStates = new WeakMap<HTMLElement, SharedAttributeState>();

function retain(
	states: WeakMap<HTMLElement, SharedAttributeState>,
	element: HTMLElement,
	attribute: string,
	value: string
): void {
	const state = states.get(element);
	if (state) {
		state.count += 1;
		return;
	}
	states.set(element, { count: 1, previousValue: element.getAttribute(attribute) });
	element.setAttribute(attribute, value);
}

function release(
	states: WeakMap<HTMLElement, SharedAttributeState>,
	element: HTMLElement,
	attribute: string
): void {
	const state = states.get(element);
	if (!state) {
		return;
	}
	state.count -= 1;
	if (state.count > 0) {
		return;
	}
	states.delete(element);
	if (state.previousValue === null) {
		element.removeAttribute(attribute);
	} else {
		element.setAttribute(attribute, state.previousValue);
	}
}

/**
 * Records every change the plugin makes to the host's own chart DOM – the
 * presentational table scaffolding, the `aria-hidden` canvases and the
 * neutralised focusable internals – so `restore()` leaves the DOM exactly as it
 * was found.
 */
export class HostAttributes {
	private _presented: HTMLElement[] = [];
	private _hiddenCanvases: HTMLElement[] = [];
	private _neutralised: [HTMLElement, string | null, string | null][] = [];

	/** Marks the chart table, the pane row and its cells as presentational. */
	public markStructurePresentational(paneElement: HTMLElement): void {
		const elements = [
			paneElement.closest('table'),
			paneElement,
			...Array.from(paneElement.children),
		].filter((element): element is HTMLElement => element instanceof HTMLElement);

		for (const element of elements) {
			retain(presentationRoles, element, 'role', 'presentation');
			this._presented.push(element);
		}
	}

	/** Hides `root`'s canvases (or `root` itself) from assistive technology. */
	public hideCanvases(root: HTMLElement): void {
		const targets = root instanceof HTMLCanvasElement
			? [root]
			: Array.from(root.querySelectorAll<HTMLElement>('canvas'));
		for (const element of targets) {
			if (this._hiddenCanvases.includes(element)) {
				continue;
			}
			retain(ariaHiddenStates, element, 'aria-hidden', 'true');
			this._hiddenCanvases.push(element);
		}
	}

	/**
	 * Takes every focusable descendant (e.g. the attribution link) out of the tab
	 * order and hides it – a focusable element inside an aria-hidden subtree is a
	 * WCAG failure.
	 */
	public neutraliseFocusables(root: HTMLElement): void {
		const descendants = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
		const targets = root.matches(FOCUSABLE_SELECTOR) ? [root, ...descendants] : descendants;
		for (const element of targets) {
			// Idempotent: re-sweeps (from the mutation observer) must not record
			// our own tabindex="-1" as the value to restore.
			if (this._neutralised.some(([neutralised]) => neutralised === element)) {
				continue;
			}
			this._neutralised.push([
				element,
				element.getAttribute('tabindex'),
				element.getAttribute('aria-hidden'),
			]);
			element.setAttribute('tabindex', '-1');
			element.setAttribute('aria-hidden', 'true');
		}
	}

	public restore(): void {
		for (const [element, previousTabIndex, previousAriaHidden] of this._neutralised) {
			if (previousTabIndex === null) {
				element.removeAttribute('tabindex');
			} else {
				element.setAttribute('tabindex', previousTabIndex);
			}
			if (previousAriaHidden === null) {
				element.removeAttribute('aria-hidden');
			} else {
				element.setAttribute('aria-hidden', previousAriaHidden);
			}
		}
		this._neutralised = [];
		for (const element of this._presented) {
			release(presentationRoles, element, 'role');
		}
		this._presented = [];
		for (const element of this._hiddenCanvases) {
			release(ariaHiddenStates, element, 'aria-hidden');
		}
		this._hiddenCanvases = [];
	}
}
