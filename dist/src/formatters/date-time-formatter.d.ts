export interface DateTimeFormatterParams {
    dateFormat: string;
    timeFormat: string;
    dateTimeSeparator: string;
    locale: string;
}
export declare class DateTimeFormatter {
    private readonly _dateFormatter;
    private readonly _timeFormatter;
    private readonly _separator;
    constructor(params?: Partial<DateTimeFormatterParams>);
    format(dateTime: Date): string;
}
