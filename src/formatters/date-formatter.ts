import { formatDate } from './format-date';

export class DateFormatter {
	private readonly _locale: string;
	private readonly _dateFormat: string;

	public constructor(dateFormat: string = 'yyyy-MM-dd', locale: string = 'default') {
		this._dateFormat = dateFormat;
		this._locale = locale;
	}

	public format(date: Date): string {
		return formatDate(date, this._dateFormat, this._locale);
	}
}
