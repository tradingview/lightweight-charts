import { DateFormatter } from '../../formatters/date-formatter';
import { DateTimeFormatter } from '../../formatters/date-time-formatter';
import { ensureNotNull } from '../../helpers/assertions';
import { merge } from '../../helpers/strict-type-checks';
import { markWithGreaterWeight } from '../time-scale';
import { defaultTickMarkFormatter } from './default-tick-mark-formatter';
import { fillWeightsForPoints } from './time-scale-point-weight-generator';
import { convertStringsToBusinessDays, convertStringToBusinessDay, convertTime, selectTimeConverter } from './time-utils';
// eslint-disable-next-line complexity
function weightToTickMarkType(weight, timeVisible, secondsVisible) {
    switch (weight) {
        case 0 /* TickMarkWeight.LessThanSecond */:
        case 10 /* TickMarkWeight.Second */:
            return timeVisible
                ? (secondsVisible ? 4 /* TickMarkType.TimeWithSeconds */ : 3 /* TickMarkType.Time */)
                : 2 /* TickMarkType.DayOfMonth */;
        case 20 /* TickMarkWeight.Minute1 */:
        case 21 /* TickMarkWeight.Minute5 */:
        case 22 /* TickMarkWeight.Minute30 */:
        case 30 /* TickMarkWeight.Hour1 */:
        case 31 /* TickMarkWeight.Hour3 */:
        case 32 /* TickMarkWeight.Hour6 */:
        case 33 /* TickMarkWeight.Hour12 */:
            return timeVisible ? 3 /* TickMarkType.Time */ : 2 /* TickMarkType.DayOfMonth */;
        case 50 /* TickMarkWeight.Day */:
            return 2 /* TickMarkType.DayOfMonth */;
        case 60 /* TickMarkWeight.Month */:
            return 1 /* TickMarkType.Month */;
        case 70 /* TickMarkWeight.Year */:
            return 0 /* TickMarkType.Year */;
    }
}
export class HorzScaleBehaviorTime {
    options() {
        return this._options;
    }
    setOptions(options) {
        this._options = options;
        this.updateFormatter(options.localization);
    }
    preprocessData(data) {
        if (Array.isArray(data)) {
            convertStringsToBusinessDays(data);
        }
        else {
            convertStringToBusinessDay(data);
        }
    }
    createConverterToInternalObj(data) {
        return ensureNotNull(selectTimeConverter(data));
    }
    key(item) {
        // eslint-disable-next-line no-restricted-syntax
        if (typeof item === 'object' && 'timestamp' in item) {
            return item.timestamp;
        }
        else {
            return this.key(this.convertHorzItemToInternal(item));
        }
    }
    cacheKey(item) {
        const time = item;
        return time.businessDay === undefined
            ? new Date(time.timestamp * 1000).getTime()
            : new Date(Date.UTC(time.businessDay.year, time.businessDay.month - 1, time.businessDay.day)).getTime();
    }
    convertHorzItemToInternal(item) {
        return convertTime(item);
    }
    updateFormatter(options) {
        if (!this._options) {
            return;
        }
        const dateFormat = options.dateFormat;
        if (this._options.timeScale.timeVisible) {
            this._dateTimeFormatter = new DateTimeFormatter({
                dateFormat: dateFormat,
                timeFormat: this._options.timeScale.secondsVisible ? '%h:%m:%s' : '%h:%m',
                dateTimeSeparator: '   ',
                locale: options.locale,
            });
        }
        else {
            this._dateTimeFormatter = new DateFormatter(dateFormat, options.locale);
        }
    }
    formatHorzItem(item) {
        const tp = item;
        return this._dateTimeFormatter.format(new Date(tp.timestamp * 1000));
    }
    formatTickmark(tickMark, localizationOptions) {
        const tickMarkType = weightToTickMarkType(tickMark.weight, this._options.timeScale.timeVisible, this._options.timeScale.secondsVisible);
        const options = this._options.timeScale;
        if (options.tickMarkFormatter !== undefined) {
            const tickMarkString = options.tickMarkFormatter(tickMark.originalTime, tickMarkType, localizationOptions.locale);
            if (tickMarkString !== null) {
                return tickMarkString;
            }
        }
        return defaultTickMarkFormatter(tickMark.time, tickMarkType, localizationOptions.locale);
    }
    maxTickMarkWeight(tickMarks) {
        let maxWeight = tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;
        // special case: it looks strange if 15:00 is bold but 14:00 is not
        // so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
        if (maxWeight > 30 /* TickMarkWeight.Hour1 */ && maxWeight < 50 /* TickMarkWeight.Day */) {
            maxWeight = 30 /* TickMarkWeight.Hour1 */;
        }
        return maxWeight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        fillWeightsForPoints(sortedTimePoints, startIndex);
    }
    static applyDefaults(options) {
        return merge({ localization: { dateFormat: 'dd MMM \'yy' } }, options !== null && options !== void 0 ? options : {});
    }
}
