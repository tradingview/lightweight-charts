import { CustomData } from 'lightweight-charts';

/**
 * _CLASSNAME_ Data
 */
export interface _CLASSNAME_Data extends CustomData {
	//* Define the structure of the data required for the series.
	//* You could also 'extend' an existing Lightweight Charts Data type like LineData or CandlestickData
	high: number;
	low: number;
}
