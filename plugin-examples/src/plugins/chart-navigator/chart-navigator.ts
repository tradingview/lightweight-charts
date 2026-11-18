import type { IChartApi, IRange, Logical } from 'lightweight-charts';

import { changeRange, clampRange, NavigatorAction } from './range';

/**
 * A DOM overlay for an overview chart. Both charts must use the same ordered
 * time points. Call remove() before removing either chart.
 */
export class ChartNavigator {
	private readonly _main: IChartApi;
	private readonly _overview: IChartApi;
	private readonly _lastIndex: number;
	private readonly _root: HTMLDivElement;
	private readonly _window: HTMLDivElement;
	private readonly _from: HTMLDivElement;
	private readonly _to: HTMLDivElement;
	private readonly _resizeObserver: ResizeObserver;
	private readonly _events: AbortController = new AbortController();
	private _drag: { pointerId: number; logical: number; range: IRange<number>; action: NavigatorAction } | null = null;

	public constructor(main: IChartApi, overview: IChartApi, container: HTMLElement, pointCount: number) {
		if (!Number.isInteger(pointCount) || pointCount < 2) {
			throw new Error('The navigator requires at least two shared time points');
		}
		this._main = main;
		this._overview = overview;
		this._lastIndex = pointCount - 1;
		this._root = document.createElement('div');
		this._root.className = 'chart-navigator';
		this._root.setAttribute('aria-label', 'Chart navigator');
		this._window = this._control('move', 'Move selected range', 'slider');
		this._from = this._control('from', 'Start of selected range', 'slider');
		this._to = this._control('to', 'End of selected range', 'slider');
		container.appendChild(this._root);
		const options = { signal: this._events.signal };
		this._root.addEventListener('pointerdown', this._pointerDown, options);
		this._root.addEventListener('pointermove', this._pointerMove, options);
		this._root.addEventListener('pointerup', this._pointerEnd, options);
		this._root.addEventListener('pointercancel', this._pointerEnd, options);
		this._root.addEventListener('lostpointercapture', this._pointerEnd, options);
		this._root.addEventListener('keydown', this._keyDown, options);
		main.timeScale().subscribeVisibleLogicalRangeChange(this._render);
		overview.timeScale().subscribeSizeChange(this._resize);
		this._resizeObserver = new ResizeObserver(this._resize);
		this._resizeObserver.observe(container);
		overview.timeScale().subscribeVisibleLogicalRangeChange(this._render);
		this._resize();
	}

	public remove(): void {
		this._events.abort();
		this._resizeObserver.disconnect();
		this._main.timeScale().unsubscribeVisibleLogicalRangeChange(this._render);
		this._overview.timeScale().unsubscribeSizeChange(this._resize);
		this._overview.timeScale().unsubscribeVisibleLogicalRangeChange(this._render);
		this._drag = null;
		this._root.remove();
	}

	private _control(action: NavigatorAction, label: string, role: string): HTMLDivElement {
		const element = document.createElement('div');
		element.className = `chart-navigator-${action}`;
		element.dataset.action = action;
		element.tabIndex = 0;
		element.setAttribute('role', role);
		element.setAttribute('aria-label', label);
		if (role === 'slider') {
			element.setAttribute('aria-orientation', 'horizontal');
			element.setAttribute('aria-valuemin', '0');
			element.setAttribute('aria-valuemax', String(this._lastIndex));
		}
		this._root.appendChild(element);
		return element;
	}

	private _coordinates(): { origin: number; spacing: number } | null {
		// Public coordinate conversion on this library version accepts integer
		// indexes only. Interpolate between two integer anchors for fractional
		// visible ranges rather than passing a fractional index to that API.
		const scale = this._overview.timeScale();
		const origin = scale.logicalToCoordinate(0 as Logical);
		const next = scale.logicalToCoordinate(1 as Logical);
		return origin === null || next === null || next <= origin ? null : { origin, spacing: next - origin };
	}

	private _logical(clientX: number): number | null {
		const coordinates = this._coordinates();
		const x = clientX - this._root.getBoundingClientRect().left;
		return coordinates === null ? null : (x - coordinates.origin) / coordinates.spacing;
	}

