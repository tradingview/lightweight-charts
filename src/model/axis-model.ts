import { Delegate } from '../helpers/delegate';

import { Point } from '../model/point';
import { TouchMouseEventData } from '../model/touch-mouse-event-data';

import { AxisMouseEventParamsImpl, AxisMouseEventParamsImplSupplier, IAxisWidget } from './axis-widget';

/**
 * Represents a mouse event.
 */
export interface AxisMouseEventParams {
	/**
	 * Location of the event in the chart.
	 *
	 * The value will be `undefined` if the event is fired outside the chart, for example a mouse leave event.
	 */
	point?: Point;
	/**
	 * The underlying source mouse or touch event data, if available
	 */
	sourceEvent?: TouchMouseEventData;
}

/**
 * A custom function use to handle mouse events.
 */
export type AxisMouseEventHandler = (param: AxisMouseEventParams) => void;

export abstract class AxisApi {
	private readonly _clickedDelegate: Delegate<AxisMouseEventParams> =
		new Delegate();
	private readonly _movedDelegate: Delegate<AxisMouseEventParams> =
		new Delegate();

	protected _subscribeClick(handler: AxisMouseEventHandler): void {
		this._clickedDelegate.subscribe(handler);
	}

	protected _unsubscribeClick(handler: AxisMouseEventHandler): void {
		this._clickedDelegate.unsubscribe(handler);
	}

	protected _subscribeMouseMove(handler: AxisMouseEventHandler): void {
		this._movedDelegate.subscribe(handler);
	}

	protected _unsubscribeMouseMove(handler: AxisMouseEventHandler): void {
		this._movedDelegate.unsubscribe(handler);
	}

	protected _removeMouseEvents(widget: IAxisWidget): void {
		widget.clicked().unsubscribeAll(this);
		this._clickedDelegate.destroy();
		widget.mouseMoved().unsubscribeAll(this);
		this._movedDelegate.destroy();
	}

	protected _setupMouseEvents(widget: IAxisWidget): void {
		widget
			.clicked()
			.subscribe(
				(paramSupplier: AxisMouseEventParamsImplSupplier) => {
					if (this._clickedDelegate.hasListeners()) {
						this._clickedDelegate.fire(convertMouseParams(paramSupplier()));
					}
				},
				this
			);
		widget
			.mouseMoved()
			.subscribe(
				(paramSupplier: AxisMouseEventParamsImplSupplier) => {
					if (this._movedDelegate.hasListeners()) {
						this._movedDelegate.fire(convertMouseParams(paramSupplier()));
					}
				},
				this
			);
	}
}

function convertMouseParams(param: AxisMouseEventParamsImpl): AxisMouseEventParams {
	return {
		point: param.point,
		sourceEvent: param.touchMouseEventData,
	};
}
