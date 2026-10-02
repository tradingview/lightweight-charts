import { createChart, LineSeries } from 'lightweight-charts';
import { ImageWatermark, ImageWatermarkPane, type ImageWatermarkOptions, type ImageWatermarkPluginOptions } from '@tradingview/lwc-plugin-image-watermark';
import { ImageWatermark as Standalone, ImageWatermarkPane as StandalonePane } from '@tradingview/lwc-plugin-image-watermark/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof ImageWatermark, typeof Standalone>>();
expectTrue<Equal<typeof ImageWatermarkPane, typeof StandalonePane>>();
expectTrue<Equal<ImageWatermarkOptions, ImageWatermarkPluginOptions>>();
const chart = createChart(document.createElement('div'));
const series = chart.addSeries(LineSeries);
const watermark = new ImageWatermark();
series.attachPrimitive(watermark);
chart.panes()[0].attachPrimitive(new ImageWatermarkPane('logo.svg', { position: 'top-right' }));
watermark.applyOptions({
	position: { x: 0.5, y: 0.5 }, objectFit: 'contain', crossOrigin: 'anonymous',
	onError: (error, url) => {
		expectTrue<Equal<typeof error, unknown>>();
		expectTrue<Equal<typeof url, string>>();
	},
});
watermark.setImage('replacement.svg');
// @ts-expect-error Returned options are read-only.
watermark.options().visible = false;
// @ts-expect-error Unsupported image fit mode.
watermark.applyOptions({ objectFit: 'stretch' });
// @ts-expect-error Both anchor coordinates are required.
watermark.applyOptions({ position: { x: 0.5 } });
// @ts-expect-error Images are supplied as URLs.
watermark.setImage(new Image());
