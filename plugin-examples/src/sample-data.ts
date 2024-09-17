import type { Time, WhitespaceData } from 'lightweight-charts';
import { OptionCandleStickData } from './plugins/optionx/tooltip-primitive';
import { OptionPriceSeriesData } from './plugins/option-price-series/data';
// import { parseCSV } from './utils';
import axios from 'axios';

type LineData = {
	time: Time;
	value: number;
};

export type CandleData = {
	time: Time;
	high: number;
	low: number;
	close: number;
	open: number;
};

let randomFactor = 25 + Math.random() * 25;
const samplePoint = (i: number) =>
	1 *
		(0.5 +
			Math.sin(i / 10) * 0.2 +
			Math.sin(i / 20) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 500) * 0.5) +
	200;

export function generateLineData(numberOfPoints: number = 500): LineData[] {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	// YYYY-MM-DD HH:mm:ss
	const date = new Date(Date.UTC(2023, 0, 1, 12, 0, 0, 0));
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = (date.getTime() / 1000) as Time;
		const value = samplePoint(i);
		res.push({
			time,
			value,
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

// generate list of option prices. the function takes as input the strike price and returns the option price for different expiries
// the function should return an array of objects with the following structure:
// {
// 	strike: number;
// 	expiry: Date;
// 	price: number;
// }
// The date should start from 1 June 2024 and the list should data for every week expiry for 3 months
// export function generateOptionPrices(strikePrice: number): OptionPriceSeriesData[] {
// 	const res: OptionPriceSeriesData[] = [];
// 	let expiryDate = new Date(Date.UTC(2023, 9, 1, 12, 0, 0, 0));
// 	const displayDelta = 0;
// 	for (let i = 0; i < 12; ++i) {
// 		const price = i * 5;
// 		res.push({
// 			strike: strikePrice,
// 			expiry: expiryDate,
// 			price: price,

// 			time: (expiryDate.getTime() / 1000) as Time,
// 			open: strikePrice + price,
// 			high: strikePrice + price + displayDelta,
// 			low: strikePrice + price,
// 			close: strikePrice + price + displayDelta,
// 		});
// 		// set the expiry date to the next week without affecting the existing entries
// 		const newExpiryDate = new Date(expiryDate);
// 		newExpiryDate.setUTCDate(newExpiryDate.getUTCDate() + 7);
// 		expiryDate = newExpiryDate;
// 	}
// 	return res;
// }


// Generate a list of option prices for a given ticker and strike price. It should read a csv file with the following columns:
// ticker, expiration, strike, option_closing_price
// The function should return an array of objects with the following structure:
// OptionPriceSeriesData

// export function generateOptionPricesFromCSV(ticker: string, strikePrice: number): OptionPriceSeriesData[] {
// 	let res: OptionPriceSeriesData[] = [];
// 	const displayDelta = 0;
// 	parseCSV(`/Users/aayushahuja/Documents/projects/optionx/dump/${ticker}_options_eod_20240601.csv`).then((data) => {
// 		console.log("data: ", data);
// 		data.map((d: any) => {
// 			res.push({
// 				strike: strikePrice,
// 				expiry: d.expiration,
// 				price: d.option_closing_price,
// 				time: d.expiration,
// 				open: strikePrice + d.option_closing_price,
// 				high: strikePrice + d.option_closing_price + displayDelta,
// 				low: strikePrice + d.option_closing_price,
// 				close: strikePrice + d.option_closing_price + displayDelta,
// 			});
// 		});
// 	});
// 	return res;
// }


export function generateCandleData(numberOfPoints: number = 250): CandleData[] {
	const lineData = generateLineData(numberOfPoints);
	return lineData.map((d, i) => {
		const randomRanges = [-1 * Math.random(), Math.random(), Math.random()].map(
			j => j * 10
		);
		const sign = Math.sin(Math.random() - 0.5);
		return {
			time: d.time,
			low: d.value + randomRanges[0],
			high: d.value + randomRanges[1],
			open: d.value + sign * randomRanges[2],
			close: samplePoint(i + 1),
		};
	});
}

// curl -X POST -H "Content-Type: application/json" -d '{"ticker":"AAPL"}' https://researchx.online:5010/getStockData
export async function fetchStockData(ticker: string): Promise<CandleData[]> {
	try {
	  const response = await axios.post('https://researchx.online:5010/getStockData', { ticker });
	  const stockData = response.data;


	//   console.log("stockData: ", stockData.result);
	  const returnData = stockData.result.map((d: any) => {
		const dateString = d.date.toString();
		// Convert YYYYMMDD to Date object at 1 PM UTC
		const year = parseInt(dateString.substring(0, 4));
		const month = parseInt(dateString.substring(4, 6)) - 1; // Months are 0-indexed
		const day = parseInt(dateString.substring(6, 8));
		const date = new Date(Date.UTC(year, month, day, 20, 0, 0)); // 20:00 UTC (8 PM)
		return {
			time: date.getTime() / 1000 as Time,
			open: d.open,
			high: d.high,
			low: d.low,
			close: d.close,
		};
	});
	//   console.log("stockData: ", returnData);
	  return returnData;
	} catch (error) {
	  console.error('Error fetching stock data:', error);
	  return [];
	}
  }
  
  // curl -X POST -H "Content-Type: application/json" -d '{"ticker":"AAPL"}' https://researchx.online:5010/getOptionData
  export async function fetchOptionData(ticker: string): Promise<OptionPriceSeriesData[][]> {
	try {
	  const response = await axios.post('https://researchx.online:5010/getOptionData', { ticker });
	  const optionData = response.data.result;

	  const returnData = optionData.map((strikeData: any) => 
		strikeData.data.map((d: any) => {
			const dateString = d.expiration.toString();
			// Convert YYYYMMDD to Date object at 1 PM UTC
			const year = parseInt(dateString.substring(0, 4));
			const month = parseInt(dateString.substring(4, 6)) - 1; // Months are 0-indexed
			const day = parseInt(dateString.substring(6, 8));
			const expiryDate = new Date(Date.UTC(year, month, day, 20, 0, 0)); // 20:00 UTC (8 PM)

		  return {
		  strike: strikeData.strike,
		  expiry: expiryDate,
		  price: d.option_closing_price,
		  time: expiryDate.getTime() / 1000 as Time,
		  open: strikeData.is_call ? strikeData.strike + d.option_closing_price : strikeData.strike - d.option_closing_price,
		  high: strikeData.is_call ? strikeData.strike + d.option_closing_price : strikeData.strike - d.option_closing_price,
		  low: strikeData.is_call ? strikeData.strike + d.option_closing_price : strikeData.strike - d.option_closing_price,
		  close: strikeData.is_call ? strikeData.strike + d.option_closing_price : strikeData.strike - d.option_closing_price,
		  isCall: strikeData.is_call,
		};
	  }));
	  return returnData;
	} catch (error) {
	  console.error('Error fetching option data:', error);
	  return [];
	}
  }

function randomNumber(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

function randomBar(lastClose: number) {
	const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	const high = +randomNumber(
		Math.max(open, close),
		Math.max(open, close) * 1.1
	).toFixed(2);
	const low = +randomNumber(
		Math.min(open, close) * 0.9,
		Math.min(open, close)
	).toFixed(2);
	return {
		open,
		high,
		low,
		close,
	};
}

export function generateAlternativeCandleData(
	numberOfPoints: number = 250
): CandleData[] {
	const lineData = generateLineData(numberOfPoints);
	let lastClose = lineData[0].value;
	return lineData.map(d => {
		const candle = randomBar(lastClose);
		lastClose = candle.close;
		return {
			time: d.time,
			low: candle.low,
			high: candle.high,
			open: candle.open,
			close: candle.close,
		};
	});
}

export function shuffleValuesWithLimit<T extends WhitespaceData[]>(
	arr: T,
	limit: number
): T {
	const n = arr.length;
	const originalTimes = arr.map(item => item.time);
	for (let i = 0; i < n; i++) {
		// Generate a random index within the limit
		const j =
			Math.floor(Math.random() * (Math.min(n - 1, i + limit) - i + 1)) + i;
		// Swap the current element with the randomly selected element
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	arr.forEach((item, index) => {
		item.time = originalTimes[index];
	});
	return arr;
}

function splitArrayIntoParts<T>(arr: T[], size: number): T[][] {
	const result = [];
	const length = arr.length;
	let start = 0;
	while (start < length) {
		result.push(arr.slice(start, start + size));
		start += size;
	}
	return result;
}

interface MultibarData extends WhitespaceData {
	values: number[];
}

export function multipleBarData(
	groups: number,
	numberPoints: number,
	shuffleLimit = 0
): MultibarData[] {
	const basePoints = generateLineData(groups * numberPoints).map(d => {
		return {
			...d,
			value: Math.max(d.value, 0), // prevent negative numbers
		};
	});
	let sets: LineData[][] = splitArrayIntoParts(basePoints, numberPoints);
	if (shuffleLimit > 0) {
		sets = sets.map(set => shuffleValuesWithLimit(set, shuffleLimit));
	}
	return sets[0].map((dataPoint, index) => {
		return {
			time: dataPoint.time,
			values: sets.map(set => set[index].value),
		};
	});
}
