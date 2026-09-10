import {
	AreaSeries,
	HistogramSeries,
	IPriceLine,
	LineSeries,
	LineWidth,
	SeriesMarker,
	Time,
	createChart,
	createSeriesMarkers,
} from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { addAccessibilityPlugin, createToneSonifier, esMessages } from '@tradingview/lwc-plugin-accessibility';

/** UI wording of this demo page, in the two languages it can switch between. */
const strings = {
	en: {
		price: 'Price',
		average: 'Moving average',
		volume: 'Volume',
		priceTitle: 'Sample price chart',
		volumeTitle: 'Sample volume chart',
		focus: 'Focus the chart',
		startLive: 'Start live updates',
		stopLive: 'Stop live updates',
		scopeVisible: 'Announce: visible range',
		scopeAll: 'Announce: all data',
		contrastOn: 'Enable high contrast',
		contrastOff: 'Disable high contrast',
		largeFont: 'Large font',
		normalFont: 'Normal font',
		soundOn: 'Play the data as sound',
		soundOff: 'Stop playing sound',
		target: 'Target',
		marker: 'Earnings',
		captions: 'Announcements (onAnnounce):',
	},
	es: {
		price: 'Precio',
		average: 'Media móvil',
		volume: 'Volumen',
		priceTitle: 'Gráfico de precios',
		volumeTitle: 'Gráfico de volumen',
		focus: 'Enfocar el gráfico',
		startLive: 'Iniciar actualizaciones en vivo',
		stopLive: 'Detener actualizaciones en vivo',
		scopeVisible: 'Anunciar: rango visible',
		scopeAll: 'Anunciar: todos los datos',
		contrastOn: 'Activar alto contraste',
		contrastOff: 'Desactivar alto contraste',
		largeFont: 'Fuente grande',
		normalFont: 'Fuente normal',
		soundOn: 'Reproducir los datos como sonido',
		soundOff: 'Detener el sonido',
		target: 'Objetivo',
		marker: 'Resultados',
		captions: 'Anuncios (onAnnounce):',
	},
};

type Language = keyof typeof strings;

const params = new URLSearchParams(window.location.search);
let language: Language = params.get('lang') === 'es' ? 'es' : 'en';
const text = (): (typeof strings)['en'] => strings[language];

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
	title: text().price,
});
const priceData = generateLineData();
priceSeries.setData(priceData);

