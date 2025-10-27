/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { layoutOptionsDefaults } from '../../src/api/options/layout-options-defaults';
import { priceScaleOptionsDefaults } from '../../src/api/options/price-scale-options-defaults';
import { PriceScaleApi } from '../../src/api/price-scale-api';
import { IChartWidgetBase } from '../../src/gui/chart-widget';
import { IChartModelBase, PriceScaleOnPane } from '../../src/model/chart-model';
import { ColorParser } from '../../src/model/colors';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { LocalizationOptions } from '../../src/model/localization-options';
import { PriceRangeImpl } from '../../src/model/price-range-impl';
import { PriceScale, PriceScaleMode } from '../../src/model/price-scale';

describe('PriceScale', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fakeLocalizationOptions: LocalizationOptions<Time> = {} as any;

	it('visible range with normal and logarithmic mode', () => {
		const priceScaleId = '0';
		const priceScale = new PriceScale(
			priceScaleId,
			priceScaleOptionsDefaults,
			layoutOptionsDefaults,
			fakeLocalizationOptions,
			new ColorParser([], new Map())
		);

		const mockChartModel: IChartModelBase = {
			applyPriceScaleOptions: () => {},
			findPriceScale: (id: string, paneIndex: number): PriceScaleOnPane | null => {
				if (id === priceScaleId && paneIndex === 0) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return { priceScale, pane: {} as any };
				}
				return null;
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			options: () => ({} as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			timeScale: () => ({} as any),
			serieses: () => [],
			visibleSerieses: () => [],
			invalidateVisibleSeries: () => {},
			updateSource: () => {},
			updateCrosshair: () => {},
			cursorUpdate: () => {},
			clearCurrentPosition: () => {},
			setAndSaveCurrentPosition: () => {},
			recalculatePane: () => {},
			lightUpdate: () => {},
			fullUpdate: () => {},
			backgroundBottomColor: () => '',
			backgroundTopColor: () => '',
			backgroundColorAtYPercentFromTop: () => '',
			paneForSource: () => null,
			moveSeriesToScale: () => {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			priceAxisRendererOptions: () => ({} as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			rendererOptionsProvider: () => ({} as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			priceScalesOptionsChanged: () => ({} as any),
			hoveredSource: () => null,
			setHoveredSource: () => {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			crosshairSource: () => ({} as any),
			startScrollPrice: () => {},
			scrollPriceTo: () => {},
			endScrollPrice: () => {},
			resetPriceScale: () => {},
			startScalePrice: () => {},
			scalePriceTo: () => {},
			endScalePrice: () => {},
			zoomTime: () => {},
			startScrollTime: () => {},
			scrollTimeTo: () => {},
			endScrollTime: () => {},
			setTimeScaleAnimation: () => {},
			stopTimeScaleAnimation: () => {},
			moveSeriesToPane: () => {},
			panes: () => [],
			getPaneIndex: () => 0,
			swapPanes: () => {},
			movePane: () => {},
			removePane: () => {},
			changePanesHeight: () => {},
			colorParser: () => new ColorParser([], new Map()),
		};

		const mockChartWidget: IChartWidgetBase = {
			getPriceAxisWidth: (position: string) => {
				if (position === priceScaleId) {
					return 60; // Default price axis width
				}
				return 0;
			},
			model: () => mockChartModel,
			paneWidgets: () => [],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
			options: () => ({} as any),
			setCursorStyle: () => {},
		};

		const priceScaleApi = new PriceScaleApi(mockChartWidget, priceScaleId);
		priceScale.setHeight(500);

		const fromPrice = 0;
		const toPrice = 100000;

		priceScale.setPriceRange(new PriceRangeImpl(fromPrice, toPrice));

		let priceRange = priceScaleApi.getVisibleRange();

		expect(priceRange).to.not.equal(null);
		expect(priceRange?.from).to.be.equal(fromPrice);
		expect(priceRange?.to).to.be.equal(toPrice);

		priceScale.setMode({ mode: PriceScaleMode.Logarithmic });

		priceRange = priceScaleApi.getVisibleRange();

		expect(priceRange).to.not.equal(null);
		expect(priceRange?.from).to.be.equal(fromPrice);
		expect(priceRange?.to).to.be.equal(toPrice);
	});
});
