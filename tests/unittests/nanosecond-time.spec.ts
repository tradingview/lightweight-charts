/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { TimeFormatter } from '../../src/formatters/time-formatter';
import { ChartOptionsImpl } from '../../src/model/chart-model';
import { DataLayer } from '../../src/model/data-layer';
import { defaultTickMarkFormatter } from '../../src/model/horz-scale-behavior-time/default-tick-mark-formatter';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { fillWeightsForPoints } from '../../src/model/horz-scale-behavior-time/time-scale-point-weight-generator';
import {
	convertStringsToBusinessDays,
	convertTime,
	isISODateTimeString,
	selectTimeConverter,
} from '../../src/model/horz-scale-behavior-time/time-utils';
import {
	BusinessDay,
	formatNanosFraction,
	fractionalDigitsForNanos,
	isBusinessDay,
	isUTCTimestampNanoseconds,
	TickMarkType,
	TickMarkWeight,
	Time,
	TimePoint,
	UTCTimestamp,
	UTCTimestampNanoseconds,
} from '../../src/model/horz-scale-behavior-time/types';
import { InternalHorzScaleItemKey } from '../../src/model/ihorz-scale-behavior';
import { PlotList } from '../../src/model/plot-list';
import { Series } from '../../src/model/series';
import { SeriesType } from '../../src/model/series-options';
import { TimePointIndex, TimeScalePoint } from '../../src/model/time-data';

const NS = 1_000_000_000n;

function asTimePoint(item: unknown): TimePoint {
	return item as unknown as TimePoint;
}

function nsTime(value: bigint): UTCTimestampNanoseconds {
	return value as unknown as UTCTimestampNanoseconds;
}

function createSeriesMock<T extends SeriesType = SeriesType>(seriesType?: T, allowDuplicateTimes: boolean = false): Series<T> {
	const data = new PlotList();
	return {
		bars: () => data,
		conflatedBars: () => data,
		seriesType: () => seriesType || 'Line',
		customSeriesPlotValuesBuilder: () => {},
		customSeriesWhitespaceCheck: () => {},
		isConflationEnabled: () => false,
		allowDuplicateTimes: () => allowDuplicateTimes,
		updateLastConflatedChunk: () => {},
		model: () => ({
			timeScale: () => ({
				options: () => ({ enableConflation: false }),
				conflationFactor: () => 1,
			}),
		}),
	} as unknown as Series<T>;
}

function createBehavior(options?: { timeVisible?: boolean; secondsVisible?: boolean; tickMarkMaxCharacterLength?: number }): HorzScaleBehaviorTime {
	const behavior = new HorzScaleBehaviorTime();
	behavior.setOptions({
		timeScale: {
			timeVisible: options?.timeVisible ?? true,
			secondsVisible: options?.secondsVisible ?? true,
			tickMarkMaxCharacterLength: options?.tickMarkMaxCharacterLength ?? 0,
		},
		localization: { locale: 'en-US', dateFormat: 'yyyy-MM-dd' },
	} as unknown as ChartOptionsImpl<Time>);
	return behavior;
}