	private _range(): IRange<number> | null {
		const range = this._main.timeScale().getVisibleLogicalRange();
		return range === null ? null : clampRange(range, this._lastIndex, 1);
	}

	private _set(range: IRange<number>): void {
		this._main.timeScale().setVisibleLogicalRange(range);
	}

	private _pointerDown = (event: PointerEvent): void => {
		if (event.button !== 0 || this._drag !== null) {
			return;
		}
		const range = this._range();
		const logical = this._logical(event.clientX);
		if (range === null || logical === null) {
			return;
		}
		event.preventDefault();
		const target = event.target;
		const action = target instanceof HTMLElement ? target.dataset.action : undefined;
		if (action !== 'move' && action !== 'from' && action !== 'to') {
			const span = range.to - range.from;
			this._set(clampRange({ from: logical - span / 2, to: logical + span / 2 }, this._lastIndex, 1));
			return;
		}
		if (target instanceof HTMLElement) {
			target.focus();
		}
		this._drag = { pointerId: event.pointerId, logical, range, action };
		this._root.setPointerCapture(event.pointerId);
	};

	private _pointerMove = (event: PointerEvent): void => {
		const drag = this._drag;
		if (drag === null || event.pointerId !== drag.pointerId) {
			return;
		}
		const logical = this._logical(event.clientX);
		if (logical !== null) {
			this._set(changeRange(drag.range, drag.action, logical - drag.logical, this._lastIndex, 1));
		}
	};

	private _pointerEnd = (event: PointerEvent): void => {
		if (this._drag?.pointerId === event.pointerId) {
			this._drag = null;
			if (this._root.hasPointerCapture(event.pointerId)) {
				this._root.releasePointerCapture(event.pointerId);
			}
		}
	};

	private _keyDown = (event: KeyboardEvent): void => {
		const range = this._range();
		const target = event.target;
		const action = target instanceof HTMLElement ? target.dataset.action : undefined;
		if (range === null || (action !== 'move' && action !== 'from' && action !== 'to')) {
			return;
		}
		if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			this._set(changeRange(range, action, event.key === 'Home' ? -this._lastIndex : this._lastIndex, this._lastIndex, 1));
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			const step = event.shiftKey ? 10 : 1;
			this._set(changeRange(range, action, event.key === 'ArrowLeft' ? -step : step, this._lastIndex, 1));
		}
	};

	private _resize = (): void => {
		this._overview.timeScale().fitContent();
		this._render();
	};

	private _render = (): void => {
		const scale = this._overview.timeScale();
		const range = this._range();
		const coordinates = this._coordinates();
		const from = range === null || coordinates === null ? null : coordinates.origin + range.from * coordinates.spacing;
		const to = range === null || coordinates === null ? null : coordinates.origin + range.to * coordinates.spacing;
		this._root.hidden = from === null || to === null;
		if (from === null || to === null || range === null) {
			return;
		}
		this._root.style.left = `${this._overview.priceScale('left').width()}px`;
		this._root.style.width = `${scale.width()}px`;
		this._root.style.height = `${this._overview.panes()[0].getHeight()}px`;
		this._root.classList.toggle('chart-navigator-compact', to - from < 32);
		this._window.style.left = `${from}px`;
		this._window.style.width = `${to - from}px`;
		this._from.style.left = `${from}px`;
		this._to.style.left = `${to}px`;
		const halfSpan = (range.to - range.from) / 2;
		this._window.setAttribute('aria-valuemin', String(halfSpan));
		this._window.setAttribute('aria-valuemax', String(this._lastIndex - halfSpan));
		this._window.setAttribute('aria-valuenow', String((range.from + range.to) / 2));
		this._window.setAttribute('aria-valuetext', `Bars ${Math.round(range.from)} to ${Math.round(range.to)}`);
		this._from.setAttribute('aria-valuemax', String(range.to - 1));
		this._to.setAttribute('aria-valuemin', String(range.from + 1));
		this._from.setAttribute('aria-valuenow', String(range.from));
		this._to.setAttribute('aria-valuenow', String(range.to));
	};
}
