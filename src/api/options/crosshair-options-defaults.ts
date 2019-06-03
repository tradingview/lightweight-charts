import { CrosshairMode, CrosshairOptions } from '../../model/crosshair';
import { LineStyle } from '../../renderers/draw-line';

export const crosshairOptionsDefaults: CrosshairOptions = {
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
	mode: CrosshairMode.Magnet,
};
