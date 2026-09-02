import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { _CLASSNAME_Options } from './options';

export class _CLASSNAME_PaneRenderer implements IPrimitivePaneRenderer {
	private _options: _CLASSNAME_Options;

	constructor(options: _CLASSNAME_Options) {
		this._options = options;
	}

	draw(target: CanvasRenderingTarget2D) {
		const options = this._options;
		if (!options.text) return;

		//* useMediaCoordinateSpace works in CSS pixels, so the same numbers used
		//* for the font size and padding options apply directly to the canvas.
		//* Use useBitmapCoordinateSpace instead when you need crisp hairlines.
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.font = `${options.fontSize}px ${options.fontFamily}`;
			ctx.textBaseline = 'top';

			const metrics = ctx.measureText(options.text);
			const textWidth = metrics.width;
			const textHeight = options.fontSize;

			const boxWidth = textWidth + options.padding * 2;
			const boxHeight = textHeight + options.padding * 2;

			const isRight = options.corner.endsWith('right');
			const isBottom = options.corner.startsWith('bottom');

			const x = isRight
				? scope.mediaSize.width - options.margin - boxWidth
				: options.margin;
			const y = isBottom
				? scope.mediaSize.height - options.margin - boxHeight
				: options.margin;

			ctx.beginPath();
			//* roundRect is supported by every browser the library targets.
			ctx.roundRect(x, y, boxWidth, boxHeight, options.borderRadius);
			ctx.fillStyle = options.backgroundColor;
			ctx.fill();
			if (options.borderColor) {
				ctx.strokeStyle = options.borderColor;
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			ctx.fillStyle = options.color;
			ctx.fillText(options.text, x + options.padding, y + options.padding);
		});
	}
}
