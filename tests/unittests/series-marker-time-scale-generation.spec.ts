/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ChartApi } from '../../src/api/chart-api';
import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { SeriesApi } from '../../src/api/series-api';
import { TimeScaleApi } from '../../src/api/time-scale-api';
import { timeScalePointsGeneration } from '../../src/api/time-scale-points-generation';
import { TimeAxisWidget } from '../../src/gui/time-axis-widget';
import { Delegate } from '../../src/helpers/delegate';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel, IChartModelBase } from '../../src/model/chart-model';
import { DataLayer } from '../../src/model/data-layer';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';
import { CustomData, CustomSeriesWhitespaceData } from '../../src/model/icustom-series';
import { ISeries } from '../../src/model/iseries';
import { MismatchDirection } from '../../src/model/plot-list';
import { Series } from '../../src/model/series';
import { SeriesLinePaneView } from '../../src/model/series/line-pane-view';
import { lineStyleDefaults } from '../../src/model/series/line-series';
import { SeriesMarkersPrimitive } from '../../src/plugins/series-markers/primitive';

function setup(): { api: ChartApi<Time>; model: ChartModel<Time>; handles: SeriesApi<'Line', Time>[]; marker: SeriesMarkersPrimitive<Time> } {
	const behavior = new HorzScaleBehaviorTime();
	const model = new ChartModel<Time>(() => {}, chartOptionsDefaults<Time>(), behavior);
	model.timeScale().setWidth(600);
	const api = Object.create(ChartApi.prototype) as ChartApi<Time>;
	const series = [0, 1, 2].map(() => {
		const line = new Series(model, 'Line', { ...clone(seriesOptionsDefaults), ...lineStyleDefaults }, (source: ISeries<'Line'>, chart: IChartModelBase) => new SeriesLinePaneView(source, chart));
		model.addSeriesToPane(line, 0);
		return line;
	});
	const timeScale = new TimeScaleApi(model, { sizeChanged: () => new Delegate() } as unknown as TimeAxisWidget<Time>, behavior);
	const handles = series.map((line: Series<'Line'>) => new SeriesApi<'Line', Time>(line, api, api, api, behavior, () => { throw new Error('Unused pane API'); }));
	/* eslint-disable @typescript-eslint/naming-convention */
	Object.assign(api, {
		_chartWidget: { model: () => model },
		_timeScaleApi: timeScale,
		_horzScaleBehavior: behavior,
		_dataLayer: new DataLayer(behavior),
		_seriesMap: new Map(handles.map((handle: SeriesApi<'Line', Time>, i: number) => [handle, series[i]])),
		_seriesMapReversed: new Map(series.map((line: Series<'Line'>, i: number) => [line, handles[i]])),
	});
	/* eslint-enable @typescript-eslint/naming-convention */
	const marker = new SeriesMarkersPrimitive<Time>({});
	series[0].attachPrimitive(marker);
	marker.attached({ chart: api, series: handles[0], requestUpdate: () => {}, horzScaleBehavior: behavior });
	return { api, model, handles, marker };
}

function data(times: number[]): { time: UTCTimestamp; value: number }[] {
	return times.map((time: number) => ({ time: time as UTCTimestamp, value: 10 }));
}

function index(marker: SeriesMarkersPrimitive<Time>): number | undefined {
	/* eslint-disable @typescript-eslint/naming-convention */
	return (marker as unknown as { _indexedMarkers: { time: number }[] })._indexedMarkers[0]?.time;
	/* eslint-enable @typescript-eslint/naming-convention */
}

