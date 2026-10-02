import { createChart } from '../../src';

createChart('container', {
	defaultVisiblePriceScaleId: 'left',
});

const chart = createChart('container');

chart.applyOptions({
	defaultVisiblePriceScaleId: 'right',
});

chart.applyOptions({
	// @ts-expect-error invalid value
	defaultVisiblePriceScaleId: 'overlay',
});

// null resets a localization formatter; undefined leaves the current value alone
chart.applyOptions({
	localization: {
		priceFormatter: null,
		tickmarksPriceFormatter: null,
		percentageFormatter: null,
		tickmarksPercentageFormatter: null,
		timeFormatter: null,
	},
});
chart.applyOptions({ localization: { priceFormatter: undefined } });
createChart('container', { localization: { priceFormatter: null } });

chart.applyOptions({
	// @ts-expect-error only the formatters accept null
	localization: { dateFormat: null },
});

chart.applyOptions({
	// @ts-expect-error only the formatters accept null
	layout: { textColor: null },
});
