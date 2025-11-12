/* eslint-disable @typescript-eslint/no-floating-promises */
import * as chai from 'chai';
import { expect } from 'chai';
import chaiExclude from 'chai-exclude';
import { beforeEach, describe, it } from 'node:test';

import { CONFLATION_LEVELS, MAX_CONFLATION_LEVEL } from '../../src/model/conflation/constants';
import { DataConflater } from '../../src/model/data-conflater';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { CustomConflationContext, CustomConflationReducer, CustomData } from '../../src/model/icustom-series';
import { InternalHorzScaleItem } from '../../src/model/ihorz-scale-behavior';
import { SeriesPlotRow } from '../../src/model/series-data';
import { SeriesType } from '../../src/model/series-options';
import { TimePointIndex } from '../../src/model/time-data';

chai.use(chaiExclude);

interface TestCustomData extends CustomData<Time> {
	value: number;
	custom: string;
}

const mockCustomReducer: CustomConflationReducer<unknown> = (
	item1: CustomConflationContext<unknown, CustomData<unknown>>,
	item2: CustomConflationContext<unknown, CustomData<unknown>>
): CustomData<unknown> => {
	const data1 = item1.data as TestCustomData;
	const data2 = item2.data as TestCustomData;
	const value1 = data1.value;
	const value2 = data2.value;
	const custom1 = data1.custom;
	const custom2 = data2.custom;

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	const result = {
		value: (value1 + value2) / 2,
		custom: `${custom1}+${custom2}`,
		time: item2.originalTime,
	} as TestCustomData;

	return result;
};

function createTestData(count: number, baseTime: number = 1000): SeriesPlotRow<'Bar'>[] {
	const data: SeriesPlotRow<'Bar'>[] = [];
	for (let i = 0; i < count; i++) {
		data.push({
			index: i as TimePointIndex,
			time: (baseTime + i) as unknown as InternalHorzScaleItem,
			originalTime: (baseTime + i),
			value: [i, i + 10, i - 5, i + 5],
		});
	}
	return data;
}

function createCustomTestData(count: number, baseTime: number = 1000): SeriesPlotRow<'Custom'>[] {
	const data: SeriesPlotRow<'Custom'>[] = [];
	for (let i = 0; i < count; i++) {
		data.push({
			index: i as TimePointIndex,
			time: (baseTime + i) as unknown as InternalHorzScaleItem,
			originalTime: (baseTime + i),
			value: [i, i + 10, i - 5, i + 5],
			data: { value: i, custom: `item-${i}`, time: (baseTime + i) as unknown as Time } satisfies TestCustomData,
		});
	}
	return data;
}

const mockPriceValueBuilder = (item: unknown): number[] => {
	const data = item as TestCustomData;
	return [data.value];
};

function getCustomData(row: SeriesPlotRow<'Custom'>): TestCustomData {
	return (row as SeriesPlotRow<'Custom'> & { data: TestCustomData }).data;
}

