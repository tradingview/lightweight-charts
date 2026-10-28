/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { clone, merge } from '../../src/helpers/strict-type-checks';
import { ChartModel, ChartOptionsInternal } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { PriceScale, PriceScaleMode } from '../../src/model/price-scale';
import { Series, SeriesOptionsInternal } from '../../src/model/series';
import { lineSeries, lineStyleDefaults } from '../../src/model/series/line-series';
import { SeriesDefinitionInternal } from '../../src/model/series/series-def';
import { TimeScalePoint } from '../../src/model/time-data';

function createModel(): ChartModel<Time> {
	const chartOptions: ChartOptionsInternal<Time> = clone(chartOptionsDefaults<Time>());
	const horzScaleBehavior = new HorzScaleBehaviorTime();
	// createChartEx does this after constructing the chart; the time formatters need it
	horzScaleBehavior.setOptions(chartOptions);
	return new ChartModel<Time>(() => {}, chartOptions, horzScaleBehavior);
}

function rightPriceScale(model: ChartModel<Time>): PriceScale {
	return model.panes()[0].rightPriceScale();
}

function createLineSeries(model: ChartModel<Time>): Series<'Line'> {
	const options = merge(clone(seriesOptionsDefaults), clone(lineStyleDefaults)) as SeriesOptionsInternal<'Line'>;
	const definition = lineSeries as SeriesDefinitionInternal<'Line'>;
	const series = new Series(model, 'Line', options, definition.createPaneView);
	model.addSeriesToPane(series, 0);
	return series;
}

const customPriceFormatter = (price: number): string => `custom:${price}`;

describe('applyOptions with null', () => {
	describe('localization formatters', () => {
		it('falls back to the built-in price formatter when priceFormatter is set to null', () => {
			const model = createModel();
			const defaultFormatted = rightPriceScale(model).formatPrice(1.5, 0);
			model.applyOptions({ localization: { priceFormatter: customPriceFormatter } });
			expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal('custom:1.5');

			model.applyOptions({ localization: { priceFormatter: null } });

			expect(model.options().localization.priceFormatter).to.equal(null);
			expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal(defaultFormatted);
		});

		it('uses the built-in price formatter when priceFormatter is null in the creation options', () => {
			// createChart merges the user options into the defaults exactly like this before building the model
			const chartOptions = merge(clone(chartOptionsDefaults<Time>()), { localization: { priceFormatter: null } }) as ChartOptionsInternal<Time>;
			const model = new ChartModel<Time>(() => {}, chartOptions, new HorzScaleBehaviorTime());

			expect(model.options().localization.priceFormatter).to.equal(null);
			expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal(rightPriceScale(createModel()).formatPrice(1.5, 0));
		});

		it('keeps a custom priceFormatter when it is set to undefined', () => {
			const model = createModel();
			model.applyOptions({ localization: { priceFormatter: customPriceFormatter } });

			model.applyOptions({ localization: { priceFormatter: undefined } });

			expect(rightPriceScale(model).formatPrice(1.5, 0)).to.equal('custom:1.5');
		});

		it('falls back to the built-in tickmarks formatting when tickmarksPriceFormatter is set to null', () => {
			const model = createModel();
			const scale = rightPriceScale(model);
			const defaultFormatted = scale.formatLogicalTickmarks([1.5, 2.5]);
			model.applyOptions({ localization: { tickmarksPriceFormatter: (prices: readonly number[]) => prices.map(() => 'custom') } });
			expect(scale.formatLogicalTickmarks([1.5, 2.5])).to.deep.equal(['custom', 'custom']);

			model.applyOptions({ localization: { tickmarksPriceFormatter: null } });

			expect(scale.formatLogicalTickmarks([1.5, 2.5])).to.deep.equal(defaultFormatted);
		});

		it('falls back to the built-in percentage formatting when the percentage formatters are set to null', () => {
			const model = createModel();
			const scale = rightPriceScale(model);
			scale.setMode({ mode: PriceScaleMode.Percentage });
			const defaultFormatted = scale.formatPrice(2, 1);
			const defaultTickmarks = scale.formatLogicalTickmarks([100, 200]);
			model.applyOptions({
				localization: {
					percentageFormatter: (p: number) => `pct:${p}`,
					tickmarksPercentageFormatter: (percentages: readonly number[]) => percentages.map(() => 'custom'),
				},
			});
			expect(scale.formatPrice(2, 1)).to.equal('pct:100');
			expect(scale.formatLogicalTickmarks([100, 200])).to.deep.equal(['custom', 'custom']);

			model.applyOptions({ localization: { percentageFormatter: null, tickmarksPercentageFormatter: null } });

			expect(scale.formatPrice(2, 1)).to.equal(defaultFormatted);
			expect(scale.formatLogicalTickmarks([100, 200])).to.deep.equal(defaultTickmarks);
		});

		it('falls back to the built-in time formatting when timeFormatter is set to null', () => {
			const model = createModel();
			// the headless default locale is an empty string, which the built-in formatter rejects
			model.applyOptions({ localization: { locale: 'en-US', timeFormatter: () => 'custom time' } });
			const rawPoint: Record<string, unknown> = { timeWeight: 0, time: { timestamp: 0 }, originalTime: 0 };
			const point = rawPoint as unknown as TimeScalePoint;
			expect(model.timeScale().formatDateTime(point)).to.equal('custom time');

			model.applyOptions({ localization: { timeFormatter: null } });

			expect(model.timeScale().formatDateTime(point)).to.not.equal('custom time');
		});
	});

	describe('series autoscaleInfoProvider', () => {
		it('goes back to the built-in autoscaling when set to null', () => {
			const series = createLineSeries(createModel());
			series.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 1, maxValue: 2 } }) });
			expect(series.autoscaleInfo(0 as never, 0 as never)?.priceRange()?.minValue()).to.equal(1);

			series.applyOptions({ autoscaleInfoProvider: null });

			expect(series.options().autoscaleInfoProvider).to.equal(null);
			expect(series.autoscaleInfo(0 as never, 0 as never)).to.equal(null);
		});

		it('still goes back to the built-in autoscaling when set to undefined, as released in 5.2.1', () => {
			const series = createLineSeries(createModel());
			series.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 1, maxValue: 2 } }) });

			series.applyOptions({ autoscaleInfoProvider: undefined });

			expect(series.options().autoscaleInfoProvider).to.equal(undefined);
			expect(series.autoscaleInfo(0 as never, 0 as never)).to.equal(null);
		});

		it('keeps null as a value for other series options, so plugin-defined custom series options are unaffected', () => {
			const series = createLineSeries(createModel());
			const pluginOptions: Record<string, unknown> = { upColor: null };

			series.applyOptions(pluginOptions as Parameters<typeof series.applyOptions>[0]);

			expect((series.options() as unknown as { upColor: unknown }).upColor).to.equal(null);
		});
	});
});