describe('Marker indexes after shared time scale updates', () => {
	it('uses final shared indexes when the marker series is updated first', () => {
		const { handles, marker } = setup();
		const before = Array.from({ length: 400 }, (unused: unknown, i: number) => i * 60 + 60);
		const after = Array.from({ length: 100 }, (unused: unknown, i: number) => i * 300 + 60);
		handles.forEach((handle: SeriesApi<'Line', Time>) => handle.setData(data(before)));
		marker.setMarkers([{ time: 9060 as UTCTimestamp, position: 'aboveBar', color: 'red', shape: 'arrowDown' }]);
		handles.forEach((handle: SeriesApi<'Line', Time>) => handle.setData(data(after)));
		expect(index(marker)).to.equal(30);
	});

	it('invalidates when another series changes only interior time keys without changing count or base index', () => {
		const { api, handles, marker } = setup();
		handles[0].setData(data([10, 30]));
		handles[1].setData(data([10, 20, 30, 40]));
		marker.setMarkers([{ time: 30 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		expect(index(marker)).to.equal(2);
		const generation = timeScalePointsGeneration(api.timeScale());
		handles[1].setData(data([10, 30, 35, 40]));
		expect(timeScalePointsGeneration(api.timeScale())).not.to.equal(generation);
		expect(index(marker)).to.equal(1);
	});

	it('reindexes when another series is removed', () => {
		const { api, handles, marker } = setup();
		handles[0].setData(data([10, 30]));
		handles[1].setData(data([5, 15, 20, 40]));
		marker.setMarkers([{ time: 30 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		expect(index(marker)).to.equal(4);
		api.removeSeries(handles[1]);
		expect(index(marker)).to.equal(1);
	});

	it('keeps the cached indexes on value-only updates and repeated view updates', () => {
		const { api, model, handles, marker } = setup();
		handles.forEach((handle: SeriesApi<'Line', Time>) => handle.setData(data([10, 20, 30])));
		marker.setMarkers([{ time: 20 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		let reads = 0;
		const dataByIndex = handles[0].dataByIndex.bind(handles[0]);
		handles[0].dataByIndex = (...args: Parameters<typeof dataByIndex>) => { reads++; return dataByIndex(...args); };
		const generation = timeScalePointsGeneration(api.timeScale());
		handles[1].update({ time: 30 as UTCTimestamp, value: 20 });
		marker.updateAllViews();
		model.timeScale().setRightOffset(5);
		model.recalculateAllPanes();
		expect(timeScalePointsGeneration(api.timeScale())).to.equal(generation);
		expect(reads).to.equal(0);
	});

	it('handles empty data and prepended shared points', () => {
		const { handles, marker } = setup();
		handles[0].setData(data([20, 30]));
		marker.setMarkers([{ time: 30 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		expect(index(marker)).to.equal(1);
		handles[1].setData(data([5, 10]));
		expect(index(marker)).to.equal(3);
		handles[0].setData([]);
		expect(index(marker)).to.equal(undefined);
		handles[0].setData(data([20, 30]));
		expect(index(marker)).to.equal(3);
		handles[1].setData([]);
		expect(index(marker)).to.equal(1);
	});

	it('selects the same first fulfilled row with leading or all whitespace', () => {
		const { handles, marker } = setup();
		for (const rows of [[], [{ time: 10 as UTCTimestamp }], [{ time: 10 as UTCTimestamp }, ...data([20, 30])]]) {
			handles[0].setData(rows);
			expect(handles[0].dataByIndex(0, MismatchDirection.NearestRight)).to.deep.equal(handles[0].data()[0] ?? null);
			marker.setMarkers([{ time: 10 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
			expect(index(marker)).to.equal(rows.length === 3 ? 1 : undefined);
		}
	});

	it('selects the same first custom-series row while excluding custom whitespace', () => {
		const { api } = setup();
		const custom = api.addCustomSeries({
			renderer: () => ({ draw: () => {} }),
			update: () => {},
			priceValueBuilder: (row: CustomData<Time>) => [(row as CustomData<Time> & { value: number }).value],
			isWhitespace: (row: CustomData<Time>): row is CustomSeriesWhitespaceData<Time> => !Object.prototype.hasOwnProperty.call(row, 'value'),
			defaultOptions: () => ({ ...clone(seriesOptionsDefaults), color: 'blue' }),
		});
		for (const rows of [[], [{ time: 10 as UTCTimestamp }], [{ time: 10 as UTCTimestamp }, ...data([20, 30])]]) {
			custom.setData(rows);
			expect(custom.dataByIndex(0, MismatchDirection.NearestRight)).to.deep.equal(custom.data()[0] ?? null);
		}
	});

	it('reindexes after detach and reattach', () => {
		const { api, model, handles, marker } = setup();
		handles[0].setData(data([10, 30]));
		handles[1].setData(data([10, 20, 30, 40]));
		marker.setMarkers([{ time: 30 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		marker.detached();
		handles[1].setData(data([10, 30, 35, 40]));
		marker.attached({ chart: api, series: handles[0], requestUpdate: () => {}, horzScaleBehavior: new HorzScaleBehaviorTime() });
		model.recalculateAllPanes();
		expect(index(marker)).to.equal(1);
	});

	it('falls back to remapping when a time scale has no shared helper entry', () => {
		const { api, model, handles, marker } = setup();
		handles[0].setData(data([10, 30]));
		handles[1].setData(data([10, 20, 30, 40]));
		const original = api.timeScale();
		const foreignTimeScale = new Proxy(original, { get: (target: typeof original, key: keyof typeof original) => {
			const value = target[key];
			return typeof value === 'function' ? value.bind(target) : value;
		} });
		const foreignChart = Object.create(api) as ChartApi<Time>;
		foreignChart.timeScale = () => foreignTimeScale;
		expect(timeScalePointsGeneration(foreignTimeScale)).to.equal(undefined);
		marker.detached();
		marker.attached({ chart: foreignChart, series: handles[0], requestUpdate: () => {}, horzScaleBehavior: new HorzScaleBehaviorTime() });
		marker.setMarkers([{ time: 30 as UTCTimestamp, position: 'inBar', color: 'red', shape: 'circle' }]);
		expect(index(marker)).to.equal(2);
		handles[1].setData(data([10, 30, 35, 40]));
		model.recalculateAllPanes();
		expect(index(marker)).to.equal(1);
	});
});
