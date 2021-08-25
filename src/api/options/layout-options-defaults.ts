import { defaultFontFamily } from '../../helpers/make-font';

import { ColorType, LayoutOptions } from '../../model/layout-options';

export const layoutOptionsDefaults: LayoutOptions = {
	backgroundType: ColorType.Solid,
	backgroundColor: '#FFFFFF',
	backgroundGradientStartColor: '#FFFFFF',
	backgroundGradientEndColor: '#FFFFFF',
	textColor: '#191919',
	fontSize: 11,
	fontFamily: defaultFontFamily,
};
