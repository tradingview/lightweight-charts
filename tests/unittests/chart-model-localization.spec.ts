/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel, ChartOptionsInternal } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { PriceScale } from '../../src/model/price-scale';

function createModel(): ChartModel<Time> {
	const chartOptions: ChartOptionsInternal<Time> = clone(chartOptionsDefaults<Time>());
	return new ChartModel<Time>(() => {}, chartOptions, new HorzScaleBehaviorTime());
}

function rightPriceScale(model: ChartModel<Time>): PriceScale {
	return model.panes()[0].rightPriceScale();
}

describe('ChartModel.applyOptions localization formatters', () => {
	it('uses a custom priceFormatter once applied', () => {
		const model = createModel();

		model.applyOptions({ localization: { priceFormatter: (price: number) => `custom:${price}` } });

		expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal('custom:1.5');
	});

	it('falls back to the built-in formatter when priceFormatter is explicitly set to undefined', () => {
		const model = createModel();
		model.applyOptions({ localization: { priceFormatter: (price: number) => `custom:${price}` } });
		const defaultFormatted = createModel().panes()[0].rightPriceScale().formatPrice(1.5, 0);

		model.applyOptions({ localization: { priceFormatter: undefined } });

		expect(model.options().localization.priceFormatter).to.equal(undefined);
		expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal(defaultFormatted);
	});

	it('keeps a custom priceFormatter when the localization update does not mention it', () => {
		const model = createModel();
		model.applyOptions({ localization: { priceFormatter: (price: number) => `custom:${price}` } });

		model.applyOptions({ localization: { locale: 'de-DE' } });

		expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal('custom:1.5');
	});

	it('clears percentageFormatter when explicitly set to undefined', () => {
		const model = createModel();
		model.applyOptions({ localization: { percentageFormatter: (p: number) => `pct:${p}` } });

		model.applyOptions({ localization: { percentageFormatter: undefined } });

		expect(model.options().localization.percentageFormatter).to.equal(undefined);
	});

	it('clears timeFormatter when explicitly set to undefined', () => {
		const model = createModel();
		model.applyOptions({ localization: { timeFormatter: () => 'time' } });

		model.applyOptions({ localization: { timeFormatter: undefined } });

		expect(model.options().localization.timeFormatter).to.equal(undefined);
	});

	it('clears tickmarks formatters when explicitly set to undefined', () => {
		const model = createModel();
		model.applyOptions({
			localization: {
				tickmarksPriceFormatter: (prices: readonly number[]) => prices.map(String),
				tickmarksPercentageFormatter: (percentages: readonly number[]) => percentages.map(String),
			},
		});

		model.applyOptions({ localization: { tickmarksPriceFormatter: undefined, tickmarksPercentageFormatter: undefined } });

		expect(model.options().localization.tickmarksPriceFormatter).to.equal(undefined);
		expect(model.options().localization.tickmarksPercentageFormatter).to.equal(undefined);
	});

	it('clears locale when explicitly set to undefined', () => {
		const model = createModel();
		model.applyOptions({ localization: { locale: 'de-DE' } });

		model.applyOptions({ localization: { locale: undefined } });

		expect(model.options().localization.locale).to.equal(undefined);
	});

	it('keeps locale when the localization update does not mention it', () => {
		const model = createModel();
		model.applyOptions({ localization: { locale: 'de-DE' } });

		model.applyOptions({ localization: { priceFormatter: undefined } });

		expect(model.options().localization.locale).to.equal('de-DE');
	});
});
