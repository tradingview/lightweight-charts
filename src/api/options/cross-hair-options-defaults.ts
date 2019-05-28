import { CrossHairMode, CrossHairOptions } from '../../model/cross-hair';
import { LineStyle } from '../../renderers/draw-line';

export const crossHairOptionsDefaults: CrossHairOptions = {
	vertLine: {
		color: '#758696',
		width: 1,
		style: LineStyle.Dashed,
		visible: true,
		labelVisible: true,
	},
	horzLine: {
		color: '#758696',
		width: 1,
		style: LineStyle.Dashed,
		visible: true,
		labelVisible: true,
	},
	mode: CrossHairMode.Magnet,
};
