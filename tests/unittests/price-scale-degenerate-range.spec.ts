/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { layoutOptionsDefaults } from '../../src/api/options/layout-options-defaults';
import { priceScaleOptionsDefaults } from '../../src/api/options/price-scale-options-defaults';
import { PriceFormatter } from '../../src/formatters/price-formatter';
import { ensureNotNull } from '../../src/helpers/assertions';
import { AutoscaleInfoImpl } from '../../src/model/autoscale-info-impl';
import { ColorParser } from '../../src/model/colors';
import { Coordinate } from '../../src/model/coordinate';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { IPriceDataSource } from '../../src/model/iprice-data-source';
import { LocalizationOptions } from '../../src/model/localization-options';
import { PriceRangeImpl } from '../../src/model/price-range-impl';
import { PriceScale, PriceScaleMode } from '../../src/model/price-scale';
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
		return {
			visible: () => true,
			firstValue: () => ({ value, timePoint: 0 }),
			autoscaleInfo: () => new AutoscaleInfoImpl(range, null),
			base: () => 100,
			zorder: () => 0,
			formatter: () => new PriceFormatter(100, 1),
		} as unknown as IPriceDataSource;
	};

	const constantScale = (value: number): PriceScale => {
		const priceScale = new PriceScale(
			'0',
			{ ...priceScaleOptionsDefaults },
			layoutOptionsDefaults,
			fakeLocalizationOptions,
			new ColorParser([], new Map())
		);
		priceScale.addDataSource(constantSource(value));
		priceScale.recalculatePriceRange(
			new RangeImpl(0 as TimePointIndex, 10 as TimePointIndex)
		);
		return priceScale;
	};

	it('converts a constant huge price to a finite coordinate', () => {
		const priceScale = constantScale(1e16);

		const range = ensureNotNull(priceScale.priceRange());
		// the extension must actually widen the range, even at 1e16
		expect(range.minValue()).to.be.lessThan(range.maxValue());

		const coordinate = priceScale.priceToCoordinate(1e16, 1e16);
		expect(Number.isFinite(coordinate)).to.equal(true);
	});

	for (const value of [1e8, 1e12, 1e16, -1e16, 1e30]) {
		it(`keeps log-mode coordinates stable for a constant price of ${value}`, () => {
			const priceScale = constantScale(value);
			priceScale.setMode({ mode: PriceScaleMode.Logarithmic });
			priceScale.recalculatePriceRange(new RangeImpl(0 as TimePointIndex, 10 as TimePointIndex));
			priceScale.setHeight(2000);

			const range = ensureNotNull(priceScale.priceRange());
			expect(range.minValue()).to.be.lessThan(range.maxValue());
			expect(Number.isFinite(priceScale.priceToCoordinate(value, value))).to.equal(true);

			// A nonzero range alone is insufficient: a few log-space float steps
			// leave visibly quantized coordinates after a price round trip.
			for (let y = 200; y < 1600; y += 23) {
				const price = priceScale.coordinateToPrice(y as Coordinate, value);
				expect(priceScale.priceToCoordinate(price, value)).to.be.closeTo(y, 0.001);
			}
		});
	}

	it('keeps the 10-min-move span for ordinary values', () => {
		const priceScale = constantScale(42);

		const range = ensureNotNull(priceScale.priceRange());
		// minMove is 0.01 (base 100), so the degenerate range extends by 0.05
		expect(range.minValue()).to.be.closeTo(41.95, 1e-9);
		expect(range.maxValue()).to.be.closeTo(42.05, 1e-9);
	});
});
