import { PartialAccessibilityMessages } from '../messages';

/**
 * Spanish translation of the announced strings, ready to pass as
 * {@link AccessibilityPaneOptions.messages} (with `lang: 'es'`). Only the wording
 * lives here – numbers and dates are localised by the chart's
 * `localization.locale`. Anything not listed falls back to the English
 * {@link defaultMessages}.
 *
 * Provided as a worked example of a complete translation; the strings are
 * illustrative rather than professionally reviewed.
 */
export const esMessages: PartialAccessibilityMessages = {
	roleDescription: 'Panel de gráfico interactivo',
	defaultChartTitle: 'Gráfico financiero interactivo',
	noValue: 'sin valor',
	inView: 'en vista',
	ohlc: { open: 'apertura', high: 'máximo', low: 'mínimo', close: 'cierre' },
	directions: { up: 'sube', down: 'baja', unchanged: 'sin cambios' },
	defaultSeriesLabel: position => `Serie ${position}`,
	paneLabel: ({ title, paneIndex, paneCount, seriesCount, seriesLabel }) => {
		const panePart = paneCount > 1 ? `Panel ${paneIndex + 1} de ${paneCount}. ` : '';
		const seriesPart =
			seriesCount > 1
				? `${seriesCount} series. `
				: seriesLabel
					? `${seriesLabel}. `
					: '';
		return `${title}. ${panePart}${seriesPart}Pulse H para ver la ayuda de teclado.`;
	},
	description: ({ multiSeries }) =>
		multiSeries
			? 'Use las flechas izquierda y derecha para moverse entre los puntos de datos, y las flechas arriba y abajo para cambiar de serie.'
			: 'Use las flechas izquierda y derecha para moverse entre los puntos de datos.',
	help: ({ multiSeries, pageStep }) =>
		`Controles de teclado. Las flechas izquierda y derecha se mueven entre los puntos de datos. ${multiSeries ? 'Las flechas arriba y abajo cambian de serie. ' : ''}Re Pág salta ${pageStep} puntos adelante, Av Pág ${pageStep} puntos atrás. Inicio y Fin saltan al primer y al último punto. Más y menos acercan y alejan el gráfico. Intro o Espacio lee un resumen de la serie.`,
	shortcutsHint: 'Pulse H para ver los atajos de teclado',
	shortcutsTitle: 'Atajos de teclado',
	shortcuts: ({ multiSeries, pageStep }) => [
		{ keys: '← / →', action: 'Moverse entre los puntos de datos' },
		...(multiSeries ? [{ keys: '↑ / ↓', action: 'Cambiar de serie' }] : []),
		{ keys: 'Re Pág / Av Pág', action: `Saltar ${pageStep} puntos` },
		{ keys: 'Inicio / Fin', action: 'Primer / último punto' },
		{ keys: '+ / −', action: 'Acercar / alejar' },
		// Intro / Espacio (el resumen hablado) se omite: no tiene efecto visible.
		{ keys: 'H', action: 'Mostrar u ocultar este panel' },
	],
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

Object.freeze(esMessages.ohlc);
Object.freeze(esMessages.directions);
Object.freeze(esMessages);
