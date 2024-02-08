import { formatDate } from './format-date';
export class DateFormatter {
    constructor(dateFormat = 'yyyy-MM-dd', locale = 'default') {
        this._private__dateFormat = dateFormat;
        this._private__locale = locale;
    }
    _internal_format(date) {
        return formatDate(date, this._private__dateFormat, this._private__locale);
    }
}
