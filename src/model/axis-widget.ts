import { ISubscription } from '../helpers/isubscription';

import { Point } from './point';
import { TouchMouseEventData } from './touch-mouse-event-data';

export interface IAxisWidget {
	clicked(): ISubscription<AxisMouseEventParamsImplSupplier>;
	mouseMoved(): ISubscription<AxisMouseEventParamsImplSupplier>;
}

export interface AxisMouseEventParamsImpl {
	point?: Point;
	hoveredObject?: string;
	touchMouseEventData?: TouchMouseEventData;
}

export type AxisMouseEventParamsImplSupplier = () => AxisMouseEventParamsImpl;
