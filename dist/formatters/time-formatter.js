import { numberToStringWithLeadingZero } from './price-formatter';
export class TimeFormatter {
    constructor(format) {
        this._formatStr = format || '%h:%m:%s';
    }
    format(date) {
        return this._formatStr.replace('%h', numberToStringWithLeadingZero(date.getUTCHours(), 2)).
            replace('%m', numberToStringWithLeadingZero(date.getUTCMinutes(), 2)).
            replace('%s', numberToStringWithLeadingZero(date.getUTCSeconds(), 2));
    }
}
