import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { StackedAreaGapHandling, StackedAreaLineType } from '../options';
import { StackedAreaData } from '../data';
import { createStackedAreaSeries } from '../stacked-area-series';
import { multipleBarData } from './sample-data';

type DemoData = StackedAreaData | CustomSeriesWhitespaceData<Time>;

// A whitespace gap and a stretch of negative values: the two states which used
// to render wrongly.
function demoData(): DemoData[] {
	return multipleBarData(5, 120, 2).map(
		(point: StackedAreaData, index: number): DemoData => {
			if (index >= 40 && index < 45) {
				return { time: point.time };
			}
			if (index >= 60 && index < 90) {
				return {
					...point,
					values: point.values.map((value: number, band: number): number =>
						band === 1 ? -value : value
					),
				};
			}
			return point;
		}
	);
}

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	rightPriceScale: {
		scaleMargins: {
			top: 0.05,
			bottom: 0.05,
		},
	},
}));

const series = createStackedAreaSeries(chart);
series.setData(demoData());
chart.timeScale().fitContent();

const lineType = document.getElementById('line-type') as HTMLSelectElement;
const gapHandling = document.getElementById('gap-handling') as HTMLSelectElement;
const percentMode = document.getElementById('percent-mode') as HTMLInputElement;

function applyControls(): void {
	series.applyOptions({
		lineType: lineType.value as StackedAreaLineType,
		gapHandling: gapHandling.value as StackedAreaGapHandling,
		percent: percentMode.checked,
		// `priceValueBuilder` measures the raw values, so percent mode needs a
		// price range of its own.
		autoscaleInfoProvider: percentMode.checked
			? () => ({ priceRange: { minValue: -100, maxValue: 100 } })
			: undefined,
	});
}

lineType.addEventListener('change', applyControls);
gapHandling.addEventListener('change', applyControls);
percentMode.addEventListener('change', applyControls);
