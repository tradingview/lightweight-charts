import { PriceScaleMode, PriceScaleOptions } from '../../model/price-scale';

export const priceScaleOptionsDefaults: PriceScaleOptions = {
	autoScale: true,
	mode: PriceScaleMode.Normal,
	invertScale: false,
	alignLabels: true,
	borderVisible: true,
	borderColor: '#2B2B43',
	entireTextOnly: false,
	visible: false,
	scaleMargins: {
		bottom: 0.1,
		top: 0.2,
	},
};
