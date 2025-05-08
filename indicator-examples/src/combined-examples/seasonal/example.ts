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
	WhitespaceData,
} from 'lightweight-charts';
import { convertToLineData, generateMultipleYears } from '../../sample-data';
import { alignDataToYear, splitDataByYears } from './helpers';
import { calculateAveragePriceIndicatorValues } from '../../indicators/average-price/average-price-calculation';
import { calculateCorrelationIndicatorValues } from '../../indicators/correlation/correlation-calculation';
import { calculateMedianPriceIndicatorValues } from '../../indicators/median-price/median-price-calculation';
import { calculateMomentumIndicatorValues } from '../../indicators/momentum/momentum-calculation';
import { calculateMovingAverageIndicatorValues } from '../../indicators/moving-average/moving-average-calculation';
import { calculatePercentChangeIndicatorValues } from '../../indicators/percent-change/percent-change-calculation';
import { calculateProductIndicatorValues } from '../../indicators/product/product-calculation';
import { calculateRatioIndicatorValues } from '../../indicators/ratio/ratio-calculation';
import { calculateSpreadIndicatorValues } from '../../indicators/spread/spread-calculation';
import { calculateSumIndicatorValues } from '../../indicators/sum/sum-calculation';
import { calculateWeightedCloseIndicatorValues } from '../../indicators/weighted-close/weighted-close-calculation';

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

type IndicatorName = 'average price' | 'correlation' | 'median price' | 'momentum' | 'moving average' | 'percent change' | 'product' | 'ratio' | 'spread' | 'sum' | 'weighted close';
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
	fullData: (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[],
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
		case 'average price': {
			const fullAveragePriceData = calculateAveragePriceIndicatorValues(
				allSymbolOneData,
				{ }
			);
			addIndicatorByYear(
				'average price',
				fullAveragePriceData,
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
				fullCorrelationData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				}),
				1 // paneIndex for correlation
			);
			break;
		}
		case 'median price': {
			const fullMPData = calculateMedianPriceIndicatorValues(
				allSymbolOneData,
				{}
			);
			addIndicatorByYear(
				'median price',
				fullMPData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				})
			);
			break;
		}
		case 'momentum': {
			const fullMomentumData = calculateMomentumIndicatorValues(
				allSymbolOneData,
				{
					length: 10
				}
			);
			addIndicatorByYear(
				'momentum',
				fullMomentumData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				})
			);
			break;
		}
		case 'moving average': {
			const fullMAData = calculateMovingAverageIndicatorValues(
				allSymbolOneData,
				{
					length: 10,
					smoothingLength: 5,
					smoothingLine: 'SMA',
					source: 'close',
				}
			);
			addIndicatorByYear(
				'moving average',
				fullMAData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				})
			);
			break;
		}
		case 'percent change': {
			const fullPercentChangeData = calculatePercentChangeIndicatorValues(
				allSymbolOneData,
				{ }
			);
			addIndicatorByYear(
				'percent change',
				fullPercentChangeData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				}),
				1 // paneIndex for percent change
			);
			break;
		}
		case 'product': {
			const fullProductData = calculateProductIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false }
			);
			addIndicatorByYear(
				'product',
				fullProductData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				}),
				1 // paneIndex for product
			);
			break;
		}
		case 'ratio': {
			const fullSpreadData = calculateRatioIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false }
			);
			addIndicatorByYear(
				'ratio',
				fullSpreadData,
				year => ({
					color: colours[year as never] || 'black',
					lineStyle: LineStyle.Dashed,
					lineWidth: 1,
				})
			);
			break;
		}
		case 'spread': {
			const fullSpreadData = calculateSpreadIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false }
			);
			addIndicatorByYear(
				'spread',
				fullSpreadData,
				year => ({
					color: colours[year as never] || 'black',
					lineStyle: LineStyle.Dashed,
					lineWidth: 1,
				})
			);
			break;
		}
		case 'sum': {
			const fullSumData = calculateSumIndicatorValues(
				allSymbolOneData,
				allSymbolTwoData,
				{ allowMismatchedDates: false }
			);
			addIndicatorByYear(
				'sum',
				fullSumData,
				year => ({
					color: colours[year as never] || 'black',
					lineWidth: 1,
				})
			);
			break;
		}
		case 'weighted close': {
			const fullWCData = calculateWeightedCloseIndicatorValues(
				allSymbolOneData,
				{ }
			);
			addIndicatorByYear(
				'sum',
				fullWCData,
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