const averageSeries = chart.addSeries(LineSeries, {
	color: 'rgb(225, 87, 90)',
	lineWidth: 2,
	title: text().average,
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
	{ color: 'rgb(38, 166, 154)', title: text().volume },
	1 // paneIndex – creates a second pane
);
volumeSeries.setData(
	priceData.map(point => ({ time: point.time, value: point.value * 10 }))
);

// Markers and a price line: both are purely visual, so the plugin announces them
// (the markers on the point they sit on, the price line in the Enter summary).
let markers: SeriesMarker<Time>[] = [];
const markerPrimitive = createSeriesMarkers(priceSeries, markers);
let priceLine: IPriceLine | null = null;

function applyAnnotations(): void {
	markers = [100, 300].map(index => ({
		time: priceData[index].time,
		position: 'aboveBar' as const,
		shape: 'circle' as const,
		color: '#2962FF',
		text: text().marker,
	}));
	markerPrimitive.setMarkers(markers);
	if (priceLine !== null) {
		priceSeries.removePriceLine(priceLine);
	}
	priceLine = priceSeries.createPriceLine({
		price: priceData[priceData.length - 1].value,
		color: '#E1575A',
		title: text().target,
	});
}
applyAnnotations();

// Restyles the chart's own series / grid / text for high contrast. The plugin
// only restyles its own overlay; it tells us via onHighContrastChange so we can
// match the chart itself (as the Readability tutorial describes).
function applyChartContrast(enabled: boolean): void {
	chart.applyOptions({
		layout: { textColor: enabled ? '#000000' : '#222222' },
		grid: {
			vertLines: { color: enabled ? '#5b5b5b' : '#e6e9ec' },
			horzLines: { color: enabled ? '#5b5b5b' : '#e6e9ec' },
		},
	});
	priceSeries.applyOptions({
		lineColor: enabled ? '#0033cc' : 'rgb(41, 98, 255)',
		lineWidth: (enabled ? 4 : 2) as LineWidth,
		topColor: enabled ? 'rgba(0, 51, 204, 0.5)' : 'rgba(41, 98, 255, 0.4)',
		bottomColor: enabled ? 'rgba(0, 51, 204, 0)' : 'rgba(41, 98, 255, 0)',
	});
	averageSeries.applyOptions({
		color: enabled ? '#a3000e' : 'rgb(225, 87, 90)',
		lineWidth: (enabled ? 4 : 2) as LineWidth,
	});
	volumeSeries.applyOptions({ color: enabled ? '#00524a' : 'rgb(38, 166, 154)' });
}

// One chart-level call: each pane becomes its own accessible region. The visible
// shortcuts overlay (showShortcuts) and high-contrast handling help sighted
// keyboard users and low-vision users who do not use a screen reader.
let highContrast = false;
const captions = document.querySelector('#captions-text');
const sonifier = createToneSonifier();
let sound = false;

const focusButton = document.querySelector('#focus-button');
const liveButton = document.querySelector('#live-button');
const scopeButton = document.querySelector('#scope-button');
const contrastButton = document.querySelector('#contrast-button');
const fontButton = document.querySelector('#font-button');
const soundButton = document.querySelector('#sound-button');
const languageSelect = document.querySelector('#language-select') as HTMLSelectElement | null;
const captionsLabel = document.querySelector('#captions-label');

let liveTimer: number | undefined;
let visibleScope = true;
let largeFont = false;

const accessibility = addAccessibilityPlugin(chart, {
	chartTitle: paneIndex => (paneIndex === 0 ? text().priceTitle : text().volumeTitle),
	showShortcuts: true,
	// Clicking the chart moves the keyboard focus into it, so mouse and keyboard
	// users share one notion of "the focused chart".
	focusOnPointerDown: true,
	// Move the crosshair with the keyboard, so sighted users following a screen
	// reader see the point being announced.
	syncCrosshair: true,
	markers: series => (series === priceSeries ? markers : []),
	// 'active' (the default) announces updates only for the pane the user focused
	// last; the streamed bars below are coalesced over this window.
	dataUpdates: { mode: 'active', debounceMs: 1500 },
	// Mirror everything the plugin says into a visible caption line.
	onAnnounce: message => {
		if (captions) {
			captions.textContent = message;
		}
	},
	onSonify: note => {
		if (sound) {
			sonifier(note);
		}
	},
	// highContrast defaults to 'auto' (follows the OS); the button below overrides it.
	onHighContrastChange: enabled => {
		highContrast = enabled;
		applyChartContrast(enabled);
		updateLabels();
	},
});

function updateLabels(): void {
	const t = text();
	if (focusButton) {
		focusButton.textContent = t.focus;
	}
	if (liveButton) {
		liveButton.textContent = liveTimer === undefined ? t.startLive : t.stopLive;
	}
	if (scopeButton) {
		scopeButton.textContent = visibleScope ? t.scopeVisible : t.scopeAll;
	}
	if (contrastButton) {
		contrastButton.textContent = highContrast ? t.contrastOff : t.contrastOn;
	}
	if (fontButton) {
		fontButton.textContent = largeFont ? t.normalFont : t.largeFont;
	}
	if (soundButton) {
		soundButton.textContent = sound ? t.soundOff : t.soundOn;
	}
	if (captionsLabel) {
		captionsLabel.textContent = t.captions;
	}
}

/**
 * The runtime language switch the README advertises: one `applyOptions` call
 * swaps the announced strings, the `lang` of the announced regions and the pane
 * titles. Numbers and dates follow the chart's own `localization`.
 */
function applyLanguage(next: Language): void {
	language = next;
	const t = text();
	document.documentElement.lang = language;
	chart.applyOptions({
		localization: {
			locale: language,
			priceFormatter: (price: number) =>
				new Intl.NumberFormat(language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price),
		},
	});
	priceSeries.applyOptions({ title: t.price });
	averageSeries.applyOptions({ title: t.average });
	volumeSeries.applyOptions({ title: t.volume });
	applyAnnotations();
	accessibility.applyOptions({
		// An empty bundle falls back to the built-in English strings.
		messages: language === 'es' ? esMessages : {},
		lang: language,
		chartTitle: paneIndex => (paneIndex === 0 ? t.priceTitle : t.volumeTitle),
	});
	updateLabels();
	const url = new URL(window.location.href);
	if (language === 'es') {
		url.searchParams.set('lang', 'es');
	} else {
		url.searchParams.delete('lang');
	}
	window.history.replaceState(null, '', url);
}

if (languageSelect) {
	languageSelect.value = language;
	languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value as Language));
}

focusButton?.addEventListener('click', () => accessibility.focus(0));

contrastButton?.addEventListener('click', () => {
	accessibility.applyOptions({ highContrast: !highContrast });
});

// Larger chart text – the chart's own font is the developer's responsibility (the
// plugin's overlay already scales with the page font). See the Readability tutorial.
fontButton?.addEventListener('click', () => {
	largeFont = !largeFont;
	chart.applyOptions({ layout: { fontSize: largeFont ? 16 : 12 } });
	updateLabels();
});

soundButton?.addEventListener('click', () => {
	sound = !sound;
	updateLabels();
});

// Toggle whether announcements describe the default visible range or the whole
// data set.
scopeButton?.addEventListener('click', () => {
	visibleScope = !visibleScope;
	accessibility.applyOptions({ dataScope: visibleScope ? 'visible' : 'all' });
	updateLabels();
});

// --- Live data updates ---------------------------------------------------
// Stream a new bar into every series on an interval, exactly like a real-time
// feed. Each `series.update()` triggers the plugin, which announces the change
// through a polite aria-live region (by default, only the active pane).
const ONE_DAY = 24 * 60 * 60;
let lastTime = priceData[priceData.length - 1].time as number;
let lastPrice = priceData[priceData.length - 1].value;
let lastAverage = averageData[averageData.length - 1].value;

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

liveButton?.addEventListener('click', () => {
	if (liveTimer === undefined) {
		liveTimer = window.setInterval(streamNextPoint, 3000);
	} else {
		window.clearInterval(liveTimer);
		liveTimer = undefined;
	}
	updateLabels();
});

if (language !== 'en') {
	applyLanguage(language);
}
updateLabels();
