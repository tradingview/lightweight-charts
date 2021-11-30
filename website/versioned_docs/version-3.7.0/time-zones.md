---
sidebar_position: 4
---
# Working with time zones

This doc describes what do you need to do if you want to add time zone support to your chart.

## Background

By default, `lightweight-charts` doesn't support time zones of any kind, just because JavaScript doesn't have an API to do that.
Things that the library uses internally includes an API to:

- Format a date
- Get a date and/or time parts of a date object (year, month, day, hours, etc)

Out of the box we could rely on 2 APIs:

- [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

And even if to format a date we could (and we do) use `Date` object with its `toLocaleString` method (and we could even pass a `timeZone` field as an option),
but how about date/time field?

All to solve this it seems that the only solution we have is `Date`'s getters, e.g. `getHours`. Here we could use 2 APIs:

- UTC-based methods like `getUTCHours` to get the date/time in UTC
- Client-based methods like `getHours` to get the date/time in _a local (for the client)_ time zone

As you can see we just unable to get date/time parts in desired time zone without using custom libraries (like `date-fns`) out of the box.

Because of this we decided not to handle time zones in the library. The library treats all dates and times as UTC internally.

But don't worry - it's easy to add time-zone support in your own code!

## How to add time zone support to your chart

**TL;DR** - time for every bar should be "corrected" by a time zone offset.

The only way to do this is to change a time in your data.

As soon as the library relies on UTC-based methods, you could change a time of your data item so in UTC it could be as it is in desired time zone.

Let's consider an example.

Lets say you have a bar with time `2021-01-01T10:00:00.000Z` (a string representation is just for better readability).
And you want to display your chart in `Europe/Moscow` time zone.

According to tz database, for `Europe/Moscow` time zone a time offset at this time is `UTC+03:00`, i.e. +3 hours (pay attention that you cannot use the same offset all the time, because of DST and many other things!).

By this means, the time for `Europe/Moscow` is `2021-01-01 13:00:00.000` (so basically you want to display this time over the UTC one).

To display your chart in the `Europe/Moscow` time zone you would need to adjust the time of your data by +3 hours. So `2021-01-01T10:00:00.000Z` would become `2021-01-01T13:00:00.000Z`.

Note that due a time zone offset the date could be changed as well (not only time part).

This looks tricky, but hopefully you need to implement it once and then just forget this ever happened 😀

### `Date` solution

One of possible solutions (and looks like the most simplest one) is to use approach from [this answer on StackOverflow](https://stackoverflow.com/a/54127122/3893439):

```js
// you could use this function to convert all your times to required time zone
function timeToTz(originalTime, timeZone) {
    const zonedDate = new Date(new Date(originalTime * 1000).toLocaleString('en-US', { timeZone }));
    return zonedDate.getTime() / 1000;
}
```

#### Note about converting to a "local" time zone

If you don't need to work with time zones in general, but only needs to support a client time zone (i.e. local), you could use the following trick:

```js
function timeToLocal(originalTime) {
    const d = new Date(originalTime * 1000);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
}
```

### `date-fns-tz` solution

You could also achieve the result by using [`date-fns-tz`](https://github.com/marnusw/date-fns-tz) library in the following way:

```js
import { utcToZonedTime } from 'date-fns-tz';

function timeToTz(originalTime, timeZone) {
    const zonedDate = utcToZonedTime(new Date(originalTime * 1000), timeZone);
    return zonedDate.getTime() / 1000;
}
```

### `tzdata` solution

If you have lots of data items and the performance of other solutions doesn't fit your requirements you could try to implement more complex solution by using raw [`tzdata`](https://www.npmjs.com/package/tzdata).

The better performance could be achieved with this approach because:

- you don't need to parse dates every time you want to get an offset so you could use [lowerbound algorithm](https://en.wikipedia.org/wiki/Upper_and_lower_bounds) (which is `O(log N)`) to find an offset of very first data point quickly
- after you found an offset, you go through all data items and check whether an offset should be changed or not to the next one (based on a time of the next time shift)

## Why we didn't implement it in the library

- `Date` solution is quite slow (in our tests it took more than 20 seconds for 100k points)
- Albeit `date-fns-tz` solution is a bit faster that the solution with `Date` but it is still very slow (~17-18 seconds for 100k points) and additionally it requires to add another set of dependencies to the package
- `tzdata` solution requires to increase the size of the library by [more than 31kB min.gz](https://bundlephobia.com/package/tzdata) (which is almost the size of the whole library!)

Keep in mind that time zones feature is not an issue for everybody so this is up to you to decide whether you want/need to support it or not and so far we don't want to sacrifice performance/package size for everybody by this feature.

## Note about converting business days

If you're using a business day for your time (either [object](/api/interfaces/BusinessDay.md) or [string](api/index.md#time) representation), for example because of DWM nature of your data,
most likely you **shouldn't** convert that time to a zoned one, because this time represents a day.
