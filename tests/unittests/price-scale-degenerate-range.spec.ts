/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { layoutOptionsDefaults } from '../../src/api/options/layout-options-defaults';
import { priceScaleOptionsDefaults } from '../../src/api/options/price-scale-options-defaults';
import { AutoscaleInfoImpl } from '../../src/model/autoscale-info-impl';
import { ColorParser } from '../../src/model/colors';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { IPriceDataSource } from '../../src/model/iprice-data-source';
import { LocalizationOptions } from '../../src/model/localization-options';
import { PriceFormatter } from '../../src/formatters/price-formatter';
import { PriceRangeImpl } from '../../src/model/price-range-impl';
import { PriceScale } from '../../src/model/price-scale';
import { RangeImpl } from '../../src/model/range-impl';
import { TimePointIndex } from '../../src/model/time-data';

// https://github.com/tradingview/lightweight-charts/issues/1650
// A series whose visible values are all equal gets a degenerate (min === max)
// price range, which the scale extends by 10 min moves. At very large
// magnitudes 10 min moves are smaller than the float64 spacing, so the
// extension collapses back to a single point, the range length stays 0 and
// every price converts to a NaN coordinate - the series is not drawn.

describe('PriceScale degenerate range', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fakeLocalizationOptions: LocalizationOptions<Time> = {} as any;

	const constantSource = (value: number): IPriceDataSource => {
		const range = new PriceRangeImpl(value, value);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return {
			visible: () => true,
			firstValue: () => ({ value, timePoint: 0 }),
			autoscaleInfo: () => new AutoscaleInfoImpl(range, null),
			base: () => 100,
			zorder: () => 0,
			formatter: () => new PriceFormatter(2, 1),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
	};

	it('converts a constant huge price to a finite coordinate', () => {
		const priceScale = new PriceScale(
			'0',
			priceScaleOptionsDefaults,
			layoutOptionsDefaults,
			fakeLocalizationOptions,
			new ColorParser([], new Map())
		);

		const value = 1e16;
		priceScale.addDataSource(constantSource(value));
		priceScale.recalculatePriceRange(
			new RangeImpl(0 as TimePointIndex, 10 as TimePointIndex)
		);

		const range = priceScale.priceRange();
		expect(range).to.not.equal(null);
		// the extension must actually widen the range, even at 1e16
		expect(range!.minValue()).to.be.lessThan(range!.maxValue());

		const coordinate = priceScale.priceToCoordinate(value, value);
		expect(Number.isFinite(coordinate)).to.equal(true);
	});

	it('keeps the 10-min-move span for ordinary values', () => {
		const priceScale = new PriceScale(
			'0',
			priceScaleOptionsDefaults,
			layoutOptionsDefaults,
			fakeLocalizationOptions,
			new ColorParser([], new Map())
		);

		const value = 42;
		priceScale.addDataSource(constantSource(value));
		priceScale.recalculatePriceRange(
			new RangeImpl(0 as TimePointIndex, 10 as TimePointIndex)
		);

		const range = priceScale.priceRange();
		expect(range).to.not.equal(null);
		// minMove is 0.01 (base 100), so the degenerate range extends by 0.05
		expect(range!.minValue()).to.be.closeTo(41.95, 1e-9);
		expect(range!.maxValue()).to.be.closeTo(42.05, 1e-9);
	});
});
