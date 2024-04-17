export const enum DefaultPriceScaleId {
	Left = 'left',
	Right = 'right',
}

export function isDefaultPriceScale(priceScaleId: string): priceScaleId is DefaultPriceScaleId {
	return priceScaleId === DefaultPriceScaleId.Left || priceScaleId === DefaultPriceScaleId.Right;
}
