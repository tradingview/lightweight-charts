import {
	AreaSeries,
	HistogramSeries,
	LineSeries,
	LineWidth,
	Time,
	createChart,
} from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { addAccessibilityPlugin } from '../accessibility';

const chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		rightOffset: 10,
		barSpacing: 8,
	},
});

// --- Pane 0: two price series (so Up/Down can switch between them) ---
const priceSeries = chart.addSeries(AreaSeries, {
	lineColor: 'rgb(41, 98, 255)',
	topColor: 'rgba(41, 98, 255, 0.4)',
	bottomColor: 'rgba(41, 98, 255, 0)',
	lineWidth: 2,
	title: 'Price',
});
const priceData = generateLineData();
priceSeries.setData(priceData);

const averageSeries = chart.addSeries(LineSeries, {
	color: 'rgb(225, 87, 90)',
	lineWidth: 2,
	title: 'Moving average',
});

const averagePeriod = 20;
const averageData = priceData.slice(averagePeriod - 1).map((point, index) => {
	let sum = 0;
	for (let i = index; i < index + averagePeriod; i++) {
		sum += priceData[i].value;
	}
	return { time: point.time, value: sum / averagePeriod };
});
averageSeries.setData(averageData);

// --- Pane 1: a volume series in its own pane ---
const volumeSeries = chart.addSeries(
	HistogramSeries,
	{ color: 'rgb(38, 166, 154)', title: 'Volume' },
	1 // paneIndex – creates a second pane
);
volumeSeries.setData(
	priceData.map(point => ({ time: point.time, value: point.value * 10 }))
);

// Restyles the chart's own series / grid / text for high contrast. The plugin
// only restyles its own overlay; it tells us via onHighContrastChange so we can
// match the chart itself (as the Readability tutorial describes).
function applyChartContrast(highContrast: boolean): void {
	chart.applyOptions({
		layout: { textColor: highContrast ? '#000000' : '#222222' },
		grid: {
			vertLines: { color: highContrast ? '#5b5b5b' : '#e6e9ec' },
			horzLines: { color: highContrast ? '#5b5b5b' : '#e6e9ec' },
		},
	});
	priceSeries.applyOptions({
		lineColor: highContrast ? '#0033cc' : 'rgb(41, 98, 255)',
		lineWidth: (highContrast ? 4 : 2) as LineWidth,
		topColor: highContrast ? 'rgba(0, 51, 204, 0.5)' : 'rgba(41, 98, 255, 0.4)',
		bottomColor: highContrast ? 'rgba(0, 51, 204, 0)' : 'rgba(41, 98, 255, 0)',
	});
	averageSeries.applyOptions({
		color: highContrast ? '#a3000e' : 'rgb(225, 87, 90)',
		lineWidth: (highContrast ? 4 : 2) as LineWidth,
	});
	volumeSeries.applyOptions({ color: highContrast ? '#00524a' : 'rgb(38, 166, 154)' });
}

// One chart-level call: each pane becomes its own accessible region. The visible
// shortcuts overlay (showShortcuts) and high-contrast handling help sighted
// keyboard users and low-vision users who do not use a screen reader.
let highContrast = false;
const contrastButton = document.querySelector('#contrast-button');
const accessibility = addAccessibilityPlugin(chart, {
	chartTitle: paneIndex => paneIndex === 0 ? 'Sample price chart' : 'Sample volume chart',
	showShortcuts: true,
	// highContrast defaults to 'auto' (follows the OS); the button below overrides it.
	onHighContrastChange: enabled => {
		highContrast = enabled;
		applyChartContrast(enabled);
		if (contrastButton) {
			contrastButton.textContent = enabled ? 'Disable high contrast' : 'Enable high contrast';
		}
	},
});

document.querySelector('#focus-button')?.addEventListener('click', () => {
	accessibility.focus(0);
});

contrastButton?.addEventListener('click', () => {
	accessibility.applyOptions({ highContrast: !highContrast });
});

// Larger chart text – the chart's own font is the developer's responsibility (the
// plugin's overlay already scales with the page font). See the Readability tutorial.
let largeFont = false;
const fontButton = document.querySelector('#font-button');
fontButton?.addEventListener('click', () => {
	largeFont = !largeFont;
	chart.applyOptions({ layout: { fontSize: largeFont ? 16 : 12 } });
	if (fontButton) {
		fontButton.textContent = largeFont ? 'Normal font' : 'Large font';
	}
});

// --- Live data updates ---------------------------------------------------
// Stream a new bar into every series on an interval, exactly like a real-time
// feed. Each `series.update()` triggers the plugin, which announces the change
// through a polite aria-live region (by default, only the active pane).
const ONE_DAY = 24 * 60 * 60;
let lastTime = priceData[priceData.length - 1].time as number;
let lastPrice = priceData[priceData.length - 1].value;
let lastAverage = averageData[averageData.length - 1].value;
let liveTimer: number | undefined;

function streamNextPoint(): void {
	lastTime += ONE_DAY;
	// A small random walk so the updates are visibly "live".
	lastPrice = Math.max(1, lastPrice + (Math.random() - 0.5) * 20);
	lastAverage += (lastPrice - lastAverage) * 0.1;
	const time = lastTime as Time;
	priceSeries.update({ time, value: lastPrice });
	averageSeries.update({ time, value: lastAverage });
	volumeSeries.update({ time, value: lastPrice * 10 });
}

const liveButton = document.querySelector('#live-button');
liveButton?.addEventListener('click', () => {
	if (liveTimer === undefined) {
		liveTimer = window.setInterval(streamNextPoint, 3000);
		liveButton.textContent = 'Stop live updates';
	} else {
		window.clearInterval(liveTimer);
		liveTimer = undefined;
		liveButton.textContent = 'Start live updates';
	}
});

// Toggle whether announcements describe the default visible range or the whole
// data set.
let visibleScope = true;
const scopeButton = document.querySelector('#scope-button');
scopeButton?.addEventListener('click', () => {
	visibleScope = !visibleScope;
	const dataScope = visibleScope ? 'visible' : 'all';
	for (const plugin of accessibility.plugins) {
		plugin.applyOptions({ dataScope });
	}
	if (scopeButton) {
		scopeButton.textContent = visibleScope
			? 'Announce: visible range'
			: 'Announce: all data';
	}
});
