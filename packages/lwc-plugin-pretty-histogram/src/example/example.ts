import { AutoscaleInfo, DeepPartial, HistogramData, Time, createChart } from 'lightweight-charts';
import { generateLineData } from './sample-data';
import { PrettyHistogramSeries } from '../pretty-histogram';
import { PrettyHistogramSeriesOptions } from '../options';
import { PrettyHistogramData } from '../data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new PrettyHistogramSeries();

const options: DeepPartial<PrettyHistogramSeriesOptions> = {
	autoscaleInfoProvider: (baseImplementation: () => AutoscaleInfo | null) => {
		const baseRes = baseImplementation();
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
