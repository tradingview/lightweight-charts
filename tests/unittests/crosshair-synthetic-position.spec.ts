/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel, IChartModelBase } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { ISeries } from '../../src/model/iseries';
import { Series } from '../../src/model/series';
import { SeriesLinePaneView } from '../../src/model/series/line-pane-view';
import { lineStyleDefaults } from '../../src/model/series/line-series';
import { TickMarkWeightValue, TimePointIndex } from '../../src/model/time-data';

function createModel(): ChartModel<Time> {
	const model = new ChartModel<Time>(() => {}, chartOptionsDefaults<Time>(), new HorzScaleBehaviorTime());
	model.timeScale().setWidth(400);
	const points = Array.from({ length: 100 }, (unused: unknown, i: number) => ({
		time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem,
		timeWeight: 20 as TickMarkWeightValue,
		originalTime: i as UTCTimestamp,
	}));
	model.updateTimeScale(99 as TimePointIndex, points, 0);
	return model;
}

describe('Synthetic crosshair position events', () => {
	it('maps an API-set time and price and stays silent after scale changes', () => {
		const model = createModel();
		const series = new Series(model, 'Line', { ...clone(seriesOptionsDefaults), ...lineStyleDefaults }, (source: ISeries<'Line'>, chart: IChartModelBase) => new SeriesLinePaneView(source, chart));
		model.addSeriesToPane(series, 0);
		model.panes()[0].setHeight(300);
		series.setData(Array.from({ length: 100 }, (unused: unknown, i: number) => ({
			index: i as TimePointIndex,
			time: { timestamp: i as UTCTimestamp } as unknown as InternalHorzScaleItem,
			originalTime: i as UTCTimestamp,
			value: [100 + i, 100 + i, 100 + i, 100 + i],
		})));
		let events = 0;
		model.crosshairMoved().subscribe(() => events++);
		const time = { timestamp: 70 as UTCTimestamp } as unknown as Time;
		model.setAndSaveSyntheticPosition(170, time, model.panes()[0]);
		expect(model.crosshairSource().appliedIndex()).to.equal(70);
		expect(model.crosshairSource().appliedY()).to.be.closeTo(series.priceScale().priceToCoordinate(170, 100), 0.01);
		model.timeScale().setRightOffset(-5);
		model.updateCrosshair();
		model.timeScale().setWidth(350);
		model.panes()[0].setHeight(250);
		model.updateCrosshair();
		model.applyPriceScaleOptions('right', { invertScale: true });
		model.recalculateAllPanes();
		series.setData(series.bars().rows());
		model.updateCrosshair();
		expect(events).to.equal(0);
	});

	it('preserves a synthetic position set reentrantly by an event callback', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => {
			events++;
			model.setAndSaveCurrentPosition(180 as Coordinate, 100 as Coordinate, null, model.panes()[0], true);
		});
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0]);
		model.updateCrosshair();
		expect(events).to.equal(1);
		expect(model.crosshairSource().originCoordX()).to.equal(180);
	});

	it('does not restore a position cleared reentrantly by an event callback', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => {
			events++;
			model.clearCurrentPosition(true);
		});
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0]);
		model.updateCrosshair();
		expect(events).to.equal(1);
		expect(model.crosshairSource().pane()).to.equal(null);
	});

	it('keeps a silent position silent through repeated crosshair recalculations', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => events++);
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0], true);
		model.updateCrosshair();
		model.updateCrosshair();
		expect(events).to.equal(0);
	});

	it('resumes events when a pointer position replaces a synthetic position', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => events++);
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0], true);
		model.setAndSaveCurrentPosition(210 as Coordinate, 100 as Coordinate, null, model.panes()[0]);
		model.updateCrosshair();
		expect(events).to.equal(2);
		expect(model.crosshairSource().originCoordX()).to.equal(210);
	});

	it('keeps ordinary pointer-origin recalculation events', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => events++);
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0]);
		model.updateCrosshair();
		model.updateCrosshair();
		expect(events).to.equal(3);
	});

	it('clears a synthetic position without producing a later event', () => {
		const model = createModel();
		let events = 0;
		model.crosshairMoved().subscribe(() => events++);
		model.setAndSaveCurrentPosition(200 as Coordinate, 100 as Coordinate, null, model.panes()[0], true);
		model.clearCurrentPosition(true);
		model.updateCrosshair();
		expect(events).to.equal(0);
	});
});
