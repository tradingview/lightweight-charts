import { BoxOptions } from '../../model/box-options';
import { LineStyle } from '../../renderers/draw-line';

export const boxOptionsDefaults: BoxOptions = {
	lowPrice: 0.0,
	highPrice: 0.0,
	earlyTime: 0,
	lateTime: 0,
	borderColor: '#0FF',
	borderWidth: 1,
	borderStyle: LineStyle.Solid,
	fillColor: '#0FF',
	fillOpacity: 1,
	borderVisible: true,
	axisLabelVisible: false,
	title: '',
};
