import { numberToStringWithLeadingZero } from './price-formatter';
export class TimeFormatter {
    constructor(format) {
        this._private__formatStr = format || '%h:%m:%s';
    }
    _internal_format(date) {
        return this._private__formatStr.replace('%h', numberToStringWithLeadingZero(date.getUTCHours(), 2)).
            replace('%m', numberToStringWithLeadingZero(date.getUTCMinutes(), 2)).
            replace('%s', numberToStringWithLeadingZero(date.getUTCSeconds(), 2));
    }
}
