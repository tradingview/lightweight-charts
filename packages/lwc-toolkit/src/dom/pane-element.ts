import { IChartApiBase, IPaneApi, Time } from 'lightweight-charts';

/**
 * Structural check instead of `instanceof HTMLElement`, so these helpers also
 * work when the chart lives in another document or realm (an iframe, a popup
 * window), where `HTMLElement` is a different constructor.
 */
function isHtmlElement(node: unknown): node is HTMLElement {
	return (
		typeof node === 'object' &&
		node !== null &&
		'style' in node &&
		typeof (node as HTMLElement).querySelector === 'function'
	);
}

/**
 * The element inside a pane which shares the coordinate space of the pane's
 * canvases – the wrapper an overlay (a DOM legend, a focus ring, a tooltip)
 * should be appended to so that it lines up with what is drawn.
 *
 * Returns `null` while the pane has no HTML element yet: a freshly created pane
 * only gets one on the next redraw, so call `requestUpdate()` and retry.
 *
 * This depends on the DOM structure the library builds (a table row per pane,
 * whose main cell is the one with `position: relative`, wrapping the canvases in
 * a single child element) rather than on public API. It is deliberately the one
 * place in the toolkit that knows about it: if that structure ever changes, this
 * is the module to update.
 */
export function paneContentElement<T = Time>(pane: IPaneApi<T>): HTMLElement | null {
	const paneElement = pane.getHTMLElement();
	if (!isHtmlElement(paneElement)) {
		return null;
	}
	const cells = Array.from(paneElement.children).filter(isHtmlElement);
	// The pane row holds the (optional) left price-axis cell, the main pane cell
	// and the (optional) right price-axis cell. Every one of them can contain a
	// canvas, so "first cell with a canvas" would wrongly pick the left axis when
	// it is visible. The library only sets `position: relative` on the main pane
	// cell, so we key off that and fall back to the first canvas-bearing cell for
	// forward compatibility.
	const paneCell =
		cells.find((cell: HTMLElement) => cell.style.position === 'relative' && cell.querySelector('canvas') !== null) ??
		cells.find((cell: HTMLElement) => cell.querySelector('canvas') !== null);
	if (paneCell === undefined) {
		return null;
	}
	return isHtmlElement(paneCell.firstElementChild) ? paneCell.firstElementChild : paneCell;
}

/**
 * The `table` element the chart is laid out in – the common ancestor of every
 * pane row, the axes and the attribution link. Useful for chart-wide DOM work
 * (a shared overlay, attributes applied to every canvas at once).
 *
 * Returns `null` before the chart has built its panes. Like
 * {@link paneContentElement}, this reads the library's DOM structure, so both
 * live here together.
 */
export function chartTableElement<T = Time>(chart: IChartApiBase<T>): HTMLElement | null {
	for (const pane of chart.panes()) {
		const paneElement = pane.getHTMLElement();
		if (!isHtmlElement(paneElement)) {
			continue;
		}
		const table = paneElement.closest('table');
		if (isHtmlElement(table)) {
			return table;
		}
	}
	return null;
}
