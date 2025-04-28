import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	ISeriesApi,
	Time,
	UTCTimestamp,
	LineSeriesPartialOptions,
	SeriesType,
	LineData,
	LineStyle,
} from 'lightweight-charts';
import { convertToLineData, generateMultipleYears } from '../../sample-data';
import { calculateSpreadIndicatorValues } from '../../indicators/spread/spread';
import { alignDataToYear, splitDataByYears } from './helpers';
import { calculateCorrelationIndicatorValues } from '../../indicators/correlation/correlation';
import { calculateMovingAverageIndicatorValues } from '../../indicators/moving-average/moving-average';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

// ... (imports and other code unchanged)

const allYears = [2021, 2022, 2023, 2024, 2025] as const;
let selectedYears: (typeof allYears)[number][] = [...allYears];

const fakeYear = 2024;

const colours: Record<(typeof allYears)[number], string> = {
	2021: 'red',
	2022: 'purple',
	2023: 'blue',
	2024: 'green',
	2025: 'black',
};

const symbolOneDataYears = generateMultipleYears(allYears);
const symbolTwoDataYears = generateMultipleYears(allYears);

const allSymbolOneData = allYears.flatMap(y => symbolOneDataYears[y], Infinity);
const allSymbolTwoData = allYears.flatMap(y => symbolTwoDataYears[y], Infinity);

const chart = createChart('chart', chartOptions);

const commonSeriesOptions: LineSeriesPartialOptions = {
	priceLineVisible: false,
};

const yearSeries: Map<
	(typeof allYears)[number],
	ISeriesApi<'Line', Time>
> = new Map();

function drawYearSeries() {
	// Remove all old series
	for (const [_year, series] of yearSeries.entries()) {
		chart.removeSeries(series);
	}
	yearSeries.clear();

	// Add only selected years
	for (const year of selectedYears) {
		const series = chart.addSeries(LineSeries, {
			...commonSeriesOptions,
			color: colours[year],
		});
		const data = alignDataToYear(
			convertToLineData(symbolOneDataYears[year]),
			fakeYear
		);
		series.setData(data);
		yearSeries.set(year, series);
	}
	chart.timeScale().fitContent();
}

type IndicatorName = 'spread' | 'correlation' | 'moving average';
type AppliedIndicatorsMap = Map<IndicatorName, ISeriesApi<SeriesType>>;
const indicatorsByYear: Map<number, AppliedIndicatorsMap> = new Map();
for (const year of allYears) {
	indicatorsByYear.set(year, new Map());
}

function clearIndicators() {
	for (const appliedIndicators of indicatorsByYear.values()) {
		for (const series of appliedIndicators.values()) {
			chart.removeSeries(series);
		}
		appliedIndicators.clear();
	}
}

function addIndicatorByYear(
	indicatorName: IndicatorName,
	fullData: LineData<UTCTimestamp>[],
	seriesOptionsFn: (year: number) => LineSeriesPartialOptions,
	paneIndex?: number
) {
	const dataByYear = splitDataByYears(fullData);
	for (const year of selectedYears) {
		const yearData = dataByYear[year];
		if (yearData) {
			const options = seriesOptionsFn(year);
			const series = chart.addSeries(
				LineSeries,
				options,
				paneIndex
			) as ISeriesApi<'Line', Time>;
			series.setData(alignDataToYear(yearData, fakeYear));
			indicatorsByYear.get(year)?.set(indicatorName, series);
		}
	}
}

let currentIndicator: IndicatorName | null = null;

function changeIndicator(name: IndicatorName | null): void {
	clearIndicators();
	if (!name) return;
	switch (name) {
		case 'spread': {
			const fullSpreadData = calculateSpreadIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false }
			);
			addIndicatorByYear(
				'spread',
				fullSpreadData as LineData<UTCTimestamp>[],
				year => ({
					color: colours[year as never] || 'black',
					lineStyle: LineStyle.Dashed,
					lineWidth: 1,
				})
			);
			break;
		}
		case 'correlation': {
			const fullCorrelationData = calculateCorrelationIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false, length: 10 }
			);
			addIndicatorByYear(
				'correlation',
				fullCorrelationData as LineData<UTCTimestamp>[],
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				}),
				1 // paneIndex for correlation
			);
			break;
		}
		case 'moving average': {
			const fullMAData = calculateMovingAverageIndicatorValues(
				allSymbolOneData,
				{ length: 10, smoothingLength: 5, smoothingLine: 'SMA', source: 'close' }
			);
			console.log(fullMAData);
			addIndicatorByYear(
				'moving average',
				fullMAData as LineData<UTCTimestamp>[],
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				})
			);
			break;
		}
		default:
			break;
	}
}

function redrawEverything() {
	drawYearSeries();
	changeIndicator(currentIndicator);
}

// --- DOM wiring ---

const indicatorSelect =
	document.querySelector<HTMLSelectElement>('#indicator-select');
if (!indicatorSelect) {
	throw new Error('Unable to locate indicator selector element on the page');
}
indicatorSelect.addEventListener('change', () => {
	const value = indicatorSelect.value.toLowerCase();
	if (value === 'none') {
		currentIndicator = null;
	} else {
		currentIndicator = value as IndicatorName;
	}
	changeIndicator(currentIndicator);
});

// --- Year checkboxes wiring ---
const checkboxContainer =
	document.querySelector<HTMLDivElement>('#year-select-row');
for (const year of allYears) {
	const label = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.classList.add('year-checkbox');
	checkbox.value = year.toString();
	checkbox.checked = true;
	label.innerText = year.toString();
	label.appendChild(checkbox);
	checkboxContainer?.appendChild(label);
	checkbox.addEventListener('change', () => {
		const yearCheckboxes = Array.from(
			document.querySelectorAll<HTMLInputElement>('.year-checkbox')
		);
		selectedYears = yearCheckboxes
			.filter(cb => cb.checked)
			.map(cb => parseInt(cb.value, 10) as (typeof allYears)[number]);
		redrawEverything();
	});
}

// Initial draw
drawYearSeries();
