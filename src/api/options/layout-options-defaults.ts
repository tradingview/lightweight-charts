import { defaultFontFamily } from '../../helpers/make-font';

import { ColorType, LayoutOptions } from '../../model/layout-options';

export const layoutOptionsDefaults: LayoutOptions = {
	background: {
		type: ColorType.Solid,
		color: '#FFFFFF',
	},
	textColor: '#191919',
	fontSize: 12,
	fontFamily: defaultFontFamily,
};
