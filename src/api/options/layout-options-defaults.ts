import { defaultFontFamily } from '../../helpers/make-font';

import { ColorType, LayoutOptionsInternal } from '../../model/layout-options';

export const layoutOptionsDefaults: LayoutOptionsInternal = {
	background: {
		type: ColorType.Solid,
		color: '#FFFFFF',
	},
	textColor: '#191919',
	fontSize: 11,
	fontFamily: defaultFontFamily,
};