describe('nanosecond time values', () => {
	describe('guards', () => {
		it('should detect nanosecond timestamps and keep them out of the business day branch', () => {
			expect(isUTCTimestampNanoseconds(nsTime(1n))).to.equal(true);
			expect(isUTCTimestampNanoseconds(1000 as UTCTimestamp)).to.equal(false);
			expect(isUTCTimestampNanoseconds('2024-05-01' as Time)).to.equal(false);

			// a bigint must not be mistaken for a business day
			expect(isBusinessDay(nsTime(1n) as unknown as Time)).to.equal(false);
			expect(isBusinessDay({ year: 2024, month: 5, day: 1 })).to.equal(true);
		});

		it('should tell date-time strings from date-only strings', () => {
			expect(isISODateTimeString('2024-05-01')).to.equal(false);
			expect(isISODateTimeString('2024-05-01T12:00:00Z')).to.equal(true);
			expect(isISODateTimeString('2024-05-01T12:00:00.123456789Z')).to.equal(true);
		});

		it('should select the matching converter from the first item', () => {
			const numberConverter = selectTimeConverter([{ time: 1000 as UTCTimestamp }]);
			expect(numberConverter).to.not.equal(null);
			expect(asTimePoint(numberConverter?.(1000 as UTCTimestamp))).to.deep.equal({ timestamp: 1000 });

			const nanoConverter = selectTimeConverter([{ time: nsTime(1000n) }]);
			const nanoPoint = asTimePoint(nanoConverter?.(nsTime(1700000000123456789n)));
			expect(nanoPoint).to.deep.equal({ timestamp: 1700000000, nanos: 123456789 });

			const isoConverter = selectTimeConverter([{ time: '2024-05-01T12:00:00.000000001Z' }]);
			expect(asTimePoint(isoConverter?.('2024-05-01T12:00:00.000000001Z' as Time)).nanos).to.equal(1);

			const businessDayConverter = selectTimeConverter([{ time: '2024-05-01' }]);
			expect(asTimePoint(businessDayConverter?.('2024-05-01' as Time)).businessDay)
				.to.deep.equal({ year: 2024, month: 5, day: 1 });

			expect(selectTimeConverter([])).to.equal(null);
		});
	});

	describe('converters', () => {
		it('should split a nanosecond timestamp exactly', () => {
			const point = asTimePoint(convertTime(nsTime(1700000000123456789n)));

			expect(point.timestamp).to.equal(1700000000);
			expect(point.nanos).to.equal(123456789);
		});

		it('should keep nanosecond precision which a number would lose', () => {
			const first = asTimePoint(convertTime(nsTime(1700000000000000001n)));
			const second = asTimePoint(convertTime(nsTime(1700000000000000002n)));

			expect(first.timestamp).to.equal(second.timestamp);
			expect(first.nanos).to.equal(1);
			expect(second.nanos).to.equal(2);
		});

		it('should handle timestamps before the epoch with a positive nanosecond part', () => {
			const point = asTimePoint(convertTime(nsTime(-1_500_000_000n)));

			expect(point.timestamp).to.equal(-2);
			expect(point.nanos).to.equal(500000000);
		});

		it('should parse an ISO date-time string with nine fractional digits', () => {
			const point = asTimePoint(convertTime('2024-05-01T12:00:00.123456789Z' as Time));

			expect(point.timestamp).to.equal(1714564800);
			expect(point.nanos).to.equal(123456789);
		});

		it('should parse ISO date-time strings with milliseconds, offsets and without a designator', () => {
			expect(asTimePoint(convertTime('2024-05-01T12:00:00.123Z' as Time)).nanos).to.equal(123000000);
			expect(asTimePoint(convertTime('2024-05-01T12:00:00.1Z' as Time)).nanos).to.equal(100000000);

			// 14:00+02:00 is 12:00Z
			const offset = asTimePoint(convertTime('2024-05-01T14:00:00.000000001+02:00' as Time));
			expect(offset.timestamp).to.equal(1714564800);
			expect(offset.nanos).to.equal(1);

			// no designator means UTC
			expect(asTimePoint(convertTime('2024-05-01T12:00:00Z' as Time)).timestamp)
				.to.equal(asTimePoint(convertTime('2024-05-01T12:00:00' as Time)).timestamp);
		});

		it('should reject malformed ISO date-time strings', () => {
			expect(() => convertTime('2024-05-01T12:00:00.1234567890Z' as Time)).to.throw();
			expect(() => convertTime('2024-05-01 12:00:00' as Time)).to.throw();
		});

		it('should not rewrite date-time strings into business days during preprocessing', () => {
			const data: { time: Time }[] = [
				{ time: '2024-05-01' as Time },
				{ time: '2024-05-02T00:00:00Z' as Time },
			];

			convertStringsToBusinessDays(data);

			expect(data[0].time).to.deep.equal({ year: 2024, month: 5, day: 1 } as BusinessDay);
			expect(data[1].time).to.equal('2024-05-02T00:00:00Z');
		});

		it('should keep the second-resolution conversions unchanged', () => {
			expect(convertTime(1554792010 as UTCTimestamp)).to.deep.equal({ timestamp: 1554792010 });
			expect(convertTime({ day: 1, month: 10, year: 2018 } as BusinessDay))
				.to.deep.equal({ timestamp: 1538352000, businessDay: { day: 1, month: 10, year: 2018 } });
		});
	});

	describe('keys', () => {
		const behavior = createBehavior();

		function keyOf(time: Time): InternalHorzScaleItemKey {
			return behavior.key(convertTime(time));
		}

		it('should produce distinct, ordered keys for adjacent nanoseconds', () => {
			const first = keyOf(nsTime(1700000000000000001n));
			const second = keyOf(nsTime(1700000000000000002n));

			expect(typeof first).to.equal('bigint');
			expect(first === second).to.equal(false);
			expect(first < second).to.equal(true);
		});

		it('should keep a nanosecond key equal to its epoch value', () => {
			expect(keyOf(nsTime(1700000000123456789n))).to.equal(1700000000123456789n);
			expect(keyOf('2024-05-01T12:00:00.123456789Z' as Time)).to.equal(1714564800123456789n);
		});

		it('should keep second-resolution keys numeric', () => {
			expect(keyOf(1700000000 as UTCTimestamp)).to.equal(1700000000);
			expect(typeof keyOf('2024-05-01' as Time)).to.equal('number');
		});

		it('should cache a key per time point', () => {
			const point = convertTime(nsTime(1700000000123456789n));
			expect(behavior.key(point)).to.equal(behavior.key(point));
		});

		it('should use the key as the label cache key', () => {
			const point = convertTime(nsTime(1700000000000000001n));
			expect(behavior.cacheKey(point)).to.equal(behavior.key(point));
		});
	});

	describe('tick mark weights', () => {
		function weightsFor(times: Time[]): number[] {
			const points = times.map(time => ({
				time: convertTime(time),
				timeWeight: 0,
				originalTime: time,
			})) as unknown as TimeScalePoint[];

			fillWeightsForPoints(points as unknown as TimeScalePoint[], 0);
			return points.map(point => point.timeWeight);
		}

		it('should classify sub-second differences', () => {
			const base = 1714564800000000000n;
			expect(weightsFor([nsTime(base), nsTime(base + 1n)])[1]).to.equal(TickMarkWeight.Nano);
			expect(weightsFor([nsTime(base), nsTime(base + 1_000n)])[1]).to.equal(TickMarkWeight.Micro);
			expect(weightsFor([nsTime(base), nsTime(base + 1_000_000n)])[1]).to.equal(TickMarkWeight.Milli);
			expect(weightsFor([nsTime(base), nsTime(base + NS)])[1]).to.equal(TickMarkWeight.Second);
		});

		it('should classify larger differences as before', () => {
			const base = 1714564800;
			expect(weightsFor([base as UTCTimestamp, (base + 60) as UTCTimestamp])[1]).to.equal(TickMarkWeight.Minute1);
			expect(weightsFor([base as UTCTimestamp, (base + 86400) as UTCTimestamp])[1]).to.equal(TickMarkWeight.Day);
		});

		it('should give duplicated times the weakest weight', () => {
			const point = nsTime(1714564800123456789n);
			expect(weightsFor([point, point])[1]).to.equal(TickMarkWeight.LessThanSecond);
		});

		it('should handle a nanosecond chart made only of duplicates', () => {
			const point = nsTime(1714564800123456789n);
			const weights = weightsFor([point, point, point]);
			expect(weights).to.deep.equal([TickMarkWeight.LessThanSecond, TickMarkWeight.LessThanSecond, TickMarkWeight.LessThanSecond]);
		});
	});

	describe('formatting', () => {
		function pointAt(timestamp: number, nanos: number): TimePoint {
			return { timestamp: timestamp as UTCTimestamp, nanos };
		}

		it('should append the fractional part at the precision of the tick mark type', () => {
			const point = pointAt(1714564800, 123456789);

			expect(defaultTickMarkFormatter(point, TickMarkType.TimeWithMilliseconds, 'en-US')).to.match(/\.123$/);
			expect(defaultTickMarkFormatter(point, TickMarkType.TimeWithMicroseconds, 'en-US')).to.match(/\.123456$/);
			expect(defaultTickMarkFormatter(point, TickMarkType.TimeWithNanoseconds, 'en-US')).to.match(/\.123456789$/);
			expect(defaultTickMarkFormatter(point, TickMarkType.TimeWithSeconds, 'en-US')).to.not.match(/\./);
		});

		it('should truncate (not round) the fractional part', () => {
			expect(formatNanosFraction(123456789, 3)).to.equal('123');
			expect(formatNanosFraction(999_999_999, 6)).to.equal('999999');
			expect(formatNanosFraction(456, 3)).to.equal('000');
			expect(formatNanosFraction(456, 9)).to.equal('000000456');
			expect(formatNanosFraction(undefined, 9)).to.equal('');
		});

		it('should pick lossless fractional digits for a value', () => {
			expect(fractionalDigitsForNanos(0)).to.equal(0);
			expect(fractionalDigitsForNanos(undefined)).to.equal(0);
			expect(fractionalDigitsForNanos(123000000)).to.equal(3);
			expect(fractionalDigitsForNanos(123456000)).to.equal(6);
			expect(fractionalDigitsForNanos(123456789)).to.equal(9);
		});

		it('should format the tooltip with an exact fraction', () => {
			const formatter = new TimeFormatter('%h:%m:%s%f');
			const date = new Date(1714564800 * 1000);

			expect(formatter.format(date, 123000000)).to.match(/12:00:00\.123$/);
			expect(formatter.format(date, 123456000)).to.match(/12:00:00\.123456$/);
			expect(formatter.format(date, 123456789)).to.match(/12:00:00\.123456789$/);
			expect(formatter.format(date, undefined)).to.match(/12:00:00$/);
			expect(formatter.format(date, 0)).to.match(/12:00:00$/);
		});

		it('should support a fixed nine-digit tooltip fraction', () => {
			const formatter = new TimeFormatter('%h:%m:%s%S');
			expect(formatter.format(new Date(1714564800 * 1000), 123000000)).to.match(/12:00:00\.123000000$/);
		});
	});

	describe('label width budget', () => {
		function pointsWithWeights(weights: number[]): TimeScalePoint[] {
			return weights.map(weight => ({
				time: convertTime(nsTime(1714564800000000000n)),
				timeWeight: weight,
				originalTime: undefined,
			})) as unknown as TimeScalePoint[];
		}

		const first = 0 as TimePointIndex;

		it('should ask for room for the fractional part', () => {
			const behavior = createBehavior();

			expect(behavior.maxTickMarkCharacterLength(pointsWithWeights([TickMarkWeight.Day]), first, first)).to.equal(undefined);
			expect(behavior.maxTickMarkCharacterLength(pointsWithWeights([TickMarkWeight.Milli]), first, first)).to.equal(12);
			expect(behavior.maxTickMarkCharacterLength(pointsWithWeights([TickMarkWeight.Micro]), first, first)).to.equal(15);
			expect(behavior.maxTickMarkCharacterLength(pointsWithWeights([TickMarkWeight.Nano]), first, first)).to.equal(18);
		});

		it('should take the widest label of the visible range', () => {
			const behavior = createBehavior();
			const points = pointsWithWeights([TickMarkWeight.Day, TickMarkWeight.Nano, TickMarkWeight.Day]);
			const one = 1 as TimePointIndex;
			const two = 2 as TimePointIndex;

			expect(behavior.maxTickMarkCharacterLength(points, first, first)).to.equal(undefined);
			expect(behavior.maxTickMarkCharacterLength(points, one, one)).to.equal(18);
			expect(behavior.maxTickMarkCharacterLength(points, first, two)).to.equal(18);
		});

		it('should not ask for a fractional part when time is not visible', () => {
			const behavior = createBehavior({ timeVisible: false });
			expect(behavior.maxTickMarkCharacterLength(pointsWithWeights([TickMarkWeight.Nano]), first, first)).to.equal(undefined);
		});
	});

	describe('data layer', () => {
		const behavior = createBehavior();

		it('should treat 1ns apart timestamps as distinct times', () => {
			const dataLayer = new DataLayer<Time>(behavior);
			const series = createSeriesMock('Line', true);

			const update = dataLayer.setSeriesData(series, [
				{ time: nsTime(1714564800000000001n), value: 1 },
				{ time: nsTime(1714564800000000002n), value: 2 },
			]);

			expect(update.timeScale.points).to.have.length(2);
			expect((update.series.get(series)?.data ?? []).map(row => row.index)).to.deep.equal([0, 1]);
		});

		it('should treat identical nanosecond timestamps as duplicates', () => {
			const dataLayer = new DataLayer<Time>(behavior);
			const series = createSeriesMock('Line', true);
			const time = nsTime(1714564800123456789n);

			const update = dataLayer.setSeriesData(series, [
				{ time, value: 1 },
				{ time, value: 2 },
			]);

			expect(update.timeScale.points).to.have.length(2);
			const points = update.timeScale.points as TimeScalePoint[];
			expect(points[0].originalTime).to.equal(time);
			// both slots keep the same original time, which is what the crosshair reports
			expect(points[1].originalTime).to.equal(time);
			expect((update.series.get(series)?.data ?? []).map(row => row.index)).to.deep.equal([0, 1]);
		});

		it('should accept nanosecond data with several occurrences of one timestamp', () => {
			const dataLayer = new DataLayer<Time>(behavior);
			const series = createSeriesMock('Line', true);
			const time = nsTime(1714564800123456789n);

			dataLayer.setSeriesData(series, [{ time, value: 1 }]);
			const update = dataLayer.updateSeriesData(series, { time, value: 2 }, false);

			expect(update.timeScale.points).to.have.length(2);
			expect((update.series.get(series)?.data ?? []).map(row => row.value[0])).to.deep.equal([1, 2]);
		});
	});
});
