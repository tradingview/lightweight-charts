import { DateFormatter } from './date-formatter';
import { TimeFormatter } from './time-formatter';

export interface DateTimeFormatterParams {
	dateFormat: string;
	timeFormat: string;
	dateTimeSeparator: string;
	locale: string;
}

const defaultParams: DateTimeFormatterParams = {
	dateFormat: 'yyyy-MM-dd',
	timeFormat: '%h:%m:%s',
	dateTimeSeparator: ' ',
	locale: 'default',
};

export class DateTimeFormatter {
	private readonly _dateFormatter: DateFormatter;
	private readonly _timeFormatter: TimeFormatter;
	private readonly _separator: string;

	public constructor(params: Partial<DateTimeFormatterParams> = {}) {
		const formatterParams: DateTimeFormatterParams = { ...defaultParams, ...params };
		this._dateFormatter = new DateFormatter(formatterParams.dateFormat, formatterParams.locale);
		this._timeFormatter = new TimeFormatter(formatterParams.timeFormat);
		this._separator = formatterParams.dateTimeSeparator;
	}

	public format(dateTime: Date): string {
		return `${this._dateFormatter.format(dateTime)}${this._separator}${this._timeFormatter.format(dateTime)}`;
	}
}
