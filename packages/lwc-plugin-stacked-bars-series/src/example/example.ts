import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { createStackedBarsSeries } from '../stacked-bars-series';
import { StackedBarsColumnWidthMode } from '../options';
import { StackedBarsData } from '../data';
import { multipleBarData } from './sample-data';

type DemoData = StackedBarsData | CustomSeriesWhitespaceData<Time>;

// A whitespace gap and a stretch of negative values: the two states which used
// to render wrongly.
function demoData(): DemoData[] {
	return multipleBarData(3, 120, 20).map(
		(point: StackedBarsData, index: number): DemoData => {
			if (index >= 40 && index < 45) {
				return { time: point.time };
			}
			if (index >= 60 && index < 90) {
				return { ...point, values: [point.values[0], -point.values[1], point.values[2]] };
			}
			return point;
		}
	);
}

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		minBarSpacing: 3,
	},
}));

const series = createStackedBarsSeries(chart, {
	color: 'black', // for the price line
});
series.setData(demoData());
chart.timeScale().fitContent();

const widthMode = document.getElementById('width-mode') as HTMLSelectElement;
const percentMode = document.getElementById('percent-mode') as HTMLInputElement;
const radius = document.getElementById('radius') as HTMLInputElement;

function applyControls(): void {
	series.applyOptions({
		columnWidthMode: widthMode.value as StackedBarsColumnWidthMode,
		widthPercent: 60,
		radius: Number(radius.value),
		percent: percentMode.checked,
		// `priceValueBuilder` measures the raw values, so percent mode needs a
		// price range of its own.
		autoscaleInfoProvider: percentMode.checked
			? () => ({ priceRange: { minValue: -100, maxValue: 100 } })
			: undefined,
	});
}

widthMode.addEventListener('change', applyControls);
percentMode.addEventListener('change', applyControls);
radius.addEventListener('input', applyControls);
