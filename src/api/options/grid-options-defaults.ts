import { GridOptions } from '../../model/grid';
import { LineStyle } from '../../renderers/line-types';

export const gridOptionsDefaults: GridOptions = {
	vertLines: {
		color: '#D6DCDE',
		style: LineStyle.Solid,
		visible: true,
	},
	horzLines: {
		color: '#D6DCDE',
		style: LineStyle.Solid,
		visible: true,
	},
};
