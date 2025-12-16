---
sidebar_position: 6
---
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
- If your data is measured in business days and does not include a time component, in most cases, you should not adjust it to a time zone.

:::

## Approaches

Consider the approaches below to convert time values to the required time zone.

### Using pure JavaScript

For more information on this approach, refer to [StackOverflow](https://stackoverflow.com/a/54127122/3893439).

```js
function timeToTz(originalTime, timeZone) {
    const zonedDate = new Date(new Date(originalTime * 1000).toLocaleString('en-US', { timeZone }));
    return zonedDate.getTime() / 1000;
}
```

If you only need to support a client (local) time zone, you can use the following function:

```js
function timeToLocal(originalTime) {
    const d = new Date(originalTime * 1000);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
}
```

### Using the date-fns-tz library

You can use the `utcToZonedTime` function from the [`date-fns-tz`](https://github.com/marnusw/date-fns-tz) library as follows:

```js
import { utcToZonedTime } from 'date-fns-tz';

function timeToTz(originalTime, timeZone) {
    const zonedDate = utcToZonedTime(new Date(originalTime * 1000), timeZone);
    return zonedDate.getTime() / 1000;
}
```

### Using the IANA time zone database

If you process a large dataset and approaches above do not meet your performance requirements, consider using the [`tzdata`](https://www.npmjs.com/package/tzdata).

This approach can significantly improve performance for the following reasons:

- You do not need to calculate the time zone offset for every data point individually. Instead, you can look up the correct offset just once for the first timestamp using a fast binary search.
- After finding the starting offset, you go through the rest data and check whether an offset should be changed, for example, because of DST starting/ending.

## Why are time zones not supported?

The approaches above were not implemented in Lightweight Charts™ for the following reasons:

- Using [pure JavaScript](#using-pure-javascript) is slow. In our tests, processing 100,000 data points took over 20 seconds.
- Using the [date-fns-tz library](#using-the-date-fns-tz-library) introduces additional dependencies and is also slow. In our tests, processing 100,000 data points took 18 seconds.
- Incorporating the [IANA time zone database](#using-the-iana-time-zone-database) increases the bundle size by [29.9 kB](https://bundlephobia.com/package/tzdata), which is nearly the size of the entire Lightweight Charts™ library.

Since time zone support is not required for all users, it is intentionally left out of the library to maintain high performance and a lightweight package size.
