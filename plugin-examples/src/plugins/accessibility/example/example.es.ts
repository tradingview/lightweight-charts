import {
	AreaSeries,
	HistogramSeries,
	LineSeries,
	Time,
	createChart,
} from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import {
	PartialAccessibilityMessages,
	addAccessibilityPlugin,
} from '../accessibility';

// Spanish translation of the announced strings. Only the wording lives here –
// numbers and dates are localised by the chart's `localization.locale` below.
// (Illustrative translations for the demo.)
const esMessages: PartialAccessibilityMessages = {
	roleDescription: 'Panel de gráfico interactivo',
	noValue: 'sin valor',
	inView: 'en vista',
	ohlc: { open: 'apertura', high: 'máximo', low: 'mínimo', close: 'cierre' },
	directions: { up: 'sube', down: 'baja', unchanged: 'sin cambios' },
	defaultSeriesLabel: position => `Serie ${position}`,
	paneLabel: ({ title, seriesCount, seriesLabel }) => {
		const seriesPart =
			seriesCount > 1
				? `${seriesCount} series. `
				: seriesLabel
					? `${seriesLabel}. `
					: '';
		return `${title}. ${seriesPart}Pulse H para ver la ayuda de teclado.`;
	},
	description: ({ multiSeries }) =>
		multiSeries
			? 'Use las flechas izquierda y derecha para moverse entre los puntos de datos, y las flechas arriba y abajo para cambiar de serie.'
			: 'Use las flechas izquierda y derecha para moverse entre los puntos de datos.',
	help: ({ multiSeries, pageStep }) =>
		`Controles de teclado. Las flechas izquierda y derecha se mueven entre los puntos de datos. ${multiSeries ? 'Las flechas arriba y abajo cambian de serie. ' : ''}Re Pág salta ${pageStep} puntos adelante, Av Pág ${pageStep} puntos atrás. Inicio y Fin saltan al primer y al último punto. Intro o Espacio lee un resumen de la serie.`,
	point: ({ position, total, time, label, values }) =>
		`${label} ${values}, ${time}. Punto ${position} de ${total}.`,
	seriesPosition: ({ label, position, total, point }) =>
		`${label}, serie ${position} de ${total}.${point}`,
	summary: ({ label, count, scopeNote, firstValue, firstTime, lastValue, lastTime, directionLabel, changeValue, percent, lowValue, lowTime, highValue, highTime }) =>
		`${label} con ${count} puntos de datos${scopeNote}. Desde ${firstValue} el ${firstTime} hasta ${lastValue} el ${lastTime}. En conjunto ${directionLabel} ${changeValue}${percent !== null ? `, ${percent} por ciento` : ''}. Mínimo ${lowValue} el ${lowTime}, máximo ${highValue} el ${highTime}.`,
	noData: ({ label, scopeNote }) => `${label}: no hay datos disponibles${scopeNote}.`,
	seriesUpdate: ({ label, count, scopeNote, latest }) =>
		`${label}, ${count} puntos de datos${scopeNote}. Último ${latest}`,
	dataUpdated: ({ summaries, total, shownMax }) => {
		if (total === 1) {
			return `Datos del gráfico actualizados. ${summaries[0]}.`;
		}
		const shown = summaries.slice(0, shownMax);
		const remaining = total > shown.length
			? ` ${total - shown.length} series más cambiaron.`
			: '';
		return `Datos del gráfico actualizados. ${total} series cambiaron. ${shown.join(' ')}.${remaining}`;
	},
};

const chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		rightOffset: 10,
		barSpacing: 8,
	},
	// Drives the localised dates and the percent's decimal separator in the
	// announcements (and the plugin's default `lang`). The price formatter makes
	// the spoken values Spanish too — the plugin reads it automatically, so an
	// already-localised chart gets localised announcements for free.
	localization: {
		locale: 'es',
		priceFormatter: (price: number) =>
			new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price),
	},
});

// --- Panel 0: dos series de precio (arriba/abajo cambia entre ellas) ---
const priceSeries = chart.addSeries(AreaSeries, {
	lineColor: 'rgb(41, 98, 255)',
	topColor: 'rgba(41, 98, 255, 0.4)',
	bottomColor: 'rgba(41, 98, 255, 0)',
	lineWidth: 2,
	title: 'Precio',
});
const priceData = generateLineData();
priceSeries.setData(priceData);

const averageSeries = chart.addSeries(LineSeries, {
	color: 'rgb(225, 87, 90)',
	lineWidth: 2,
	title: 'Media móvil',
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

// --- Panel 1: una serie de volumen en su propio panel ---
const volumeSeries = chart.addSeries(
	HistogramSeries,
	{ color: 'rgb(38, 166, 154)', title: 'Volumen' },
	1 // paneIndex – crea un segundo panel
);
volumeSeries.setData(
	priceData.map(point => ({ time: point.time, value: point.value * 10 }))
);

// Una sola llamada a nivel de gráfico: cada panel se anuncia en español.
const accessibility = addAccessibilityPlugin(chart, {
	chartTitle: paneIndex => paneIndex === 0 ? 'Gráfico de precios' : 'Gráfico de volumen',
	messages: esMessages,
	lang: 'es',
});

document.querySelector('#focus-button')?.addEventListener('click', () => {
	accessibility.focus(0);
});

// --- Actualizaciones de datos en vivo ------------------------------------
const ONE_DAY = 24 * 60 * 60;
let lastTime = priceData[priceData.length - 1].time as number;
let lastPrice = priceData[priceData.length - 1].value;
let lastAverage = averageData[averageData.length - 1].value;
let liveTimer: number | undefined;

function streamNextPoint(): void {
	lastTime += ONE_DAY;
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
		liveButton.textContent = 'Detener actualizaciones en vivo';
	} else {
		window.clearInterval(liveTimer);
		liveTimer = undefined;
		liveButton.textContent = 'Iniciar actualizaciones en vivo';
	}
});

// Cambia si los resúmenes describen el rango visible o todos los datos.
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
			? 'Anunciar: rango visible'
			: 'Anunciar: todos los datos';
	}
});
