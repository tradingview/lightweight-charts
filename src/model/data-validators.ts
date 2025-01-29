/// <reference types="_build-time-constants" />

import { assert } from '../helpers/assertions';

import { isFulfilledData, OhlcData, SeriesDataItemTypeMap } from './data-consumer';
import { IHorzScaleBehavior } from './ihorz-scale-behavior';
import { CreatePriceLineOptions } from './price-line-options';
import { SeriesType } from './series-options';

export function checkPriceLineOptions(options: CreatePriceLineOptions): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	assert(typeof options.price === 'number', `the type of 'price' price line's property must be a number, got '${typeof options.price}'`);
}

export function checkItemsAreOrdered<HorzScaleItem>(data: readonly (SeriesDataItemTypeMap<HorzScaleItem>[SeriesType])[], bh: IHorzScaleBehavior<HorzScaleItem>, allowDuplicates: boolean = false): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	if (data.length === 0) {
		return;
	}

	let prevTime = bh.key(data[0].time);
	for (let i = 1; i < data.length; ++i) {
		const currentTime = bh.key(data[i].time);
		const checkResult = allowDuplicates ? prevTime <= currentTime : prevTime < currentTime;
		assert(checkResult, `data must be asc ordered by time, index=${i}, time=${currentTime}, prev time=${prevTime}`);
		prevTime = currentTime;
	}
}

export function checkSeriesValuesType<HorzScaleItem>(type: SeriesType, data: readonly SeriesDataItemTypeMap<HorzScaleItem>[SeriesType][]): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	data.forEach(getChecker<HorzScaleItem>(type));
}

type Checker<HorzScaleItem> = (item: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]) => void;

export function getChecker<HorzScaleItem>(type: SeriesType): Checker<HorzScaleItem> {
	switch (type) {
		case 'Bar':
		case 'Candlestick':
			return checkBarItem.bind(null, type);

		case 'Area':
		case 'Baseline':
		case 'Line':
		case 'Histogram':
			return checkLineItem.bind(null, type);

		case 'Custom':
			return checkCustomItem.bind(null);
	}
}

function checkBarItem<HorzScaleItem>(
	type: 'Bar' | 'Candlestick',
	barItem: SeriesDataItemTypeMap<HorzScaleItem>[typeof type]
): void {
	if (!isFulfilledData(barItem)) {
		return;
	}
	(['open', 'high', 'low', 'close'] as (keyof OhlcData)[]).forEach((key: keyof OhlcData) => {
		assert(
			typeof barItem[key] === 'number',
			`${type} series item data value of ${key} must be a number, got=${typeof barItem[key]}, value=${
				barItem[key]
			}`
		);

		assert(
			isSafeValue(barItem[key]),
			`${type} series item data value of ${key} must be between ${MIN_SAFE_VALUE.toPrecision(16)} and ${MAX_SAFE_VALUE.toPrecision(16)}, got=${typeof barItem[key]}, value=${
				barItem[key]
			}`
		);
	});
}

function checkLineItem<HorzScaleItem>(
	type: 'Area' | 'Baseline' | 'Line' | 'Histogram',
	lineItem: SeriesDataItemTypeMap<HorzScaleItem>[typeof type]
): void {
	if (!isFulfilledData(lineItem)) {
		return;
	}

	assert(
		typeof lineItem.value === 'number',
		`${type} series item data value must be a number, got=${typeof lineItem.value}, value=${
			lineItem.value
		}`
	);

	assert(
		isSafeValue(lineItem.value),
		`${type} series item data value must be between ${MIN_SAFE_VALUE.toPrecision(16)} and ${MAX_SAFE_VALUE.toPrecision(16)}, got=${typeof lineItem.value}, value=${
			lineItem.value
		}`
	);
}

function checkCustomItem(
	// type: 'Custom',
	// customItem: SeriesDataItemTypeMap[typeof type]
): void {
	// Nothing to check yet...
	return;
}

const MIN_SAFE_VALUE = Number.MIN_SAFE_INTEGER / 100;
const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 100;

function isSafeValue(value: number): boolean {
	return value >= MIN_SAFE_VALUE && value <= MAX_SAFE_VALUE;
}
