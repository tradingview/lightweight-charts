import { IChartApiBase, Time } from 'lightweight-charts';

import { extractValue } from './describe';
import { ValueAccessor } from './options';
import { AnySeries, SeriesDataPoint } from './types';

/** How the visible focus indicator and the pane's focus outline are drawn. */
export interface FocusRingStyle {
	color: string;
	size: number;
	highContrast: boolean;
}

/** Creates the (initially hidden) focus indicator element. */
export function createFocusRing(): HTMLElement {
	const element = document.createElement('div');
	element.className = 'lw-chart-a11y-focus-ring';
	return element;
}

export function styleFocusRing(element: HTMLElement, style: FocusRingStyle): void {
	// High contrast: a thicker ring with a white-then-black halo so it stands
	// out on any background. (box-shadow is dropped in forced-colors mode, where
	// the border itself still shows.)
	const ring = style.highContrast
		? [`border:3px solid ${style.color}`, 'box-shadow:0 0 0 2px #fff, 0 0 0 4px #000']
		: [`border:2px solid ${style.color}`, 'box-shadow:0 0 0 2px rgba(255,255,255,0.9)'];
	element.style.cssText = [
		'position:absolute',
		'box-sizing:border-box',
		`width:${style.size}px`,
		`height:${style.size}px`,
		'border-radius:50%',
		...ring,
		'transform:translate(-50%, -50%)',
		'pointer-events:none',
		'z-index:4',
		'display:none',
	].join(';');
}

/** Places the ring at a coordinate local to the pane's canvas wrapper. */
export function showFocusRingAt(element: HTMLElement, x: number, y: number): void {
	element.style.left = `${x}px`;
	element.style.top = `${y}px`;
	element.style.display = 'block';
}

export function hideFocusRing(element: HTMLElement): void {
	element.style.display = 'none';
}

/**
 * Where the ring belongs for the focused point, or `null` when it must be
 * hidden – a missing prerequisite (including "all series were removed") or a
 * point that is off-screen mid-scroll, so the ring never lingers at stale
 * coordinates. Coordinates are local to the pane's canvas wrapper, which is the
 * ring's positioning context.
 */
export function focusRingCoordinate(
	chart: IChartApiBase<Time> | null,
	series: AnySeries | null,
	point: SeriesDataPoint | undefined,
	visible: boolean,
	/** The `valueAccessor` option, so a custom series' points can be placed too. */
	accessor?: ValueAccessor
): { x: number; y: number } | null {
	const value = extractValue(point, series, accessor);
	if (!chart || !series || !point || value === undefined || !visible) {
		return null;
	}
	const x = chart.timeScale().timeToCoordinate(point.time);
	const y = series.priceToCoordinate(value);
	return x === null || y === null ? null : { x, y };
}

/** The outline drawn around the whole pane while its semantic layer has focus. */
export function styleFocusOutline(element: HTMLElement, style: FocusRingStyle, hasFocus: boolean): void {
	const width = style.highContrast ? 4 : 3;
	element.style.outline = hasFocus ? `${width}px solid ${style.color}` : 'none';
}
