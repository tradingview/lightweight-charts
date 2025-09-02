import { AutoscaleInfo, DeepPartial, HistogramData, SeriesDataItemTypeMap, SingleValueData, Time, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { PrettyHistogramSeries } from '../pretty-histogram-series';
import { PrettyHistogramSeriesOptions } from '../options';
import { PrettyHistogramData } from '../data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new PrettyHistogramSeries();

let autoscaleToZero = true;

const options: DeepPartial<PrettyHistogramSeriesOptions> = {
	autoscaleInfoProvider: (baseImplementation: () => AutoscaleInfo | null) => {
		const baseRes = baseImplementation();
		if (!autoscaleToZero) {
			return baseRes;
		}
		if (!baseRes?.priceRange) {
			return { priceRange: { minValue: 0, maxValue: 0 } };
		}
		const minValue = Math.min(baseRes.priceRange.minValue, 0);
		const maxValue = Math.max(baseRes.priceRange.maxValue, 0);
		return { ...baseRes, priceRange: { minValue, maxValue } };
	},
	radius: 6,
	widthPercent: 50,
};

const myCustomSeries = chart.addCustomSeries(customSeriesView, options);

const data: PrettyHistogramData<Time>[] = generateLineData(6);
data.forEach((item: PrettyHistogramData<Time>, i: number) => {
	(item as HistogramData<Time>).color = (i % 2) ? '#6438D6' : undefined;
});

myCustomSeries.setData(data);

chart.timeScale().fitContent();

data.forEach((item: (SeriesDataItemTypeMap<Time>['Custom'] & SingleValueData<Time>), i: number) => {
	const element = document.getElementById(`bar_${i + 1}`) as HTMLInputElement;
	element.value = item.value.toFixed(2);
	element.onchange = () => {
		const newValue = parseFloat(element.value);
		if (!isNaN(newValue)) {
			item.value = newValue;
			myCustomSeries.setData(data);
		}
	};
});

const radiusElement = document.getElementById('radius') as HTMLInputElement;
radiusElement.value = options.radius!.toString();
radiusElement.onchange = () => {
	const newRadius = parseFloat(radiusElement.value);
	if (newRadius >= 0) {
		options.radius = newRadius;
		myCustomSeries.applyOptions(options);
	}
}

const widthElement = document.getElementById('width') as HTMLInputElement;
widthElement.value = options.widthPercent!.toString();
widthElement.onchange = () => {
	const newWidth = parseFloat(widthElement.value);
	if (newWidth >= 0 && newWidth <= 100) {
		options.widthPercent = newWidth;
		myCustomSeries.applyOptions(options);
	}
};

const zeroAutoscaleElement = document.getElementById('autoscaleToZero') as HTMLInputElement;
zeroAutoscaleElement.checked = autoscaleToZero;
zeroAutoscaleElement.onchange = () => {
	autoscaleToZero = zeroAutoscaleElement.checked;
	myCustomSeries.applyOptions(options);
};