describe('DataConflater', () => {
	let conflater: DataConflater<SeriesType>;
	let customConflater: DataConflater<'Custom'>;

	beforeEach(() => {
		conflater = new DataConflater<SeriesType>();
		customConflater = new DataConflater<'Custom'>();
	});

	describe('Levels and Limits', () => {
		it('uses power-of-2 levels', () => {
			expect(CONFLATION_LEVELS).to.deep.equal([2, 4, 8, 16, 32, 64, 128, 256, 512]);
			expect(MAX_CONFLATION_LEVEL).to.equal(512);
		});

		it('normalizes levels to power-of-2', () => {
			const data = createTestData(10);
			const result3 = conflater.conflateByFactor(data, 3);
			const result5 = conflater.conflateByFactor(data, 5);
			const result9 = conflater.conflateByFactor(data, 9);

			expect(result3.length).to.equal(2);
			expect(result5.length).to.equal(1);
			expect(result9.length).to.equal(1);
		});

		it('respects max level limit', () => {
			expect(conflater.calculateConflationLevelWithSmoothing(0.0001, 1, 1.0)).to.equal(MAX_CONFLATION_LEVEL);
		});

		it('handles empty data and factor 1', () => {
			const data = createTestData(10);
			expect(conflater.conflateByFactor([], 2)).to.deep.equal([]);
			expect(conflater.conflateByFactor(data, 1)).to.deep.equal(data);
		});
	});

	describe('DPR and Smoothing', () => {
		it('calculates levels with DPR', () => {
			const dpr = 1;
			const smoothing = 1.0;
			expect(conflater.calculateConflationLevelWithSmoothing(2.0, dpr, smoothing)).to.equal(1);
			expect(conflater.calculateConflationLevelWithSmoothing(1.0, dpr, smoothing)).to.equal(1);
			expect(conflater.calculateConflationLevelWithSmoothing(0.5, dpr, smoothing)).to.equal(2);
			expect(conflater.calculateConflationLevelWithSmoothing(0.25, dpr, smoothing)).to.equal(4);
			expect(conflater.calculateConflationLevelWithSmoothing(0.125, dpr, smoothing)).to.equal(8);
		});

		it('applies smoothing factor', () => {
			const barSpacing = 0.3;
			const devicePixelRatio = 1;

			expect(conflater.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 1.0)).to.equal(2);
			expect(conflater.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 2.0)).to.equal(4);
			expect(conflater.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 4.0)).to.equal(8);
		});

		it('handles extreme inputs', () => {
			const barSpacing = 0.001;
			const devicePixelRatio = 1;

			const extremeLevel = conflater.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 1000);
			expect(extremeLevel).to.equal(MAX_CONFLATION_LEVEL);

			const lowLevel = conflater.calculateConflationLevelWithSmoothing(barSpacing, devicePixelRatio, 0.1);
			expect(lowLevel).to.be.at.least(1);
		});
	});

	describe('Remainder Handling', () => {
		it('handles 7 items as (2,2,3)', () => {
			const data = createTestData(7);
			const result = conflater.conflateByFactor(data, 2);
			expect(result.length).to.equal(3);
		});

		it('merges 3 items into 1', () => {
			const data = createTestData(3);
			const result = conflater.conflateByFactor(data, 2);
			expect(result.length).to.equal(1);
		});

		it('handles exact multiples', () => {
			const data = createTestData(16);
			const result = conflater.conflateByFactor(data, 8);
			expect(result.length).to.equal(2);
		});

		it('handles single item', () => {
			const data = createTestData(1);
			const result = conflater.conflateByFactor(data, 2);
			expect(result.length).to.equal(1);
			expect(result[0].index).to.equal(data[0].index);
			expect(result[0].time).to.equal(data[0].time);
			expect(result[0].originalDataCount).to.equal(1);
		});
	});

	describe('Recursive vs Direct Building', () => {
		function createRecursiveTestData(count: number): SeriesPlotRow<'Line'>[] {
			const data: SeriesPlotRow<'Line'>[] = [];
			const now = Date.now() / 1000;
			let price = 100;

			for (let i = 0; i < count; i++) {
				price += (Math.random() - 0.5) * 2;
				data.push({
					index: i as TimePointIndex,
					time: (now + i) as unknown as InternalHorzScaleItem,
					originalTime: now + i,
					value: [price, price, price, price],
				});
			}
			return data;
		}

		it('produces identical results for level 4', () => {
			const testData = createRecursiveTestData(64);

			const directResult = conflater.conflateByFactor(testData, 4);

			const level2Result = conflater.conflateByFactor(testData, 2);
			const recursiveResult = conflater.conflateByFactor(level2Result, 2);

			expect(recursiveResult).to.have.length(directResult.length);
			for (let i = 0; i < directResult.length; i++) {
				expect(recursiveResult[i].time).to.equal(directResult[i].time);
				expect(recursiveResult[i].value).to.deep.equal(directResult[i].value);
				expect(recursiveResult[i].index).to.equal(directResult[i].index);
			}
		});

		it('produces identical results for level 8', () => {
			const testData = createRecursiveTestData(256);

			const directResult = conflater.conflateByFactor(testData, 8);

			let stepByStepData: readonly SeriesPlotRow<'Line'>[] = testData;
			stepByStepData = conflater.conflateByFactor(stepByStepData, 2);
			stepByStepData = conflater.conflateByFactor(stepByStepData, 2);
			stepByStepData = conflater.conflateByFactor(stepByStepData, 2);

			expect(stepByStepData.length).to.equal(directResult.length);
			for (let i = 0; i < directResult.length; i++) {
				expect(stepByStepData[i].time).to.equal(directResult[i].time);
				expect(stepByStepData[i].value).to.deep.equal(directResult[i].value);
				expect(stepByStepData[i].index).to.equal(directResult[i].index);
			}
		});

		it('works with custom series recursion', () => {
			const testData = createCustomTestData(4);

			const directResult = customConflater.conflateByFactor(testData, 4, mockCustomReducer, true, mockPriceValueBuilder);

			let stepByStepData: readonly SeriesPlotRow<'Custom'>[] = testData;
			stepByStepData = customConflater.conflateByFactor(stepByStepData, 2, mockCustomReducer, true, mockPriceValueBuilder);
			stepByStepData = customConflater.conflateByFactor(stepByStepData, 2, mockCustomReducer, true, mockPriceValueBuilder);
			const recursiveResult = stepByStepData;

			expect(recursiveResult).to.have.length(directResult.length);

			if (directResult.length > 0) {
				expect(recursiveResult[0].value).to.deep.equal(directResult[0].value);
				const recursiveData = getCustomData(recursiveResult[0]);
				const directData = getCustomData(directResult[0]);
				expect(recursiveData).to.deep.equal(directData);
				expect(recursiveData.value).to.equal(1.5);
			}
		});
	});

	describe('Custom Series Remainders', () => {
		it('folds 3 items via chunk+row merging', () => {
			const data = createCustomTestData(3);
			const by2 = customConflater.conflateByFactor(data, 2, mockCustomReducer, true, mockPriceValueBuilder);
			expect(by2).to.have.length(1);
			const agg = getCustomData(by2[0]);
			expect(agg.custom).to.equal('item-0+item-1+item-2');
		});

		it('handles streaming remainder merging', () => {
			const data = createCustomTestData(5);
			const result = customConflater.conflateByFactor(data, 2, mockCustomReducer, true, mockPriceValueBuilder);

			// 5 items: (2, 2, 1) -> remainder 1 folds into previous chunk -> 2 chunks total
			expect(result).to.have.length(2);

			// First chunk: items 0,1 -> 'item-0+item-1'
			const firstChunk = getCustomData(result[0]);
			expect(firstChunk.custom).to.equal('item-0+item-1');

			// Second chunk: items 2,3,4 -> 'item-2+item-3+item-4' (via chunk+row merging)
			const secondChunk = getCustomData(result[1]);
			expect(secondChunk.custom).to.equal('item-2+item-3+item-4');
		});
	});

	describe('Merge Range Parity', () => {
		it('maintains update parity with full rebuild', () => {
			const originalData = createCustomTestData(8);

			// Set initial conflation
			const initialResult = customConflater.conflateByFactor(originalData, 4, mockCustomReducer, true, mockPriceValueBuilder);
			expect(initialResult.length).to.equal(2);

			// Update last item and use efficient update
			const newLastItem: SeriesPlotRow<'Custom'> = {
				...originalData[7],
				data: { value: 777, custom: 'updated-item-7', time: originalData[7].originalTime as Time } satisfies TestCustomData,
			} satisfies SeriesPlotRow<'Custom'>;
			const updatedResult = customConflater.updateLastConflatedChunk(
				originalData,
				newLastItem,
				4,
				mockCustomReducer,
				true,
				mockPriceValueBuilder
			);

			// Compare with full rebuild for parity
			const newData = [...originalData.slice(0, 7), newLastItem];
			const fullRebuild = customConflater.conflateByFactor(newData, 4, mockCustomReducer, true, mockPriceValueBuilder);

			expect(updatedResult.length).to.equal(fullRebuild.length);
			for (let i = 0; i < fullRebuild.length; i++) {
				expect(updatedResult[i].time).to.equal(fullRebuild[i].time);
				const updatedCustomData = getCustomData(updatedResult[i]);
				const fullRebuildCustomData = getCustomData(fullRebuild[i]);
				expect(updatedCustomData.custom).to.equal(fullRebuildCustomData.custom);
			}
		});

		it('handles merge range with single item', () => {
			const data = createTestData(1);
			const result = conflater.conflateByFactor(data, 2);

			expect(result.length).to.equal(1);
			expect(result[0].value).to.deep.equal([0, 10, -5, 5]);
			expect(result[0].originalDataCount).to.equal(1);
		});
	});

	describe('OHLC Integrity', () => {
		it('merges OHLC values correctly', () => {
			const data: SeriesPlotRow<'Bar'>[] = [
				{
					index: 0 as TimePointIndex,
					time: 1000 as unknown as InternalHorzScaleItem,
					originalTime: 1000,
					value: [10, 12, 8, 11],
				},
				{
					index: 1 as TimePointIndex,
					time: 1001 as unknown as InternalHorzScaleItem,
					originalTime: 1001,
					value: [11, 15, 9, 14],
				},
			];

			const result = conflater.conflateByFactor(data, 2);

			expect(result.length).to.equal(1);
			const chunk = result[0];
			expect(chunk.value[0]).to.equal(10);
			expect(chunk.value[1]).to.equal(15);
			expect(chunk.value[2]).to.equal(8);
			expect(chunk.value[3]).to.equal(14);
		});

		it('handles maximum conflation level', () => {
			const data = createTestData(1000);
			const result = conflater.conflateByFactor(data, MAX_CONFLATION_LEVEL);
			expect(result.length).to.be.at.least(1);
			expect(result.length).to.be.lessThan(data.length);
			expect(result.length).to.equal(1);

			expect(result[0].originalDataCount).to.be.greaterThan(1);
			expect(result[0].originalDataCount).to.equal(1000);
		});
	});

	describe('Defensive Programming', () => {
		it('prevents priceValueBuilder(undefined) access', () => {
			const data = [
				{ index: 0 as TimePointIndex, time: 1000 as unknown as InternalHorzScaleItem, originalTime: 1000, value: [1, 2, 0, 1], data: { value: 1, custom: 'a', time: 1000 } },
				{ index: 1 as TimePointIndex, time: 1001 as unknown as InternalHorzScaleItem, originalTime: 1001, value: [2, 3, 1, 2], data: { value: 2, custom: 'b', time: 1001 } },
				{ index: 2 as TimePointIndex, time: 1002 as unknown as InternalHorzScaleItem, originalTime: 1002, value: [3, 4, 2, 3], data: { value: 3, custom: 'c', time: 1002 } },
			] as SeriesPlotRow<'Custom'>[];

			// by 2 => (0,1) and remainder (2) should fold into previous without throwing
			const by2 = customConflater.conflateByFactor(
				data,
				2,
				mockCustomReducer,
				true,
				mockPriceValueBuilder
			);

			expect(by2.length).to.equal(1);

			// Verify the result contains properly aggregated data
			const result = by2[0];
			expect(result).to.have.property('data');
			const customData = result.data as unknown as TestCustomData;
			expect(customData.custom).to.equal('a+b+c'); // All three items should be merged
			expect(customData.value).to.equal(2.25); // First (1+2)/2=1.5, then (1.5+3)/2=2.25
		});

		it('handles single item edge case', () => {
			const singleItem = [
				{ index: 0 as TimePointIndex, time: 1000 as unknown as InternalHorzScaleItem, originalTime: 1000, value: [1, 1, 1, 1], data: { value: 5, custom: 'single', time: 1000 } },
			] as SeriesPlotRow<'Custom'>[];

			// Should not throw even with conflation factor > 1
			const result = customConflater.conflateByFactor(
				singleItem,
				2,
				mockCustomReducer,
				true,
				mockPriceValueBuilder
			);

			expect(result.length).to.equal(1);
			const customData = result[0].data as unknown as TestCustomData;
			expect(customData.custom).to.equal('single');
			expect(customData.value).to.equal(5);
		});

		it('handles empty data edge case', () => {
			const result = customConflater.conflateByFactor(
				[],
				2,
				mockCustomReducer,
				true,
				mockPriceValueBuilder
			);

			expect(result.length).to.equal(0);
		});
	});
});
