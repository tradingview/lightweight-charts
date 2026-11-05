# Custom date format

```js
// The chart works in UTC, so the formats read the timestamps in UTC too.
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' });
const monthName = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' });
const hoursAndMinutes = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fullDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' });

const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
	},
	timeScale: {
		timeVisible: true,
		// The labels under the chart: a different format for each kind of mark.
		tickMarkFormatter: (time, tickMarkType) => {
			const date = new Date(time * 1000);
			switch (tickMarkType) {
				case TickMarkType.Year:
					return String(date.getUTCFullYear());
				case TickMarkType.Month:
					return monthName.format(date);
				case TickMarkType.DayOfMonth:
					return `${weekday.format(date)} ${date.getUTCDate()}`;
				default:
					return hoursAndMinutes.format(date);
			}
		},
	},
	localization: {
		// The label of the crosshair on the time scale.
		timeFormatter: time => fullDate.format(new Date(time * 1000)),
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

const series = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: hourly values over ten days, a seeded random walk, so the chart
// looks the same on every load.
function generateValues(count = 240) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	let time = Date.UTC(2024, 0, 26) / 1000;
	let value = 100;
	const points = [];
	for (let i = 0; i < count; i++) {
		value += (random() - 0.5) * 1.5;
		points.push({ time, value });
		time += 60 * 60;
	}
	return points;
}
```

## How it works

The chart turns times into labels with functions you give it: one for the marks on the time scale, one for the crosshair label.

1. [`tickMarkFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#tickmarkformatter) formats the marks under the chart. Its second argument, a [`TickMarkType`](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/TickMarkType), says whether a mark starts a new year, month, day, or is a time within a day. Here each kind gets its own format, such as `Feb` for a new month and `Sun 28` for a new day.
2. [`localization.timeFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions#timeformatter) formats the time in the crosshair label, here as `Jan 29, 2024, 14:00`.
3. The formats come from [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) with `timeZone: 'UTC'`, because the chart keeps every time in UTC.

These lines are highlighted in the code. `generateValues` only makes sample data. Replace it with your own.

## Tips

- `tickMarkFormatter` can return `null` for a mark. The chart then uses its default label for it.
- The functions get `time` in the form you passed it in. For dates given as strings, such as `'2024-01-29'`, or as objects, handle those forms too.
- To show times in a time zone other than UTC, shift the data instead. See [Time zones](https://tradingview.github.io/lightweight-charts/examples/time-scale/time-zones.md).

## Resources

- [`TimeScaleOptions.tickMarkFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#tickmarkformatter)
- [`LocalizationOptions.timeFormatter`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions#timeformatter)
- Related examples: [Custom locale](https://tradingview.github.io/lightweight-charts/examples/styling/custom-locale.md), [Time zones](https://tradingview.github.io/lightweight-charts/examples/time-scale/time-zones.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
