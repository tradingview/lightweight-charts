export declare class DateFormatter {
    private readonly _locale;
    private readonly _dateFormat;
    constructor(dateFormat?: string, locale?: string);
    format(date: Date): string;
}
