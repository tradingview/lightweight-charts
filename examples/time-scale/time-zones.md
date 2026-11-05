# Time zones

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
	},
	timeScale: { timeVisible: true, secondsVisible: false },
	// Fill the element the chart is created in, whatever its size.
	autoSize: true,
};
const container = document.getElementById('container');
// The chart takes the space above the buttons, which are added further down.
container.style.display = 'flex';
container.style.flexDirection = 'column';
const chartElement = document.createElement('div');
chartElement.style.flex = '1';
chartElement.style.minHeight = '0';
container.appendChild(chartElement);
const chart = createChart(chartElement, chartOptions);

const series = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});

// The data keeps its UTC timestamps; each time zone gets a shifted copy.
const utcData = generateBars();

// Returns a function that moves a UTC timestamp so that the chart, which shows
// every time in UTC, shows the local time of `timeZone` instead.
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

function setTimeZone(timeZone) {
	const timeToTz = createTimeToTz(timeZone);
	series.setData(utcData.map(bar => ({ ...bar, time: timeToTz(bar.time) })));
}

const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        background-color: ${'white'};
    }
    .buttons-container button {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,
            sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 510;
        line-height: 24px; /* 150% */
        letter-spacing: -0.32px;
        padding: 8px 24px;
        color: ${'rgba(19, 23, 34, 1)'};
        background-color: ${'rgba(240, 243, 250, 1)'};
        border-radius: 8px;
        cursor: pointer;
    }

    .buttons-container button:hover {
        background-color: ${'rgba(224, 227, 235, 1)'};
    }

    .buttons-container button:active {
        background-color: ${'rgba(209, 212, 220, 1)'};
    }
`;

const stylesElement = document.createElement('style');
stylesElement.innerHTML = styles;
container.appendChild(stylesElement);

const buttonsContainer = document.createElement('div');
buttonsContainer.classList.add('buttons-container');
const timeZones = ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'];
timeZones.forEach(timeZone => {
	const button = document.createElement('button');
	button.innerText = timeZone;
	button.addEventListener('click', () => setTimeZone(timeZone));
	buttonsContainer.appendChild(button);
});

container.appendChild(buttonsContainer);

// Start in New York, where the session runs from 9:30 to 16:00.
setTimeZone('America/New_York');
chart.timeScale().fitContent();

// Sample data: 30-minute bars of a US stock session, 14:30 to 21:00 UTC, on
// five weekdays. A seeded random walk, so the chart looks the same on every load.
function generateBars() {
	let seed = 23;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const bars = [];
	let close = 180;
	for (let day = 8; day <= 12; day++) {
		for (let minutes = 14 * 60 + 30; minutes < 21 * 60; minutes += 30) {
			const open = close;
			close = open + (random() - 0.5) * 2;
			const high = Math.max(open, close) + random();
			const low = Math.min(open, close) - random();
			const time = Date.UTC(2024, 0, day, 0, minutes) / 1000;
			bars.push({ time, open, high, low, close });
		}
	}
	return bars;
}
```

## How it works

The chart shows every time in UTC and has no time zone option. To show another time zone, shift the timestamps so that their UTC time reads as the local time of that zone. The bars here are a US stock session, from 14:30 to 21:00 UTC, which is 9:30 to 16:00 in New York.

1. `createTimeToTz` creates an [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) for the time zone once, and returns a function that reads the local date and time of a timestamp with it, then builds a UTC timestamp from them with `Date.UTC`.
2. The buttons call `setTimeZone`. It shifts a copy of the data with that function and passes the copy to [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata). The original UTC data stays unchanged, so the zone can be switched again.

These lines are highlighted in the code. `generateBars` only makes sample data. Replace it with your own.

## Tips

- `Intl.DateTimeFormat` knows daylight saving time, so each timestamp gets the offset that applied on its own date.
- With the format created once, 100,000 points take about 0.4 seconds in our tests. For larger data sets, see the `tzdata` approach in [Time zones](https://tradingview.github.io/lightweight-charts/docs/time-zones.md#using-the-iana-time-zone-database).
- Shift the data you pass to [`update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#update) too, or new bars land in the wrong place.

## Resources

- [Time zones](https://tradingview.github.io/lightweight-charts/docs/time-zones.md)
- [`timeScale.timeVisible`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#timevisible)
- Related examples: [Custom date format](https://tradingview.github.io/lightweight-charts/examples/time-scale/custom-date-format.md), [Custom locale](https://tradingview.github.io/lightweight-charts/examples/styling/custom-locale.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
