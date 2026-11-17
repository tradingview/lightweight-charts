/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ChartApi } from '../../src/api/chart-api';
import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { SeriesApi } from '../../src/api/series-api';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel, IChartModelBase } from '../../src/model/chart-model';
import { Coordinate } from '../../src/model/coordinate';
import { DataLayer } from '../../src/model/data-layer';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { ISeries } from '../../src/model/iseries';
import { Series } from '../../src/model/series';
import { SeriesPlotRow } from '../../src/model/series-data';
import { SeriesLinePaneView } from '../../src/model/series/line-pane-view';
import { lineStyleDefaults } from '../../src/model/series/line-series';
import { TimePointIndex } from '../../src/model/time-data';

function setup(): { api: ChartApi<Time>; model: ChartModel<Time>; series: Series<'Line'>[]; handles: SeriesApi<'Line', Time>[] } {
	const behavior = new HorzScaleBehaviorTime();
	const model = new ChartModel<Time>(() => {}, chartOptionsDefaults<Time>(), behavior);
	model.timeScale().setWidth(600);
	const api = Object.create(ChartApi.prototype) as ChartApi<Time>;
	const series = [0, 1, 2, 0].map((paneIndex: number) => {
		const line = new Series(model, 'Line', { ...clone(seriesOptionsDefaults), ...lineStyleDefaults }, (source: ISeries<'Line'>, chart: IChartModelBase) => new SeriesLinePaneView(source, chart));
		model.addSeriesToPane(line, paneIndex);
		model.panes()[paneIndex].setHeight(150);
		return line;
	});
	const handles = series.map(() => Object.create(null) as SeriesApi<'Line', Time>);
	/* eslint-disable @typescript-eslint/naming-convention */
	Object.assign(api, {
		_chartWidget: { model: () => model },
		_dataLayer: new DataLayer(behavior),
		_seriesMap: new Map(handles.map((handle: SeriesApi<'Line', Time>, i: number) => [handle, series[i]])),
		_seriesMapReversed: new Map(series.map((line: Series<'Line'>, i: number) => [line, handles[i]])),
	});
	/* eslint-enable @typescript-eslint/naming-convention */
	for (let i = 0; i < series.length; i++) {
		api.applyNewData(series[i], [{ time: 1 as UTCTimestamp, value: 10 }, { time: (i === 3 ? 20 : 2) as UTCTimestamp, value: 20 }]);
	}
	return { api, model, series, handles };
}

function pointAtSurvivor(model: ChartModel<Time>): void {
	model.setAndSaveCurrentPosition(200 as Coordinate, 50 as Coordinate, null, model.panes()[2]);
}

describe('Removing pane series', () => {
	it('finishes target cleanup before crosshair callbacks can reorder surviving panes', () => {
		const { api, model, series } = setup();
		const [target, first, second] = model.panes();
		pointAtSurvivor(model);
		let callbacks = 0;
		model.crosshairMoved().subscribe(() => {
			if (callbacks++ === 0) {
				expect(model.panes()).not.to.include(target);
				expect(model.serieses()).not.to.include(series[0]);
				expect(model.serieses()).not.to.include(series[3]);
				model.swapPanes(0, 1);
			}
		});
		api.removePane(0);
		expect(callbacks).to.be.greaterThan(0);
		expect(model.panes()).to.have.members([first, second]);
		expect(model.serieses()).to.have.members([series[1], series[2]]);
	});

	it('allows a callback to remove another pane without the outer call removing a neighbor', () => {
		const { api, model, series } = setup();
		const target = model.panes()[0];
		const survivor = model.panes()[2];
		pointAtSurvivor(model);
		let callbacks = 0;
		model.crosshairMoved().subscribe(() => {
			if (callbacks++ === 0) {
				api.removePane(0);
			}
		});
		api.removePane(0);
		expect(model.panes()).not.to.include(target);
		expect(model.panes()).to.deep.equal([survivor]);
		expect(model.serieses()).to.deep.equal([series[2]]);
	});

	it('allows a callback to remove a surviving series', () => {
		const { api, model, series, handles } = setup();
		pointAtSurvivor(model);
		let callbacks = 0;
		model.crosshairMoved().subscribe(() => {
			if (callbacks++ === 0) {
				api.removeSeries(handles[1]);
			}
		});
		api.removePane(0);
		expect(model.serieses()).to.deep.equal([series[2]]);
		expect(model.panes()).to.have.length(1);
	});

	it('merges time-point deletions across multiple removed series', () => {
		const { api, model, series } = setup();
		api.applyNewData(series[0], [{ time: 1 as UTCTimestamp, value: 10 }, { time: 4 as UTCTimestamp, value: 40 }]);
		api.applyNewData(series[1], [{ time: 2 as UTCTimestamp, value: 20 }, { time: 3 as UTCTimestamp, value: 30 }]);
		api.applyNewData(series[2], [{ time: 2 as UTCTimestamp, value: 22 }, { time: 3 as UTCTimestamp, value: 33 }]);
		api.applyNewData(series[3], [{ time: 5 as UTCTimestamp, value: 50 }]);
		api.removePane(0);
		expect(series[1].bars().rows().map((row: SeriesPlotRow<'Line'>) => row.index)).to.deep.equal([0, 1]);
		expect(series[2].bars().rows().map((row: SeriesPlotRow<'Line'>) => row.index)).to.deep.equal([0, 1]);
		expect(model.timeScale().indexToTimeScalePoint(0 as TimePointIndex)?.originalTime).to.equal(2);
		expect(model.timeScale().indexToTimeScalePoint(1 as TimePointIndex)?.originalTime).to.equal(3);
		expect(model.timeScale().indexToTimeScalePoint(2 as TimePointIndex)).to.equal(null);
	});

	it('clears a crosshair on the removed pane without exposing removed series', () => {
		const { api, model, series } = setup();
		model.setAndSaveCurrentPosition(200 as Coordinate, 50 as Coordinate, null, model.panes()[0]);
		let callbacks = 0;
		model.crosshairMoved().subscribe(() => callbacks++);
		api.removePane(0);
		expect(model.crosshairSource().pane()).to.equal(null);
		expect(callbacks).to.equal(0);
		expect(model.serieses()).to.have.members([series[1], series[2]]);
	});
});
