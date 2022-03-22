import { isRunningOnClientSide } from '../../helpers/is-running-on-client-side';

import { ChartOptionsInternal, TrackingModeExitMode } from '../../model/chart-model';

import { crosshairOptionsDefaults } from './crosshair-options-defaults';
import { gridOptionsDefaults } from './grid-options-defaults';
import { layoutOptionsDefaults } from './layout-options-defaults';
import { priceScaleOptionsDefaults } from './price-scale-options-defaults';
import { timeScaleOptionsDefaults } from './time-scale-options-defaults';
import { watermarkOptionsDefaults } from './watermark-options-defaults';

export const chartOptionsDefaults: ChartOptionsInternal = {
	width: 0,
	height: 0,
	layout: layoutOptionsDefaults,
	crosshair: crosshairOptionsDefaults,
	grid: gridOptionsDefaults,
	overlayPriceScales: {
		...priceScaleOptionsDefaults,
	},
	leftPriceScale: {
		...priceScaleOptionsDefaults,
		visible: false,
	},
	rightPriceScale: {
		...priceScaleOptionsDefaults,
		visible: true,
	},
	nonPrimaryPriceScale: {
		...priceScaleOptionsDefaults,
		visible: true,
	},
	timeScale: timeScaleOptionsDefaults,
	watermark: watermarkOptionsDefaults,
	localization: {
		locale: isRunningOnClientSide ? navigator.language : '',
		dateFormat: 'dd MMM \'yy',
	},
	handleScroll: {
		mouseWheel: true,
		pressedMouseMove: true,
		horzTouchDrag: true,
		vertTouchDrag: true,
	},
	handleScale: {
		axisPressedMouseMove: {
			time: true,
			price: true,
		},
		axisDoubleClickReset: true,
		mouseWheel: true,
		pinch: true,
	},
	kineticScroll: {
		mouse: false,
		touch: true,
	},
	trackingMode: {
		exitMode: TrackingModeExitMode.OnNextTap,
	},
};
