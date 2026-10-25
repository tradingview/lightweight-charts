import { Delegate } from '../helpers/delegate';

import {
	AxisMouseEventParamsImpl,
	AxisMouseEventParamsImplSupplier,
} from '../model/axis-widget';
import { Point } from '../model/point';

import { MouseEventHandlerEventBase } from './mouse-event-handler';

export function fireNullMouseDelegate(
	delegate: Delegate<AxisMouseEventParamsImplSupplier>
): void {
	if (delegate.hasListeners()) {
		delegate.fire(() => getAxisMouseEventParamsImpl(null, null));
	}
}

export function fireMouseDelegate(
	delegate: Delegate<AxisMouseEventParamsImplSupplier>,
	event: MouseEventHandlerEventBase
): void {
	const x = event.localX;
	const y = event.localY;
	if (delegate.hasListeners()) {
		delegate.fire(() => getAxisMouseEventParamsImpl({ x, y }, event));
	}
}

function getAxisMouseEventParamsImpl(
	point: Point | null,
	event: MouseEventHandlerEventBase | null
): AxisMouseEventParamsImpl {
	return {
		point: point ?? undefined,
		touchMouseEventData: event ?? undefined,
	};
}
