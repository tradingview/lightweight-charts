import { WhitespaceData, createChart } from 'lightweight-charts';
import { CandleData, generateAlternativeCandleData } from './sample-data';
import { RoundedCandleSeries } from '../rounded-candles-series';
import { RoundedCandleRadius } from '../radius';
import { RoundedCandleWickLineCap } from '../options';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const series = chart.addCustomSeries(new RoundedCandleSeries(), {
	hoverDimOpacity: 0.25,
});

// Every tenth candle carries per-point `color`, `borderColor` and `wickColor`
// overrides, which win over the option colours.
const data: (CandleData | WhitespaceData)[] = generateAlternativeCandleData(60).map(
	(point: CandleData, index: number) => {
		if (index % 10 !== 0) {
			return point;
		}
		return {
			...point,
			color: 'rgba(41, 98, 255, 0.5)',
			borderColor: '#2962FF',
			wickColor: '#2962FF',
		};
	}
);
// A run of whitespace: those points have a time only, so no candle is drawn
// there and the candles on either side keep their own colouring.
for (let i = 40; i < 48; i++) {
	data[i] = { time: data[i].time };
}
series.setData(data);

const radiusSelect = document.getElementById('radius') as HTMLSelectElement;
const wickSelect = document.getElementById('wick') as HTMLSelectElement;
const borderSelect = document.getElementById('border') as HTMLSelectElement;

const autoRadius: RoundedCandleRadius = (barSpacing: number) =>
	barSpacing < 4 ? 0 : barSpacing / 3;

radiusSelect.addEventListener('change', () => {
	const value = radiusSelect.value;
	series.applyOptions({
		radius: value === 'auto' ? autoRadius : Number(value),
	});
});

wickSelect.addEventListener('change', () => {
	const value = wickSelect.value;
	series.applyOptions({
		wickVisible: value !== 'hidden',
		wickLineCap: (value === 'hidden'
			? 'butt'
			: value) as RoundedCandleWickLineCap,
	});
});

borderSelect.addEventListener('change', () => {
	const value = borderSelect.value;
	series.applyOptions({
		borderVisible: value !== 'none',
		borderUpColor: value === 'contrast' ? '#00695C' : '#26a69a',
		borderDownColor: value === 'contrast' ? '#B71C1C' : '#ef5350',
	});
});

chart.timeScale().fitContent();
