import { ChartOptions } from '../../model/chart-model';

import { crossHairOptionsDefaults } from './cross-hair-options-defaults';
import { gridOptionsDefaults } from './grid-options-defaults';
import { layoutOptionsDefaults } from './layout-options-defaults';
import { priceScaleOptionsDefaults } from './price-scale-options-defaults';
import { timeScaleOptionsDefaults } from './time-scale-options-defaults';
import { watermarkOptionsDefaults } from './watermark-options-defaults';

export const chartOptionsDefaults: ChartOptions = {
	width: 0,
	height: 0,
	layout: layoutOptionsDefaults,
	crossHair: crossHairOptionsDefaults,
	grid: gridOptionsDefaults,
	priceScale: priceScaleOptionsDefaults,
	timeScale: timeScaleOptionsDefaults,
	watermark: watermarkOptionsDefaults,
	localization: {
		locale: navigator.language,
		dateFormat: 'dd MMM \'yy',
	},
	handleScroll: {
		mouseWheel: true,
		pressedMouseMove: true,
	},
	handleScale: {
		axisPressedMouseMove: true,
		mouseWheel: true,
		pinch: true,
	},
};
