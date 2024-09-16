import { createChart } from 'lightweight-charts';
// import { generateAlternativeCandleData, generateOptionPrices, generateOptionPricesFromCSV } from '../../../sample-data';
import { TooltipPrimitive } from '../tooltip-primitive';
import { OptionPriceSeries } from '../../option-price-series/option-price-series';
import { fetchStockData, fetchOptionData } from '../../../sample-data';
import { UTCTimestamp } from 'lightweight-charts';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	// timeScale: {
	// 	borderVisible: false,
	// },
	rightPriceScale: {
		borderVisible: true,
	},
	crosshair: {
        vertLine: {
            labelVisible: true,
			visible: true,
        },
        horzLine: {
            labelVisible: true,
			visible: true,
        },
    },
}));

// Function to get the date range
function getDateRange(data: any[]): [UTCTimestamp, UTCTimestamp] {
    let minDate = Infinity;
    let maxDate = -Infinity;
    data.forEach(point => {
        minDate = Math.min(minDate, point.time as number);
        maxDate = Math.max(maxDate, point.time as number);
    });
    return [minDate as UTCTimestamp, maxDate as UTCTimestamp];
}

// Function to create empty data
function createEmptyData(startDate: UTCTimestamp, endDate: UTCTimestamp): { time: UTCTimestamp }[] {
    const emptyData = [];
    for (let t = startDate; t <= endDate; t += 86400) { // 86400 seconds in a day
        emptyData.push({ time: t as UTCTimestamp });
    }
    return emptyData;
}

// stock candle stick
const candlestickSeries = chart.addCandlestickSeries();
const stockData = await fetchStockData('AAPL');
candlestickSeries.setData(stockData);

const optionData = await fetchOptionData('AAPL');
console.log('optionData: ', optionData);

// Get option data range
let optionStartDate = Infinity;
let optionEndDate = -Infinity;
optionData.forEach(series => {
    const [seriesStart, seriesEnd] = getDateRange(series);
    optionStartDate = Math.min(optionStartDate, seriesStart as number);
    optionEndDate = Math.max(optionEndDate, seriesEnd as number);
});

// Get stock data range
const [stockStartDate, stockEndDate] = getDateRange(stockData);

// Determine overall date range
const startDate = Math.min(stockStartDate as number, optionStartDate) as UTCTimestamp;
const endDate = Math.max(stockEndDate as number, optionEndDate) as UTCTimestamp;

// Create and add the empty series
const emptySeriesView = new OptionPriceSeries();
const emptySeries = chart.addCustomSeries(emptySeriesView, {
    color: 'transparent',
});
emptySeries.setData(createEmptyData(startDate, endDate));


// optionData is an array of arrays, each sub-array is a set of option prices for a given strike and expiration
// need to create a custom series for each set of option prices
// then attach a new tooltip primitive to each custom series
// create a custom series for each set of option prices
optionData.forEach((data) => {

	const customSeriesView = new OptionPriceSeries();
	const optionPriceSeries = chart.addCustomSeries(customSeriesView, {
		color: 'blue', // TESTING: shouldn't see this because we are coloring each bar later
	});
	const tooltipPrimitive = new TooltipPrimitive({
		lineColor: 'rgba(0, 0, 0, 0.2)',
		tooltip: {
			followMode: 'tracking',
		},
	});
	optionPriceSeries.setData(data);
	optionPriceSeries.attachPrimitive(tooltipPrimitive);
});

// Set the visible range for both time and price scales
// add 5 days to the end date
const endDatePlusNDays = (endDate as number) + 40 * 86400;
// console.log('endDatePlusNDays: ', endDatePlusNDays);
// console.log('endDate: ', endDate);
chart.timeScale().setVisibleRange({
    from: startDate,
    to: endDatePlusNDays as UTCTimestamp,
});
// chart.priceScale('right').fitContent();

const trackingButtonEl = document.querySelector('#tracking-button');
const topButtonEl = document.querySelector('#top-button');
// default to tracking
if (topButtonEl) topButtonEl.classList.add('grey');

if (trackingButtonEl) {
	trackingButtonEl.addEventListener('click', function () {
		trackingButtonEl.classList.remove('grey');
		if (topButtonEl) topButtonEl.classList.add('grey');
		tooltipPrimitive.applyOptions({
			tooltip: {
				followMode: 'tracking',
			},
		});
	});
}

if (topButtonEl) {
	topButtonEl.addEventListener('click', function () {
		topButtonEl.classList.remove('grey');
		if (trackingButtonEl) trackingButtonEl.classList.add('grey');
		tooltipPrimitive.applyOptions({
			tooltip: {
				followMode: 'top',
			},
		});
	});
}
