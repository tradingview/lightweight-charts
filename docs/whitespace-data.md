# Whitespace Data

A whitespace - an empty space on the chart, which extends timescale, but doesn't have a value for the series.

A whitespace item is an object with the only one field:

- `time` ([Time](./time.md)) - whitespace time

Example:

```js
// note it might be any type of series here
const series = chart.addHistogramSeries();

series.setData([
    { time: '2018-12-01', value: 32.51 },
    { time: '2018-12-02', value: 31.11 },
    { time: '2018-12-03', value: 27.02 },
    { time: '2018-12-04' }, // whitespace
    { time: '2018-12-05' }, // whitespace
    { time: '2018-12-06' }, // whitespace
    { time: '2018-12-07' }, // whitespace
    { time: '2018-12-08', value: 23.92 },
    { time: '2018-12-09', value: 22.68 },
    { time: '2018-12-10', value: 22.67 },
    { time: '2018-12-11', value: 27.57 },
    { time: '2018-12-12', value: 24.11 },
    { time: '2018-12-13', value: 30.74 },
]);
```
