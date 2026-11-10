# Time zones

## Overview

Lightweight Charts™ **does not** natively **support** time zones. If necessary, you should handle time zone adjustments manually.

The library processes all date and time values in UTC. To support time zones, adjust each bar's timestamp in your dataset based on the appropriate time zone offset.
Therefore, a UTC timestamp should correspond to the local time in the target time zone.

Consider the example. A data point has the `2021-01-01T10:00:00.000Z` timestamp in UTC. You want to display it in the `Europe/Moscow` time zone, which has the `UTC+03:00` offset according to the [IANA time zone database](https://www.iana.org/time-zones). To do this, adjust the original UTC timestamp by adding 3 hours. Therefore, the new timestamp should be `2021-01-01T13:00:00.000Z`.

:::info

When converting time zones, consider the following:

- Adding a time zone offset could change not only the time but the date as well.
- An offset may vary due to DST (Daylight Saving Time) or other regional adjustments.
- When clocks go back, the times in the repeated hour come out the same as, or earlier than, the times before them. Series data must be in ascending order, so remove or merge those points before calling `setData`.
- If your data is measured in business days and does not include a time component, in most cases, you should not adjust it to a time zone.

:::

## Approaches

Consider the approaches below to convert time values to the required time zone.

### Using pure JavaScript

Read the local date and time of each timestamp in the target time zone with [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), then build a UTC timestamp from them.
Create the format once per time zone and reuse it for every data point: creating a format is much slower than using it.

```js
function createTimeToTz(timeZone) {
    // Create the format once and reuse it: creating one is slow.
    const format = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    });
    return originalTime => {
        const parts = {};
        for (const { type, value } of format.formatToParts(new Date(originalTime * 1000))) {
            parts[type] = Number(value);
        }
        return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 1000;
    };
}

// utcData is your data with UTC timestamps.
const timeToNewYork = createTimeToTz('America/New_York');
const data = utcData.map(bar => ({ ...bar, time: timeToNewYork(bar.time) }));
```

See the [Time zones](https://tradingview.github.io/lightweight-charts/examples/time-scale/time-zones.md) example, which uses this approach.

If you only need to support a client (local) time zone, you can use the following function:

```js
function timeToLocal(originalTime) {
    const d = new Date(originalTime * 1000);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
}
```

### Using the Temporal API

The [Temporal API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) takes the offset straight from the time zone data, so the code is shorter:

```js
function timeToTz(originalTime, timeZone) {
    const zoned = Temporal.Instant.fromEpochMilliseconds(originalTime * 1000).toZonedDateTimeISO(timeZone);
    return originalTime + zoned.offsetNanoseconds / 1e9;
}
```

Temporal is available in Chrome and Edge 144+, Firefox 139+, and Node.js 26+.
Safari does not support it yet, so to support all browsers, add a polyfill such as [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) or [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill), or use `Intl.DateTimeFormat` as described above.

### Using the date-fns-tz library

You can use the `toZonedTime` function from the [`date-fns-tz`](https://github.com/marnusw/date-fns-tz) library as follows:

```js
import { toZonedTime } from 'date-fns-tz';

function timeToTz(originalTime, timeZone) {
    const zonedDate = toZonedTime(new Date(originalTime * 1000), timeZone);
    return Date.UTC(
        zonedDate.getFullYear(),
        zonedDate.getMonth(),
        zonedDate.getDate(),
        zonedDate.getHours(),
        zonedDate.getMinutes(),
        zonedDate.getSeconds()
    ) / 1000;
}
```

In `date-fns-tz` versions before 3.0, this function is called `utcToZonedTime`.

`toZonedTime` returns a `Date` in the browser's time zone. A local time that the browser's own time zone skips when the clocks go forward comes out an hour late.

### Using the IANA time zone database

If you process a large dataset and approaches above do not meet your performance requirements, consider using the [`tzdata`](https://www.npmjs.com/package/tzdata).

This approach can significantly improve performance for the following reasons:

- You do not need to calculate the time zone offset for every data point individually. Instead, you can look up the correct offset just once for the first timestamp using a fast binary search.
- After finding the starting offset, you go through the rest data and check whether an offset should be changed, for example, because of DST starting/ending.

## Why does the chart not convert time zones?

The chart shows times exactly as you pass them and leaves the conversion to your app. This keeps the library small and the result predictable:

- **Small bundle.** Correct conversion, including daylight saving time changes, needs the time zone database. Bundling it, for example as [`tzdata`](https://www.npmjs.com/package/tzdata), would add about 28 kB gzipped, almost half the size of the library itself.
- **Full control.** You choose the zone (the user's own, the exchange's, or one the user picks) and convert the data once, before you pass it to the chart.
- **Dates stay on the right day.** Daily data often comes as timestamps at midnight UTC. The chart never shifts times on its own, so these bars always show the date you meant.

---

Documentation for Lightweight Charts™ v5.3 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
