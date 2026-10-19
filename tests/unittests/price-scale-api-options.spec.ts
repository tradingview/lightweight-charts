/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/consistent-type-assertions */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { PriceScaleApi } from '../../src/api/price-scale-api';
import { IChartWidgetBase } from '../../src/gui/chart-widget';
import { clone, DeepPartial, merge } from '../../src/helpers/strict-type-checks';
import { ChartModel, ChartOptionsInternal, ChartOptionsInternalBase } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { createPriceScaleOptions } from '../../src/model/price-scale';
import { Series, SeriesOptionsInternal } from '../../src/model/series';
import { lineSeries, lineStyleDefaults } from '../../src/model/series/line-series';
import { SeriesDefinitionInternal } from '../../src/model/series/series-def';

const overlayScaleId = 'volume';

function createModel(options?: DeepPartial<ChartOptionsInternal<Time>>): ChartModel<Time> {
	const chartOptions = merge(chartOptionsDefaults<Time>(), options ?? {}) as ChartOptionsInternal<Time>;
	return new ChartModel<Time>(() => {}, chartOptions, new HorzScaleBehaviorTime());
}

function createLineSeriesOnOverlayScale(model: ChartModel<Time>): Series<'Line'> {
	const options = merge(
		clone(seriesOptionsDefaults),
		clone(lineStyleDefaults),
		{ priceScaleId: overlayScaleId }
	) as SeriesOptionsInternal<'Line'>;
	const definition = lineSeries as SeriesDefinitionInternal<'Line'>;
	return new Series(model, 'Line', options, definition.createPaneView);
}

function createPriceScaleApi(model: ChartModel<Time>, priceScaleId: string = overlayScaleId, paneIndex?: number): PriceScaleApi {
	const chartWidget: IChartWidgetBase = {
		getPriceAxisWidth: () => 0,
		model: () => model,
		paneWidgets: () => [],
		options: () => ({} as ChartOptionsInternalBase),
		setCursorStyle: () => {},
	};
	return new PriceScaleApi(chartWidget, priceScaleId, paneIndex);
}

describe('PriceScaleApi.options()', () => {
	it('returns the options of an existing price scale', () => {
		const model = createModel();
		const api = createPriceScaleApi(model);
		model.addSeriesToPane(createLineSeriesOnOverlayScale(model), 0);

		const scale = model.findPriceScale(overlayScaleId, 0);
		expect(scale).to.not.equal(null);
		expect(api.options()).to.deep.equal(scale?.priceScale.options());
	});

	it('reflects options applied to an existing price scale', () => {
		const model = createModel();
		const api = createPriceScaleApi(model);
		model.addSeriesToPane(createLineSeriesOnOverlayScale(model), 0);

		api.applyOptions({ scaleMargins: { top: 0.6, bottom: 0.2 } });

		expect(api.options().scaleMargins).to.deep.equal({ top: 0.6, bottom: 0.2 });
	});

	it('returns the options of a default price scale', () => {
		const model = createModel();
		const api = createPriceScaleApi(model, 'right');

		const rightScale = model.findPriceScale('right', 0);
		expect(rightScale).to.not.equal(null);
		expect(api.options()).to.deep.equal(rightScale?.priceScale.options());
		expect(api.options().visible).to.equal(true);
	});

	describe('for an overlay price scale that does not exist yet', () => {
		it('returns the options the scale will be created with', () => {
			const model = createModel();
			const api = createPriceScaleApi(model);

			const optionsBeforeCreation = api.options();

			model.addSeriesToPane(createLineSeriesOnOverlayScale(model), 0);
			const created = model.findPriceScale(overlayScaleId, 0);
			expect(created).to.not.equal(null);
			expect(optionsBeforeCreation).to.deep.equal(created?.priceScale.options());
		});

		it('reflects the chart-level overlayPriceScales options', () => {
			const model = createModel({ overlayPriceScales: { scaleMargins: { top: 0.7, bottom: 0.05 }, invertScale: true } });
			const api = createPriceScaleApi(model);

			const options = api.options();

			expect(options.scaleMargins).to.deep.equal({ top: 0.7, bottom: 0.05 });
			expect(options.invertScale).to.equal(true);
		});

		it('returns a copy that is not shared with the chart options', () => {
			const model = createModel();
			const api = createPriceScaleApi(model);

			const options = api.options();

			expect(options).to.not.equal(model.options().overlayPriceScales);
			expect(options.scaleMargins).to.not.equal(model.options().overlayPriceScales.scaleMargins);
		});

		it('returns the overlay defaults instead of throwing when the pane does not exist', () => {
			const model = createModel();
			const api = createPriceScaleApi(model, overlayScaleId, 5);

			expect(() => api.options()).to.not.throw();
			expect(api.options()).to.deep.equal(createPriceScaleOptions(model.options().overlayPriceScales));
		});
	});
});
