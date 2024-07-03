export const enum DefaultPriceScaleId {
	Left = 'left',
	Right = 'right',
}

export function isDefaultPriceScale(priceScaleId: string): priceScaleId is DefaultPriceScaleId {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
	return priceScaleId === DefaultPriceScaleId.Left || priceScaleId === DefaultPriceScaleId.Right;
}
