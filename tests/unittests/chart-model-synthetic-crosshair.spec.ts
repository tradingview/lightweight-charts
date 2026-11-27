/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { clone, merge } from '../../src/helpers/strict-type-checks';
import { ChartModel } from '../../src/model/chart-model';
import { DataLayer, SeriesChanges } from '../../src/model/data-layer';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { Series, SeriesOptionsInternal } from '../../src/model/series';
import { SeriesType } from '../../src/model/series-options';
import { lineSeries, lineStyleDefaults } from '../../src/model/series/line-series';
import { SeriesDefinitionInternal } from '../../src/model/series/series-def';

function createModel(): ChartModel<Time> {
	return new ChartModel<Time>(() => {}, chartOptionsDefaults<Time>(), new HorzScaleBehaviorTime());
}

function addLineSeries(model: ChartModel<Time>): Series<'Line'> {
	const options = merge(clone(seriesOptionsDefaults), clone(lineStyleDefaults)) as SeriesOptionsInternal<'Line'>;
	const series = new Series(model, 'Line', options, (lineSeries as SeriesDefinitionInternal<'Line'>).createPaneView);
	model.addSeriesToPane(series, 0);
	return series;
}

// mirrors ChartApi._sendUpdateToChart
function setData(model: ChartModel<Time>, dataLayer: DataLayer<Time>, series: Series<'Line'>, data: { time: UTCTimestamp; value: number }[]): void {
	const update = dataLayer.setSeriesData(series, data);
	model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
	update.series.forEach((value: SeriesChanges, s: Series<SeriesType>) => s.setData(value.data, value.info));
	model.timeScale().recalculateIndicesWithData();
	model.recalculateAllPanes();
}

describe('ChartModel.setAndSaveSyntheticPosition', () => {
	it('does not throw when the pane has no data to place the crosshair against', () => {
		const model = createModel();
		const series = addLineSeries(model);
		const pane = model.panes()[0];
		expect(model.paneForSource(series)).to.equal(pane);

		expect(() => model.setAndSaveSyntheticPosition(100, 1700000000 as UTCTimestamp, pane)).to.not.throw();
		expect(model.crosshairSource().visible()).to.equal(false);
	});

	it('hides a crosshair that was shown before the data went away', () => {
		const model = createModel();
		const series = addLineSeries(model);
		const pane = model.panes()[0];
		model.timeScale().setWidth(600);
		pane.setHeight(400);
		const dataLayer = new DataLayer<Time>(new HorzScaleBehaviorTime());

		setData(model, dataLayer, series, [{ time: 1700000000 as UTCTimestamp, value: 100 }]);
		model.setAndSaveSyntheticPosition(100, 1700000000 as UTCTimestamp, pane);
		expect(model.crosshairSource().visible()).to.equal(true);

		setData(model, dataLayer, series, []);
		expect(() => model.setAndSaveSyntheticPosition(100, 1700000000 as UTCTimestamp, pane)).to.not.throw();
		expect(model.crosshairSource().visible()).to.equal(false);
	});
});
