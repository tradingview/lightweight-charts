import { LineSeries, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { type PreviewTheme, previewTheme, themeChart } from '@tradingview/lwc-plugin-preview-kit/preview-theme';
import imgUrl from './image.svg';
import darkImgUrl from './image-dark.svg';
import {
	ImageWatermark,
	WatermarkObjectFit,
	WatermarkPosition,
} from '../image-watermark';
import { generateLineData } from './sample-data';

// The catalogue preview: the series primitive on one pane. The dev demo next
// door adds the left price scale and the second pane with ImageWatermarkPane.
const chart = createChart('chart', { autoSize: true });

// The sample image is an opaque light card, which turns into a grey slab on
// the dark background, so the dark theme gets its own card.
const imageFor = (theme: PreviewTheme): string => (theme === 'dark' ? darkImgUrl : imgUrl);

const watermark = new ImageWatermark(imageFor(previewTheme()), {
	maxHeight: 400,
	maxWidth: 400,
	padding: 20,
	alpha: 0.4,
});

const series = chart.addSeries(LineSeries);
series.setData(generateLineData());
series.attachPrimitive(watermark);
// Created with the current theme's image above, so this only swaps it on a
// later switch; the same URL again is a no-op.
themeChart(chart, theme => watermark.setImage(imageFor(theme)));
let attached = true;

mountControls([
	{
		kind: 'select',
		label: 'Position',
		options: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
		onChange: value => watermark.applyOptions({ position: value as WatermarkPosition }),
	},
	{
		kind: 'select',
		label: 'Object fit',
		options: ['contain', 'cover', 'none'],
		onChange: value => watermark.applyOptions({ objectFit: value as WatermarkObjectFit }),
	},
	{
		kind: 'select',
		label: 'Alpha',
		options: ['0.4', '0.15', '0.7', '1'],
		onChange: value => watermark.applyOptions({ alpha: Number(value) }),
	},
	{
		kind: 'button',
		label: 'Detach',
		// The watermark keeps the image it has decoded, so re-attaching redraws
		// it without a second request.
		onClick: button => {
			if (attached) {
				series.detachPrimitive(watermark);
			} else {
				series.attachPrimitive(watermark);
			}
			attached = !attached;
			button.textContent = attached ? 'Detach' : 'Attach';
		},
	},
]);
