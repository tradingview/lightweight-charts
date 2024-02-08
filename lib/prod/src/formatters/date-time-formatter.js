import { DateFormatter } from './date-formatter';
import { TimeFormatter } from './time-formatter';
const defaultParams = {
    _internal_dateFormat: 'yyyy-MM-dd',
    _internal_timeFormat: '%h:%m:%s',
    _internal_dateTimeSeparator: ' ',
    _internal_locale: 'default',
};
export class DateTimeFormatter {
    constructor(params = {}) {
        const formatterParams = Object.assign(Object.assign({}, defaultParams), params);
        this._private__dateFormatter = new DateFormatter(formatterParams._internal_dateFormat, formatterParams._internal_locale);
        this._private__timeFormatter = new TimeFormatter(formatterParams._internal_timeFormat);
        this._private__separator = formatterParams._internal_dateTimeSeparator;
    }
    _internal_format(dateTime) {
        return `${this._private__dateFormatter._internal_format(dateTime)}${this._private__separator}${this._private__timeFormatter._internal_format(dateTime)}`;
    }
}
