/* eslint-disable @typescript-eslint/no-floating-promises */
import * as chai from 'chai';
import { expect } from 'chai';
import chaiExclude from 'chai-exclude';
import { beforeEach, describe, it } from 'node:test';

import { LineData } from '../../src/model/data-consumer';
import { DataLayer } from '../../src/model/data-layer';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { PlotList } from '../../src/model/plot-list';
import { Series } from '../../src/model/series';
import { SeriesType } from '../../src/model/series-options';

chai.use(chaiExclude);

function createMockSeries<TSeriesType extends SeriesType = 'Line'>(
	seriesType: TSeriesType = 'Line' as TSeriesType,
	isConflated: boolean = false
): Series<TSeriesType> {
	const data = new PlotList();
	return {
		bars: () => data,
		seriesType: () => seriesType,
		customSeriesPlotValuesBuilder: () => {},
		customSeriesWhitespaceCheck: () => {},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		_options: { conflationThresholdFactor: 1.0 },
		isConflationEnabled: (): boolean => {
			return isConflated;
		},
		updateLastConflatedChunk: () => {},
		model: () => ({
			timeScale: () => ({
				options: () => ({
					enableConflation: isConflated,
					conflationThresholdFactor: 1.0,
				}),
				barSpacing: () => 2.0,
				conflationFactor: () => (isConflated ? 2 : 1),
			}),
		}),
	} as unknown as Series<TSeriesType>;
}

function createLineData(time: number, value: number): LineData<Time> {
	return { time: time as Time, value };
}

describe('Conflation Integration Tests', () => {
	let dataLayer: DataLayer<Time>;
	let behavior: HorzScaleBehaviorTime;

	beforeEach(() => {
		behavior = new HorzScaleBehaviorTime();
		dataLayer = new DataLayer(behavior);
	});

	describe('Historical Update Error Handling', () => {
		it('should throw error for Line series when historicalUpdate=true and conflation is enabled', () => {
			const data = createLineData(1000, 100);
			expect(() => {
				const series = createMockSeries('Line', true);
				dataLayer.updateSeriesData(series, data, true);
			}).to.throw('Historical updates are not supported when conflation is enabled');
		});

		it('should throw error for Bar series when historicalUpdate=true and conflation is enabled', () => {
			const data = createLineData(1000, 100);
			expect(() => {
				const series = createMockSeries('Bar', true);
				dataLayer.updateSeriesData(series, data, true);
			}).to.throw('Historical updates are not supported when conflation is enabled');
		});
	});

	describe('Series Update Method with Conflation', () => {
		it('should use efficient conflation update for last bar changes', () => {
			const series = createMockSeries('Line', true);
			let updateLastChunkCalled = false;
			series.updateLastConflatedChunk = () => {
				updateLastChunkCalled = true;
			};

			const initialData = [createLineData(1000, 100), createLineData(1001, 101)];
			dataLayer.setSeriesData(series, initialData);

			const lastBarUpdate = createLineData(1001, 102);
			dataLayer.updateSeriesData(series, lastBarUpdate, false);

			expect(updateLastChunkCalled).to.be.equal(true);
		});

		it('should not use efficient update for new bars', () => {
			const series = createMockSeries('Line', true);
			let updateLastChunkCalled = false;
			series.updateLastConflatedChunk = () => {
				updateLastChunkCalled = true;
			};

			const initialData = [createLineData(1000, 100), createLineData(1001, 101)];
			dataLayer.setSeriesData(series, initialData);

			const newBar = createLineData(1002, 102);
			dataLayer.updateSeriesData(series, newBar, false);

			expect(updateLastChunkCalled).to.be.equal(false);
		});

		it('should handle many rapid updates to the same bar efficiently', () => {
			const series = createMockSeries('Line', true);
			let updateLastChunkCalled = false;
			series.updateLastConflatedChunk = () => {
				updateLastChunkCalled = true;
			};

			const initialData = [createLineData(1000, 100)];
			dataLayer.setSeriesData(series, initialData);

			for (let i = 0; i < 10; i++) {
				dataLayer.updateSeriesData(series, createLineData(1000, 100 + i), false);
			}

			expect(updateLastChunkCalled).to.be.equal(true);
		});
	});

	describe('Conflation State Management', () => {
		it('should correctly report conflation enabled state', () => {
			const conflatedSeries = createMockSeries('Line', true);
			const nonConflatedSeries = createMockSeries('Line', false);
			expect(conflatedSeries.isConflationEnabled()).to.be.equal(true);
			expect(nonConflatedSeries.isConflationEnabled()).to.be.equal(false);
		});
	});
});
