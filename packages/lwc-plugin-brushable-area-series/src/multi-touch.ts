import { IChartApi, Logical } from 'lightweight-charts';
import { Delegate, ISubscription } from '@tradingview/lwc-toolkit/delegate';

/**
 * One pointer or finger on the chart: where it is, and which logical index of
 * the time scale it sits on.
 */
export interface TouchPoint {
	/** Horizontal position within the pane, in CSS pixels. */
	x: number;
	/** Logical index of the time scale under the point. */
	index: Logical;
}

/** The pointers currently on the chart, in the order they were placed. */
export interface MultiTouchInteraction {
	points: TouchPoint[];
}

type UnSubscriber = () => void;

interface MouseState {
	dragging: boolean;
	start: TouchPoint | null;
}

/**
 * Normalises mouse drags and touch gestures on a chart into a list of points on
 * the time scale, so a plugin can treat "drag from A to B" and "two fingers at
 * A and B" as the same interaction.
 *
 * Trimmed from the `delta-tooltip` plugin example, which pioneered the pattern.
 */
export class MultiTouchChartEvents {
	private readonly _chart: IChartApi;
	private readonly _element: HTMLElement;
	private readonly _unsubscribers: UnSubscriber[] = [];
	private readonly _end: Delegate = new Delegate();
	private readonly _interaction: Delegate<MultiTouchInteraction> =
		new Delegate();

	private _mouseState: MouseState = { dragging: false, start: null };

	public constructor(chart: IChartApi) {
		this._chart = chart;
		this._element = chart.chartElement();
		this._add('mousedown', this._mouseDown);
		this._add('mousemove', this._mouseMove);
		this._add('mouseup', this._mouseUp);
		this._add('mouseleave', this._mouseLeave);
		this._add('touchstart', this._touchStart);
		this._add('touchmove', this._touchMove);
		this._add('touchend', this._touchFinish);
		this._add('touchcancel', this._touchFinish);
	}

	/** Removes every listener this object added. */
	public destroy(): void {
		this._end.destroy();
		this._interaction.destroy();
		this._unsubscribers.forEach((unsubscribe: UnSubscriber) => unsubscribe());
		this._unsubscribers.length = 0;
	}

	/** Fired when the button is released, the pointer leaves, or the last finger is lifted. */
	public end(): ISubscription {
		return this._end;
	}

	/** Fired for every move while a drag or a touch is in progress. */
	public move(): ISubscription<MultiTouchInteraction> {
		return this._interaction;
	}

	private _add<K extends keyof HTMLElementEventMap>(
		type: K,
		handler: (event: HTMLElementEventMap[K]) => void
	): void {
		this._element.addEventListener(type, handler);
		this._unsubscribers.push(() =>
			this._element.removeEventListener(type, handler)
		);
	}

	private _point(clientX: number): TouchPoint | null {
		const box = this._element.getBoundingClientRect();
		const x = clientX - box.left - this._chart.priceScale('left').width();
		if (x < 0 || x > this._chart.timeScale().width()) {
			return null;
		}
		const index = this._chart.timeScale().coordinateToLogical(x);
		return index === null ? null : { x, index };
	}

	private _mouseDown = (event: MouseEvent): void => {
		this._mouseState.start = this._point(event.clientX);
		this._mouseState.dragging = this._mouseState.start !== null;
	};

	private _mouseMove = (event: MouseEvent): void => {
		if (!this._mouseState.dragging) {
			return;
		}
		const points: TouchPoint[] = [];
		if (this._mouseState.start !== null) {
			points.push(this._mouseState.start);
		}
		const current = this._point(event.clientX);
		if (current !== null) {
			points.push(current);
		}
		this._interaction.fire({ points });
	};

	private _mouseUp = (): void => {
		this._mouseState = { dragging: false, start: null };
		this._end.fire();
	};

	private _mouseLeave = (): void => {
		this._mouseState = { dragging: false, start: null };
		this._end.fire();
	};

	private _touchStart = (event: TouchEvent): void => {
		event.preventDefault();
		const touch = event.targetTouches.item(0);
		this._mouseState.start = touch === null ? null : this._point(touch.clientX);
	};

	private _touchMove = (event: TouchEvent): void => {
		event.preventDefault();
		const points: TouchPoint[] = [];
		for (let i = 0; i < event.targetTouches.length; i++) {
			const touch = event.targetTouches.item(i);
			const point = touch === null ? null : this._point(touch.clientX);
			if (point !== null) {
				points.push(point);
			}
		}
		// One finger dragging is the same gesture as a mouse drag: the range runs
		// from where the finger landed to where it is now.
		if (points.length === 1 && this._mouseState.start !== null) {
			points.unshift(this._mouseState.start);
		}
		this._interaction.fire({ points });
	};

	private _touchFinish = (event: TouchEvent): void => {
		event.preventDefault();
		// Fired while fingers may still be down, going from two touches to one.
		if (event.targetTouches.length < 1) {
			this._mouseState.start = null;
			this._end.fire();
		}
	};
}
