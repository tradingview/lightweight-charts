import { Time, isBusinessDay } from 'lightweight-charts';

export interface _CLASSNAME_Options {
	//* Define the options for the primitive.
	fillColor: string;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export const defaultOptions: _CLASSNAME_Options = {
	//* Define the default values for all the primitive options.
	fillColor: 'rgba(200, 50, 100, 0.75)',
	labelColor: 'rgba(200, 50, 100, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
} as const;
