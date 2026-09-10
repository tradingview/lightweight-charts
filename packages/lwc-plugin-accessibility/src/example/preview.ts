import {
	AreaSeries,
	HistogramSeries,
	LineSeries,
	Time,
	createChart,
} from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { addAccessibilityPlugin, createToneSonifier, esMessages } from '../accessibility';
import { generateLineData } from './sample-data';

// The catalogue preview: a two-pane chart the reader can tab into, with the
// four controls that show something a screen reader would hear. The dev demo
// next door carries the full write-up, the caption line, the high-contrast and
// data-scope switches and the marker/price-line annotations.
const titles = {
	en: { price: 'Sample price chart', volume: 'Sample volume chart', focus: 'Focus the chart', start: 'Start live updates', stop: 'Stop live updates' },
	es: { price: 'Gráfico de precios', volume: 'Gráfico de volumen', focus: 'Enfocar el gráfico', start: 'Iniciar actualizaciones', stop: 'Detener actualizaciones' },
};
type Language = keyof typeof titles;
let language: Language = 'en';

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { rightOffset: 10, barSpacing: 8 },
});

const priceData = generateLineData(200);

const priceSeries = chart.addSeries(AreaSeries, {
	lineColor: 'rgb(41, 98, 255)',
	topColor: 'rgba(41, 98, 255, 0.4)',
	bottomColor: 'rgba(41, 98, 255, 0)',
	lineWidth: 2,
	title: 'Price',
});
priceSeries.setData(priceData);

const averageSeries = chart.addSeries(LineSeries, {
	color: 'rgb(225, 87, 90)',
	lineWidth: 2,
	title: 'Moving average',
});
const period = 20;
averageSeries.setData(priceData.slice(period - 1).map((point, index) => {
	let sum = 0;
	for (let i = index; i < index + period; i++) {
		sum += priceData[i].value;
	}
	return { time: point.time, value: sum / period };
}));

// A second pane, so Tab moves between two independent accessible regions.
const volumeSeries = chart.addSeries(HistogramSeries, { color: 'rgb(38, 166, 154)', title: 'Volume' }, 1);
volumeSeries.setData(priceData.map(point => ({ time: point.time, value: point.value * 10 })));

const sonifier = createToneSonifier();
let sound = false;

const accessibility = addAccessibilityPlugin(chart, {
	chartTitle: paneIndex => (paneIndex === 0 ? titles[language].price : titles[language].volume),
	showShortcuts: true,
	focusOnPointerDown: true,
	syncCrosshair: true,
	dataUpdates: { mode: 'active', debounceMs: 1500 },
	onSonify: note => {
		if (sound) {
			sonifier(note);
		}
	},
});

// --- Live updates, so the polite region has something to announce ---
const ONE_DAY = 24 * 60 * 60;
let lastTime = priceData[priceData.length - 1].time as number;
let lastPrice = priceData[priceData.length - 1].value;
let liveTimer: number | undefined;

function streamNextPoint(): void {
	lastTime += ONE_DAY;
	lastPrice = Math.max(1, lastPrice + (Math.random() - 0.5) * 20);
	const time = lastTime as Time;
	priceSeries.update({ time, value: lastPrice });
	volumeSeries.update({ time, value: lastPrice * 10 });
}

mountControls([
	{
		kind: 'select',
		label: 'Language',
		options: [
			{ value: 'en', label: 'English' },
			{ value: 'es', label: 'Español' },
		],
		// The runtime language switch: one applyOptions call swaps the announced
		// strings, the `lang` of the regions and the pane titles.
		onChange: value => {
			language = value as Language;
			document.documentElement.lang = language;
			chart.applyOptions({ localization: { locale: language } });
			accessibility.applyOptions({
				messages: language === 'es' ? esMessages : {},
				lang: language,
				chartTitle: paneIndex => (paneIndex === 0 ? titles[language].price : titles[language].volume),
			});
		},
	},
	{
		kind: 'button',
		label: titles.en.focus,
		onClick: button => {
			accessibility.focus(0);
			button.textContent = titles[language].focus;
		},
	},
	{
		kind: 'button',
		label: titles.en.start,
		onClick: button => {
			if (liveTimer === undefined) {
				liveTimer = window.setInterval(streamNextPoint, 3000);
			} else {
				window.clearInterval(liveTimer);
				liveTimer = undefined;
			}
			button.textContent = liveTimer === undefined ? titles[language].start : titles[language].stop;
		},
	},
	{
		kind: 'checkbox',
		label: 'Sound',
		onChange: checked => {
			sound = checked;
		},
	},
]);
