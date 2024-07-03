import { isChrome } from './browsers';

export function preventScrollByWheelClick(el: HTMLElement): void {
	if (!isChrome()) {
		return;
	}

	el.addEventListener('mousedown', (e: MouseEvent) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (e.button === MouseEventButton.Middle) {
			// prevent incorrect scrolling event
			e.preventDefault();
			return false;
		}
		return undefined;
	});
}

