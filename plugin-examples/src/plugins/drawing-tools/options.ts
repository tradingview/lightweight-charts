import { isBusinessDay, Time } from "lightweight-charts";

export interface RectangleDrawingToolOptions {
	fillColor: string;
	previewFillColor: string;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export interface LineDrawingToolOptions {
	lineColor: string;
	previewLineColor: string;
	lineWidth: number;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export const defaultLineOptions: LineDrawingToolOptions = {
	lineColor: 'rgba(0 , 0, 0, 1)',
	previewLineColor: 'rgba(0, 0, 0, 0.5)',
	lineWidth: 2,
	labelColor: 'rgba(0, 0, 0, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month - 1, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
}; 

export const defaultRectangleOptions: RectangleDrawingToolOptions = {
	fillColor: 'rgba(200, 50, 100, 0.35)',
	previewFillColor: 'rgba(200, 50, 100, 0.25)',
	labelColor: 'rgba(200, 50, 100, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month - 1, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
};