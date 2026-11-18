import type { IRange } from 'lightweight-charts';

export type NavigatorAction = 'move' | 'from' | 'to';

/** Keep a logical range inside the overview without changing its width. */
export function clampRange(range: IRange<number>, lastIndex: number, minimumSpan: number): IRange<number> {
	const span = Math.min(lastIndex, Math.max(minimumSpan, range.to - range.from));
	const from = Math.max(0, Math.min(lastIndex - span, range.from));
	return { from, to: from + span };
}

/** Move the window or one edge, keeping the handles ordered and in bounds. */
export function changeRange(range: IRange<number>, action: NavigatorAction, delta: number, lastIndex: number, minimumSpan: number): IRange<number> {
	if (action === 'from') {
		return { from: Math.max(0, Math.min(range.to - minimumSpan, range.from + delta)), to: range.to };
	}
	if (action === 'to') {
		return { from: range.from, to: Math.min(lastIndex, Math.max(range.from + minimumSpan, range.to + delta)) };
	}
	return clampRange({ from: range.from + delta, to: range.to + delta }, lastIndex, minimumSpan);
}
