import { Coordinate, IChartApi, Logical } from 'lightweight-charts';
import { Delegate, ISubscription } from '../../helpers/delegate';

export interface TouchPoint {
	x: number;
	index: Logical;
	y: Coordinate;
}

export interface MultiTouchInteraction {
	points: TouchPoint[];
}

interface MouseState {
	drawing: boolean;
	startLogical: number | null;
	startCoordinate: number | null;
	startX: number | null;
}

function determineChartX(
	chartElement: HTMLDivElement,
	chart: IChartApi,
	mouseX: number
): number | null {
	const chartBox = chartElement.getBoundingClientRect();
	const x = mouseX - chartBox.left - chart.priceScale('left').width();
	if (x < 0 || x > chart.timeScale().width()) return null;
	return x;
}

function determinePaneXLogical(
	chart: IChartApi,
	x: number | null
): Logical | null {
	if (x === null) return null;
	return chart.timeScale().coordinateToLogical(x);
}

function determineYPosition(
	chartElement: HTMLDivElement,
	clientY: number
): Coordinate {
	const chartContainerBox = chartElement.getBoundingClientRect();
	return (clientY - chartContainerBox.y) as Coordinate;
}

interface MultiTouchChartOptions {
	simulateMultiTouchUsingMouseDrag: boolean;
}

type UnSubscriber = () => void;

export class MultiTouchChartEvents {
	_chartElement: HTMLDivElement;
	_chart: IChartApi;
	_options: MultiTouchChartOptions;

	_mouseState: MouseState = {
		drawing: false,
		startLogical: null,
		startCoordinate: null,
		startX: null,
	};

	private _touchLeave: Delegate = new Delegate();
	private _touchInteraction: Delegate<MultiTouchInteraction> = new Delegate();

	_unSubscribers: UnSubscriber[] = [];

	constructor(chart: IChartApi, options: MultiTouchChartOptions) {
		this._options = options;
		this._chart = chart;
		this._chartElement = chart.chartElement();
		this._addMouseEventListener(
			this._chartElement,
			'mouseleave',
			this._mouseLeave
		);
		this._addMouseEventListener(
			this._chartElement,
			'mousemove',
			this._mouseMove
		);
		this._addMouseEventListener(
			this._chartElement,
			'mousedown',
			this._mouseDown
		);
		this._addMouseEventListener(this._chartElement, 'mouseup', this._mouseUp);
		this._addTouchEventListener(
			this._chartElement,
			'touchstart',
			this._touchOther
		);
		this._addTouchEventListener(
			this._chartElement,
			'touchmove',
			this._touchMove
		);
		this._addTouchEventListener(
			this._chartElement,
			'touchcancel',
			this._touchFinish
		);
		this._addTouchEventListener(
			this._chartElement,
			'touchend',
			this._touchFinish
		);
	}

	destroy() {
		this._touchLeave.destroy();
		this._touchInteraction.destroy();
		this._unSubscribers.forEach(unSub => {
			unSub();
		});
		this._unSubscribers = [];
	}

	public leave(): ISubscription {
		return this._touchLeave;
	}

	public move(): ISubscription<MultiTouchInteraction> {
		return this._touchInteraction;
	}

	_addMouseEventListener(
		target: HTMLDivElement,
		eventType: 'mouseleave' | 'mousemove' | 'mousedown' | 'mouseup',
		handler: (event: MouseEvent) => void
	): void {
		const boundMouseMoveHandler = handler.bind(this);
		target.addEventListener(eventType, boundMouseMoveHandler);
		const unSubscriber = () => {
			target.removeEventListener(eventType, boundMouseMoveHandler);
		};
		this._unSubscribers.push(unSubscriber);
	}

	_addTouchEventListener(
		target: HTMLDivElement,
		eventType: 'touchstart' | 'touchend' | 'touchmove' | 'touchcancel',
		handler: (event: TouchEvent) => void
	): void {
		const boundMouseMoveHandler = handler.bind(this);
		target.addEventListener(eventType, boundMouseMoveHandler);
		const unSubscriber = () => {
			target.removeEventListener(eventType, boundMouseMoveHandler);
		};
		this._unSubscribers.push(unSubscriber);
	}

	_mouseLeave() {
		this._mouseState.drawing = false;
		this._touchLeave.fire();
	}
	_mouseMove(event: MouseEvent) {
		const chartX = determineChartX(
			this._chartElement,
			this._chart,
			event.clientX
		);
		const logical = determinePaneXLogical(this._chart, chartX);
		const coordinate = determineYPosition(this._chartElement, event.clientY);

		const points: TouchPoint[] = [];
		if (
			this._options.simulateMultiTouchUsingMouseDrag &&
			this._mouseState.drawing &&
			this._mouseState.startLogical !== null &&
			this._mouseState.startCoordinate !== null &&
			this._mouseState.startX !== null
		) {
			points.push({
				x: this._mouseState.startX,
				index: this._mouseState.startLogical as Logical,
				y: this._mouseState.startCoordinate as Coordinate,
			});
		}

		if (logical !== null && coordinate !== null && chartX !== null) {
			points.push({
				x: chartX,
				index: logical,
				y: coordinate,
			});
		}

		const interaction: MultiTouchInteraction = {
			points,
		};
		this._touchInteraction.fire(interaction);
	}
	_mouseDown(event: MouseEvent) {
		this._mouseState.startX = determineChartX(
			this._chartElement,
			this._chart,
			event.clientX
		);
		this._mouseState.startLogical = determinePaneXLogical(
			this._chart,
			this._mouseState.startX
		);
		this._mouseState.startCoordinate = determineYPosition(
			this._chartElement,
			event.clientY
		);
		this._mouseState.drawing =
			this._mouseState.startLogical !== null &&
			this._mouseState.startCoordinate !== null;
	}
	_mouseUp() {
		this._mouseState.drawing = false;
	}

	_touchMove(event: TouchEvent) {
		event.preventDefault();
		const points: TouchPoint[] = [];
		for (let i = 0; i < event.targetTouches.length; i++) {
			const touch = event.targetTouches.item(i);
			if (touch !== null) {
				const chartX = determineChartX(
					this._chartElement,
					this._chart,
					touch.clientX
				);
				const logical = determinePaneXLogical(this._chart, chartX);
				const y = determineYPosition(this._chartElement, touch.clientY);
				if (chartX !== null && y !== null && logical !== null) {
					points.push({
						x: chartX,
						index: logical,
						y,
					});
				}
			}
		}
		const interaction: MultiTouchInteraction = {
			points,
		};
		this._touchInteraction.fire(interaction);
	}
	_touchFinish(event: TouchEvent) {
		event.preventDefault();
		// might be fired while some touch points are still active (eg. two fingers to one finger)
		if (event.targetTouches.length < 1) {
			this._touchLeave.fire();
			return;
		}
	}
	_touchOther(event: TouchEvent) {
		event.preventDefault();
	}
}
