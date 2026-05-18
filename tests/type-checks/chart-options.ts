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
