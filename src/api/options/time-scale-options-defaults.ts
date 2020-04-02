import { defaultTickMarkFormatter } from '../../model/default-tick-mark-formatter';
import { TimeScaleOptions } from '../../model/time-scale';

export const timeScaleOptionsDefaults: TimeScaleOptions = {
	rightOffset: 0,
	barSpacing: 6,
	fixLeftEdge: false,
	lockVisibleTimeRangeOnResize: false,
	rightBarStaysOnScroll: false,
	borderVisible: true,
	borderColor: '#2B2B43',
	visible: true,
	timeVisible: false,
	secondsVisible: true,
	tickMarkFormatter: defaultTickMarkFormatter,
};
