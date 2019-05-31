# Time

This article contains descriptions of types to represent the time of data items.

## UNIX timestamp

If your chart displays an intraday interval, you should use a UNIX Timestamp format for time point data transfer.

Note that to prevent errors, you should cast the numeric type of the time to `UTCTimestamp` (it's a nominal type) type from the package (`value as UTCTimestamp`) in TypeScript code.

Example:

```javascript
const timestamp = 1529884800; // June 25, 2018
```

## Business day object

This type is used to specify time for DWM data.

This format uses objects where year, month and day are shown as separate fields:

- `year` (`number`) - year
- `month` (`number`) - month
- `day` (`number`) - day

Example:

```javascript
const day = { year: 2019, month: 6, day: 1 }; // June 1, 2019
```

## Business day string

This format is shorter than business day format. It allows you to specify dates using an ISO string format (`YYYY-MM-DD`).

Example:

```javascript
const timestamp = '2018-06-25'; // June 25, 2018
```
