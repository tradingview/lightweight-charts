import { assert } from '../helpers/assertions';

import { IHorzScaleBehavior } from '../model/ihorz-scale-behavior';
import { CreatePriceLineOptions } from '../model/price-line-options';
import { SeriesMarker } from '../model/series-markers';
import { SeriesType } from '../model/series-options';

import { isFulfilledData, SeriesDataItemTypeMap } from '../model/data-consumer';

export function checkPriceLineOptions(options: CreatePriceLineOptions): void {
	if (process.env.NODE_ENV === 'production') {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/tslint/config
	assert(typeof options.price === 'number', `the type of 'price' price line's property must be a number, got '${typeof options.price}'`);
}

export function checkItemsAreOrdered<HorzScaleItem>(data: readonly (SeriesMarker<HorzScaleItem, HorzScaleItem> | SeriesDataItemTypeMap<HorzScaleItem>[SeriesType])[], bh: IHorzScaleBehavior<HorzScaleItem>, allowDuplicates: boolean = false): void {
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

function getChecker<HorzScaleItem>(type: SeriesType): Checker<HorzScaleItem> {
	switch (type) {
		case 'Bar':
		case 'Candlestick':
			return checkBarItem.bind(null, type);

		case 'Area':
		case 'Baseline':
		case 'Line':
		case 'Histogram':
			return checkLineItem.bind(null, type);
	}
}

function checkBarItem<HorzScaleItem>(
	type: 'Bar' | 'Candlestick',
	barItem: SeriesDataItemTypeMap<HorzScaleItem>[typeof type]
): void {
	if (!isFulfilledData(barItem)) {
		return;
	}

	assert(
		// eslint-disable-next-line @typescript-eslint/tslint/config
		typeof barItem.open === 'number',
		`${type} series item data value of open must be a number, got=${typeof barItem.open}, value=${
			barItem.open
		}`
	);
	assert(
		// eslint-disable-next-line @typescript-eslint/tslint/config
		typeof barItem.high === 'number',
		`${type} series item data value of high must be a number, got=${typeof barItem.high}, value=${
			barItem.high
		}`
	);
	assert(
		// eslint-disable-next-line @typescript-eslint/tslint/config
		typeof barItem.low === 'number',
		`${type} series item data value of low must be a number, got=${typeof barItem.low}, value=${
			barItem.low
		}`
	);
	assert(
		// eslint-disable-next-line @typescript-eslint/tslint/config
		typeof barItem.close === 'number',
		`${type} series item data value of close must be a number, got=${typeof barItem.close}, value=${
			barItem.close
		}`
	);
}

function checkLineItem<HorzScaleItem>(
	type: 'Area' | 'Baseline' | 'Line' | 'Histogram',
	lineItem: SeriesDataItemTypeMap<HorzScaleItem>[typeof type]
): void {
	if (!isFulfilledData(lineItem)) {
		return;
	}

	assert(
		// eslint-disable-next-line @typescript-eslint/tslint/config
		typeof lineItem.value === 'number',
		`${type} series item data value must be a number, got=${typeof lineItem.value}, value=${
			lineItem.value
		}`
	);
}
