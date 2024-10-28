import { GridOptions } from '../../model/grid';
import { LineStyle } from '../../renderers/draw-line';

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
