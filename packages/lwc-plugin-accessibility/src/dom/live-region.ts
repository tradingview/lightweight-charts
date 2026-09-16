/** CSS applied to elements that should be available to assistive technology but invisible on screen. */
export const VISUALLY_HIDDEN =
	'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;';

/** Creates a visually hidden `aria-live` region. */
export function createLiveRegion(className: string, politeness: 'assertive' | 'polite'): HTMLElement {
	const region = document.createElement('div');
	region.className = className;
	region.setAttribute('aria-live', politeness);
	region.setAttribute('aria-atomic', 'true');
	region.style.cssText = VISUALLY_HIDDEN;
	return region;
}

/**
 * Writes messages to an `aria-live` element by clearing it and setting the text
 * on the next animation frame. Re-setting textContent across a frame boundary
 * forces assistive technology to re-announce even when the message is identical
 * to the previous one (e.g. Home pressed twice, or two equal update summaries);
 * a synchronous clear-and-set does not reliably do that.
 */
export class LiveRegionWriter {
	private readonly _region: () => HTMLElement | null;
	private _frame: ReturnType<typeof requestAnimationFrame> | null = null;

	public constructor(region: () => HTMLElement | null) {
		this._region = region;
	}

	public write(message: string): void {
		const region = this._region();
		if (!region || message.length === 0) {
			return;
		}
		region.textContent = '';
		if (this._frame !== null) {
			cancelAnimationFrame(this._frame);
		}
		this._frame = requestAnimationFrame(() => {
			this._frame = null;
			const target = this._region();
			if (target) {
				target.textContent = message;
			}
		});
	}

	/** Cancels a pending write (used at teardown). */
	public dispose(): void {
		if (this._frame !== null) {
			cancelAnimationFrame(this._frame);
			this._frame = null;
		}
	}
}
