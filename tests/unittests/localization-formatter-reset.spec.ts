/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { merge } from '../../src/helpers/strict-type-checks';
import { LocalizationOptionsBase } from '../../src/model/localization-options';

describe('Localization Formatter Reset', () => {
	/* eslint-disable
		@typescript-eslint/no-explicit-any,
		@typescript-eslint/no-unsafe-argument,
		@typescript-eslint/no-unused-expressions,
	*/

	it('should allow resetting priceFormatter to undefined', () => {
		// Simulate the scenario from the issue report
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			priceFormatter: (price: number) => `$${price.toFixed(2)}`,
		};

		// User tries to reset priceFormatter by setting it to undefined
		const resetOptions: Partial<LocalizationOptionsBase> = {
			priceFormatter: undefined,
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		// priceFormatter should now be undefined
		expect(result.priceFormatter).to.be.undefined;
		expect(result.locale).to.equal('en-US');
	});

	it('should allow resetting percentageFormatter to undefined', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			percentageFormatter: (percentage: number) => `${percentage.toFixed(2)}%`,
		};

		const resetOptions: Partial<LocalizationOptionsBase> = {
			percentageFormatter: undefined,
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		expect(result.percentageFormatter).to.be.undefined;
		expect(result.locale).to.equal('en-US');
	});

	it('should allow resetting tickmarksPriceFormatter to undefined', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			tickmarksPriceFormatter: (prices: readonly number[]) => prices.map((p: number) => `$${p}`),
		};

		const resetOptions: Partial<LocalizationOptionsBase> = {
			tickmarksPriceFormatter: undefined,
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		expect(result.tickmarksPriceFormatter).to.be.undefined;
		expect(result.locale).to.equal('en-US');
	});

	it('should allow resetting tickmarksPercentageFormatter to undefined', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			tickmarksPercentageFormatter: (percentages: readonly number[]) => percentages.map((p: number) => `${p}%`),
		};

		const resetOptions: Partial<LocalizationOptionsBase> = {
			tickmarksPercentageFormatter: undefined,
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		expect(result.tickmarksPercentageFormatter).to.be.undefined;
		expect(result.locale).to.equal('en-US');
	});

	it('should allow resetting multiple formatters at once', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			priceFormatter: (price: number) => `$${price}`,
			percentageFormatter: (percentage: number) => `${percentage}%`,
			tickmarksPriceFormatter: (prices: readonly number[]) => prices.map((p: number) => `$${p}`),
			tickmarksPercentageFormatter: (percentages: readonly number[]) => percentages.map((p: number) => `${p}%`),
		};

		const resetOptions: Partial<LocalizationOptionsBase> = {
			priceFormatter: undefined,
			percentageFormatter: undefined,
			tickmarksPriceFormatter: undefined,
			tickmarksPercentageFormatter: undefined,
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		expect(result.priceFormatter).to.be.undefined;
		expect(result.percentageFormatter).to.be.undefined;
		expect(result.tickmarksPriceFormatter).to.be.undefined;
		expect(result.tickmarksPercentageFormatter).to.be.undefined;
		expect(result.locale).to.equal('en-US');
	});

	it('should allow setting a new formatter after resetting', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			priceFormatter: (price: number) => `$${price}`,
		};

		// Reset to undefined
		merge(initialOptions as any, { priceFormatter: undefined } as any);
		expect(initialOptions.priceFormatter).to.be.undefined;

		// Set a new formatter
		const newFormatter = (price: number) => `€${price}`;
		merge(initialOptions as any, { priceFormatter: newFormatter } as any);
		expect(initialOptions.priceFormatter).to.equal(newFormatter);
	});

	it('should only reset formatters that are explicitly set to undefined', () => {
		const initialOptions: LocalizationOptionsBase = {
			locale: 'en-US',
			priceFormatter: (price: number) => `$${price}`,
			percentageFormatter: (percentage: number) => `${percentage}%`,
		};

		// Only reset priceFormatter, leave percentageFormatter unchanged
		const resetOptions: Partial<LocalizationOptionsBase> = {
			priceFormatter: undefined,
			// Note: percentageFormatter is not included in resetOptions
		};

		const result = merge(initialOptions as any, resetOptions as any) as LocalizationOptionsBase;

		expect(result.priceFormatter).to.be.undefined;
		// percentageFormatter should remain unchanged
		expect(result.percentageFormatter).to.be.a('function');
	});

	/* eslint-enable
		@typescript-eslint/no-explicit-any,
		@typescript-eslint/no-unsafe-argument,
		@typescript-eslint/no-unused-expressions,
	*/
});
